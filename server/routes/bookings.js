const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const staffAuth = require('../middleware/staffAuth');
const { sendBookingConfirmation } = require('../utils/email');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/bookings';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const router = express.Router();

// Middleware to handle both JSON and FormData
const handleBookingData = (req, res, next) => {
  // Check if it's JSON request
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    // For JSON requests, skip multer
    return next();
  } else {
    // For FormData requests, use multer
    return upload.fields([
      { name: 'inspirationImages', maxCount: 10 },
      { name: 'currentHair_front', maxCount: 1 },
      { name: 'currentHair_back', maxCount: 1 },
      { name: 'currentHair_top', maxCount: 1 }
    ])(req, res, next);
  }
};

// Create new booking with optional image uploads
router.post('/', handleBookingData, [
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('customerEmail').isEmail().withMessage('Valid email is required'),
  body('customerPhone').notEmpty().withMessage('Phone number is required'),
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('appointmentDate').optional().isISO8601().withMessage('Valid date is required'),
  body('bookingDate').optional().notEmpty().withMessage('Valid date is required'),
  body('appointmentTime').optional().notEmpty().withMessage('Appointment time is required'),
  body('bookingTime').optional().notEmpty().withMessage('Appointment time is required')
], async (req, res) => {
  try {
    console.log('📝 Booking creation request:', {
      body: req.body,
      files: req.files ? Object.keys(req.files) : 'none'
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      serviceId,
      service, // Legacy field name
      variantIds = [],
      bookingDate,
      appointmentDate,
      bookingTime,
      appointmentTime,
      totalDuration,
      notes,
      joinLoyalty
    } = req.body;

    // Handle field name variations for backward compatibility
    const finalServiceId = serviceId || service;
    const finalBookingDate = bookingDate || appointmentDate;
    const finalBookingTime = bookingTime || appointmentTime;

    // Validate required fields after field mapping
    if (!finalServiceId) {
      return res.status(400).json({ message: 'Service ID is required' });
    }
    if (!finalBookingDate) {
      return res.status(400).json({ message: 'Booking date is required' });
    }
    if (!finalBookingTime) {
      return res.status(400).json({ message: 'Booking time is required' });
    }

    // Check if service exists and is active
    const serviceDoc = await prisma.service.findUnique({
      where: { id: finalServiceId, isActive: true },
      include: {
        category: true,
        variants: {
          where: { isActive: true }
        }
      }
    });

    if (!serviceDoc) {
      return res.status(400).json({ message: 'Service not found or inactive' });
    }

    // Validate selected variants and calculate total duration
    let calculatedDuration = serviceDoc.baseDuration;
    let validVariants = [];

    if (variantIds.length > 0) {
      validVariants = await prisma.serviceVariant.findMany({
        where: {
          id: { in: variantIds },
          serviceId: finalServiceId,
          isActive: true
        }
      });

      if (validVariants.length !== variantIds.length) {
        return res.status(400).json({ message: 'Invalid service variants selected' });
      }

      // Calculate total duration including variant modifiers
      const totalDurationModifier = validVariants.reduce((sum, variant) => {
        return sum + (variant.durationModifier || 0);
      }, 0);

      calculatedDuration = serviceDoc.baseDuration + totalDurationModifier;
    }

    // Check for existing booking at same time
    const existingBooking = await prisma.booking.findFirst({
      where: {
        bookingDate: new Date(finalBookingDate),
        bookingTime: finalBookingTime,
        status: { in: ['pending', 'confirmed'] }
      }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Time slot already booked' });
    }


    // Process uploaded images (for FormData requests)
    const inspirationImages = [];
    const currentHairImages = {};

    if (req.files) {
      // Process inspiration images
      if (req.files.inspirationImages) {
        req.files.inspirationImages.forEach(file => {
          inspirationImages.push(`/uploads/bookings/${file.filename}`);
        });
      }

      // Process current hair images
      ['front', 'back', 'top'].forEach(angle => {
        const fieldName = `currentHair_${angle}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          currentHairImages[angle] = `/uploads/bookings/${req.files[fieldName][0].filename}`;
        }
      });
    }

    // For JSON requests, images will be empty arrays/objects (handled by database defaults)

    // Start a transaction
    const booking = await prisma.$transaction(async (prisma) => {
      // Create booking
      const newBooking = await prisma.booking.create({
        data: {
          customerName,
          customerEmail,
          customerPhone,
          serviceId: serviceDoc.id,
          bookingDate: new Date(finalBookingDate),
          bookingTime: finalBookingTime,
          status: 'pending',
          notes: notes || '',
          totalPrice: null, // Will be set by staff when confirming
          totalDuration: totalDuration || calculatedDuration,
          inspirationImages: inspirationImages.length > 0 ? inspirationImages : [],
          currentHairImages: Object.keys(currentHairImages).length > 0 ? currentHairImages : null,
          joinLoyalty: joinLoyalty === 'true' || joinLoyalty === true
        }
      });

      // Create booking service variant relationships
      if (variantIds.length > 0) {
        const bookingVariants = variantIds.map(variantId => ({
          bookingId: newBooking.id,
          variantId: variantId
        }));

        await prisma.bookingServiceVariant.createMany({
          data: bookingVariants
        });
      }

      // Handle loyalty program opt-in if selected
      if (joinLoyalty === 'true' || joinLoyalty === true) {
        // Check if customer already exists in loyalty program
        let customerLoyalty = await prisma.customerLoyalty.findUnique({
          where: { customerEmail }
        });

        if (!customerLoyalty) {
          // First, create or find customer record
          let customer = await prisma.customer.findUnique({
            where: { email: customerEmail }
          });

          if (!customer) {
            customer = await prisma.customer.create({
              data: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone
              }
            });
          }

          // Now create loyalty program entry with customerId
          customerLoyalty = await prisma.customerLoyalty.create({
            data: {
              customerId: customer.id,
              customerName,
              customerEmail,
              customerPhone,
              totalPoints: 0,
              lifetimePoints: 0
            }
          });
        }

        // Get loyalty program settings
        const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
          where: { isActive: true }
        });

        if (loyaltyProgram) {
          // Calculate points for this booking
          const pointsEarned = loyaltyProgram.pointsPerBooking;
          
          // Add points to customer's account
          await prisma.customerLoyalty.update({
            where: { id: customerLoyalty.id },
            data: {
              points: {
                increment: pointsEarned
              },
              lastActivity: new Date()
            }
          });

          // Record points history
          await prisma.pointsHistory.create({
            data: {
              customerLoyaltyId: customerLoyalty.id,
              points: pointsEarned,
              type: 'BOOKING',
              referenceId: newBooking.id,
              description: `Earned ${pointsEarned} points for booking #${newBooking.id}`
            }
          });

          // Update booking with loyalty info
          await prisma.booking.update({
            where: { id: newBooking.id },
            data: {
              loyaltyPointsEarned: pointsEarned,
              customerLoyaltyId: customerLoyalty.id
            }
          });
        }
      }

      return newBooking;
    });

    // Prepare booking data for email
    const bookingEmailData = {
      customerName,
      customerEmail,
      service: serviceDoc.name,
      appointmentDate: finalBookingDate,
      appointmentTime: finalBookingTime,
      notes: notes || '',
      joinLoyalty: joinLoyalty === 'true' || joinLoyalty === true,
      loyaltyPointsEarned: 0
    };

    // Add loyalty points if applicable
    if (joinLoyalty === 'true' || joinLoyalty === true) {
      const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
        where: { isActive: true }
      });
      
      if (loyaltyProgram) {
        bookingEmailData.loyaltyPointsEarned = loyaltyProgram.pointsPerBooking;
      }
    }

    // Send confirmation email
    try {
      await sendBookingConfirmation(bookingEmailData);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Booking creation error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all bookings (admin/staff only)
router.get('/', staffAuth, async (req, res) => {
  try {
    console.log('📅 GET /api/bookings - Query params:', req.query);
    const { page = 1, limit = 10, status, date, startDate, endDate, stylist } = req.query;

    // Build Prisma where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    // Handle date filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        where.bookingDate = {
          gte: start,
          lte: end
        };
      }
    } else if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.bookingDate = {
        gte: startDate,
        lt: endDate
      };
    }

    if (stylist) {
      where.stylist = stylist;
    }

    // Determine if we should use pagination
    const usePagination = !startDate || !endDate;

    // Get bookings with Prisma
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            isActive: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' },
        { bookingDate: 'asc' },
        { bookingTime: 'asc' }
      ],
      ...(usePagination && {
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      })
    });

    const total = await prisma.booking.count({ where });

    // Ensure dates are properly serialized
    const serializedBookings = bookings.map(booking => ({
      ...booking,
      bookingDate: booking.bookingDate.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString()
    }));

    console.log('✅ Bookings query successful - Found:', serializedBookings.length, 'bookings');
    
    res.json({
      bookings: serializedBookings,
      totalPages: usePagination ? Math.ceil(total / parseInt(limit)) : 1,
      currentPage: usePagination ? parseInt(page) : 1,
      total
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Update booking status
router.patch('/:id/status', staffAuth, [
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // If booking is marked as completed, add loyalty points
    if (status === 'completed') {
      try {
        // Check if loyalty program is active
        const loyaltyProgram = await prisma.loyaltyProgram.findFirst({ where: { isActive: true } });
        
        if (loyaltyProgram) {
          // Find or create customer loyalty record
          let customerLoyalty = await prisma.customerLoyalty.findFirst({ 
            where: { customerEmail: booking.customerEmail.toLowerCase() }
          });
          
          if (!customerLoyalty) {
            // Create new customer loyalty record
            customerLoyalty = await prisma.customerLoyalty.create({
              data: {
                customerEmail: booking.customerEmail.toLowerCase(),
                customerName: booking.customerName,
                customerPhone: booking.customerPhone,
                totalPoints: 0,
                lifetimePoints: 0
              }
            });
          }
          
          // Add points for completed booking
          const pointsToAdd = loyaltyProgram.pointsPerBooking || 10;
          await prisma.customerLoyalty.update({
            where: { id: customerLoyalty.id },
            data: {
              totalPoints: { increment: pointsToAdd },
              lifetimePoints: { increment: pointsToAdd }
            }
          });
        }
      } catch (loyaltyError) {
        console.error('Loyalty program error:', loyaltyError);
        // Don't fail the status update if loyalty program fails
      }
    }

    res.json({ 
      message: 'Booking status updated', 
      booking,
      loyaltyPointsAdded: status === 'completed' ? true : undefined
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking (general update endpoint)
router.patch('/:id', staffAuth, async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, bookingDate, bookingTime, notes, status } = req.body;
    
    const updateData = {};
    if (customerName) updateData.customerName = customerName;
    if (customerEmail) updateData.customerEmail = customerEmail;
    if (customerPhone) updateData.customerPhone = customerPhone;
    if (bookingDate) updateData.bookingDate = new Date(bookingDate);
    if (bookingTime) updateData.bookingTime = bookingTime;
    if (notes) updateData.notes = notes;
    if (status) updateData.status = status;
    
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available time slots for a date
router.get('/availability/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedSlots = await prisma.booking.findMany({
      where: {
        bookingDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: { in: ['pending', 'confirmed'] }
      },
      select: {
        bookingTime: true
      }
    });

    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];

    const bookedTimes = bookedSlots.map(slot => slot.bookingTime);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({ availableSlots });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available time slots for a date range
router.get('/availability', async (req, res) => {
  try {
    const { startDate, endDate, serviceId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ensure valid date range
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Limit to reasonable date range (14 days max)
    const dayDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (dayDiff > 14) {
      return res.status(400).json({ message: 'Date range too large (max 14 days)' });
    }

    // Get all bookings in the date range
    const where = {
      bookingDate: { gte: start, lte: end },
      status: { in: ['pending', 'confirmed'] }
    };
    
    // Note: staffId filtering removed as bookings no longer have staff assignment
    
    const bookings = await prisma.booking.findMany({
      where,
      select: {
        bookingDate: true,
        bookingTime: true
      }
    });
    
    // Generate all dates in the range
    const dates = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Default time slots
    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];
    
    // Create availability map
    const availableSlots = {};
    
    // For each date, determine available slots
    for (const date of dates) {
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Skip Sundays (0 = Sunday)
      if (date.getDay() === 0) {
        availableSlots[dateString] = [];
        continue;
      }
      
      // Find bookings for this specific date
      const dayBookings = bookings.filter(booking => 
        booking.bookingDate.toISOString().split('T')[0] === dateString
      );
      
      const bookedTimes = dayBookings.map(booking => booking.bookingTime);
      availableSlots[dateString] = allSlots.filter(slot => !bookedTimes.includes(slot));
    }
    
    res.json({ availableSlots });
  } catch (error) {
    console.error('Get availability range error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available time slots for a specific date considering service duration
router.get('/available-slots', async (req, res) => {
  try {
    const { date, duration = 60 } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Get all bookings for the requested date
    const existingBookings = await prisma.booking.findMany({
      where: {
        bookingDate: requestedDate,
        status: { in: ['pending', 'confirmed'] }
      },
      select: {
        bookingTime: true,
        totalDuration: true
      }
    });

    // Define business hours (9 AM to 6 PM)
    const businessStart = 9 * 60; // 9:00 AM in minutes
    const businessEnd = 18 * 60;  // 6:00 PM in minutes
    const slotInterval = 30; // 30-minute intervals
    const serviceDuration = parseInt(duration);

    // Generate all possible time slots
    const allSlots = [];
    for (let time = businessStart; time <= businessEnd - serviceDuration; time += slotInterval) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      allSlots.push({
        time: timeString,
        startMinutes: time,
        endMinutes: time + serviceDuration
      });
    }

    // Filter out slots that conflict with existing bookings
    const availableSlots = allSlots.filter(slot => {
      return !existingBookings.some(booking => {
        const bookingStartMinutes = timeStringToMinutes(booking.bookingTime);
        const bookingEndMinutes = bookingStartMinutes + (booking.totalDuration || 60);

        // Check if there's any overlap
        return (
          (slot.startMinutes < bookingEndMinutes) &&
          (slot.endMinutes > bookingStartMinutes)
        );
      });
    });

    res.json({
      success: true,
      slots: availableSlots.map(slot => slot.time),
      date: date,
      duration: serviceDuration
    });

  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available slots',
      error: error.message
    });
  }
});

// Staff: Confirm booking with pricing
router.patch('/:id/confirm', staffAuth, [
  body('totalPrice').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { totalPrice, notes } = req.body;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            category: true
          }
        },
        serviceVariants: {
          include: {
            variant: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in pending status'
      });
    }

    // Update booking with price and confirm
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        totalPrice: parseFloat(totalPrice),
        status: 'confirmed',
        notes: notes || booking.notes
      },
      include: {
        service: {
          include: {
            category: true
          }
        },
        serviceVariants: {
          include: {
            variant: true
          }
        }
      }
    });

    // Send confirmation email to customer
    try {
      await sendBookingConfirmationEmail(updatedBooking);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm booking',
      error: error.message
    });
  }
});

