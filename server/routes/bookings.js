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

// Create new booking with image uploads
router.post('/', upload.fields([
  { name: 'inspirationImages', maxCount: 10 },
  { name: 'currentHair_front', maxCount: 1 },
  { name: 'currentHair_back', maxCount: 1 },
  { name: 'currentHair_top', maxCount: 1 }
]), [
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('customerEmail').isEmail().withMessage('Valid email is required'),
  body('customerPhone').notEmpty().withMessage('Phone number is required'),
  body('service').notEmpty().withMessage('Service is required'),
  body('appointmentDate').isISO8601().withMessage('Valid date is required'),
  body('appointmentTime').notEmpty().withMessage('Appointment time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      service,
      appointmentDate,
      appointmentTime,
      notes,
      joinLoyalty
    } = req.body;

    // Check if service exists and is active
    const serviceDoc = await prisma.service.findUnique({
      where: { id: service }
    });
    if (!serviceDoc) {
      return res.status(400).json({ message: 'Service not found or inactive' });
    }

    // Check for existing booking at same time
    const existingBooking = await prisma.booking.findFirst({
      where: {
        bookingDate: new Date(appointmentDate),
        bookingTime: appointmentTime,
        status: { in: ['pending', 'confirmed'] }
      }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Time slot already booked' });
    }


    // Process uploaded images
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

    // Start a transaction
    const booking = await prisma.$transaction(async (prisma) => {
      // Create booking
      const newBooking = await prisma.booking.create({
        data: {
          customerName,
          customerEmail,
          customerPhone,
          service: serviceDoc.name,
          bookingDate: new Date(appointmentDate),
          bookingTime: appointmentTime,
          status: 'pending',
          notes: notes || '',
          inspirationImages: inspirationImages.length > 0 ? inspirationImages : undefined,
          currentHairImages: Object.keys(currentHairImages).length > 0 ? currentHairImages : undefined
        }
      });

      // Handle loyalty program opt-in if selected
      if (joinLoyalty === 'true' || joinLoyalty === true) {
        // Check if customer already exists in loyalty program
        let customerLoyalty = await prisma.customerLoyalty.findUnique({
          where: { customerEmail }
        });

        if (!customerLoyalty) {
          // Add customer to loyalty program
          customerLoyalty = await prisma.customerLoyalty.create({
            data: {
              customerName,
              customerEmail,
              customerPhone,
              points: 0
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
      appointmentDate,
      appointmentTime,
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
    console.error('Booking creation error:', error);
    res.status(500).json({ message: 'Server error' });
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

module.exports = router;
