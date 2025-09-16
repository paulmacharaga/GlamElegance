const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
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
      stylist,
      appointmentDate,
      appointmentTime,
      notes
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

    // Validate staff if provided
    let staffDoc = null;
    if (stylist) {
      staffDoc = await prisma.staff.findUnique({
        where: { id: stylist }
      });
      if (!staffDoc || !staffDoc.isActive) {
        return res.status(400).json({ message: 'Staff member not found or inactive' });
      }
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

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        serviceId: serviceDoc.id,
        staffId: staffDoc ? staffDoc.id : null,
        bookingDate: new Date(appointmentDate),
        bookingTime: appointmentTime,
        notes,
        inspirationImages,
        currentHairImages: Object.keys(currentHairImages).length > 0 ? currentHairImages : null,
        status: 'pending'
      },
      include: {
        service: true,
        staff: true
      }
    });

    // Send confirmation email
    try {
      await sendBookingConfirmation({
        customerName,
        customerEmail,
        serviceName: serviceDoc.name,
        appointmentDate,
        appointmentTime,
        staffName: staffDoc ? staffDoc.name : 'Any available stylist'
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
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
router.get('/', auth, async (req, res) => {
  try {
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

    res.json({
      bookings,
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
router.patch('/:id/status', auth, [
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // If booking is marked as completed, add loyalty points
    if (status === 'completed') {
      try {
        // Check if loyalty program is active
        const loyaltyProgram = await LoyaltyProgram.findOne({ isActive: true });
        
        if (loyaltyProgram) {
          // Find or create customer loyalty record
          let customerLoyalty = await CustomerLoyalty.findOne({ 
            customerEmail: booking.customerEmail.toLowerCase() 
          });
          
          if (!customerLoyalty) {
            // Create new customer loyalty record
            customerLoyalty = new CustomerLoyalty({
              customerEmail: booking.customerEmail.toLowerCase(),
              customerName: booking.customerName,
              customerPhone: booking.customerPhone
            });
            await customerLoyalty.save();
          }
          
          // Add points for completed booking
          await customerLoyalty.addPoints(
            loyaltyProgram.pointsPerBooking,
            'booking',
            booking._id,
            `Points earned for ${booking.service} appointment`
          );
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
    const { startDate, endDate, serviceId, staffId } = req.query;
    
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
    
    // Filter by staff if provided
    if (staffId) {
      where.staffId = staffId;
    }
    
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