// Helper function to send booking confirmation email
async function sendBookingConfirmationEmail(booking) {
  const nodemailer = require('nodemailer');

  // Skip email if not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured - skipping email notification');
    return;
  }

  // Configure email transporter
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Format service variants for email
  const selectedVariants = booking.serviceVariants.map(sv => sv.variant.name).join(', ');

  const emailContent = `
    <h2>Booking Confirmation - Glam Elegance</h2>

    <p>Dear ${booking.customerName},</p>

    <p>Your service request has been confirmed! Here are the details:</p>

    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>Service Details</h3>
      <p><strong>Service:</strong> ${booking.service.name}</p>
      <p><strong>Category:</strong> ${booking.service.category.name}</p>
      ${selectedVariants ? `<p><strong>Options:</strong> ${selectedVariants}</p>` : ''}
      <p><strong>Duration:</strong> ${booking.totalDuration} minutes</p>

      <h3>Appointment Details</h3>
      <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${booking.bookingTime}</p>

      <h3>Pricing</h3>
      <p><strong>Total Price:</strong> $${booking.totalPrice}</p>

      ${booking.notes ? `<h3>Notes</h3><p>${booking.notes}</p>` : ''}
    </div>

    <p>We look forward to seeing you!</p>

    <p>Best regards,<br>
    The Glam Elegance Team</p>

    <hr>
    <p style="font-size: 12px; color: #666;">
      If you need to make changes to your appointment, please contact us as soon as possible.
    </p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@glamelegance.com',
    to: booking.customerEmail,
    subject: 'Booking Confirmation - Glam Elegance',
    html: emailContent
  };

  await transporter.sendMail(mailOptions);
}

// Helper function to convert time string to minutes
function timeStringToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

module.exports = router;
