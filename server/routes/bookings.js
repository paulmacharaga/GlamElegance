const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Analytics = require('../models/Analytics');
const LoyaltyProgram = require('../models/LoyaltyProgram');
const CustomerLoyalty = require('../models/CustomerLoyalty');
const auth = require('../middleware/auth');
const { sendBookingConfirmation } = require('../utils/email');

const router = express.Router();

// Create new booking
router.post('/', [
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('customerEmail').isEmail().withMessage('Valid email is required'),
  body('customerPhone').notEmpty().withMessage('Phone number is required'),
  body('service').isIn(['haircut', 'braids', 'coloring', 'styling', 'treatment', 'consultation']).withMessage('Invalid service'),
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

    // Check for existing booking at same time
    const existingBooking = await Booking.findOne({
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Time slot already booked' });
    }

    const booking = new Booking({
      customerName,
      customerEmail,
      customerPhone,
      service,
      stylist,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      notes
    });

    await booking.save();

    // Track analytics
    const analytics = new Analytics({
      type: 'booking_created',
      bookingId: booking._id,
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });
    await analytics.save();
    
    // Add customer to loyalty program if they don't exist
    try {
      // Check if loyalty program is active
      const loyaltyProgram = await LoyaltyProgram.findOne({ isActive: true });
      
      if (loyaltyProgram) {
        // Find or create customer loyalty record
        let customerLoyalty = await CustomerLoyalty.findOne({ 
          customerEmail: customerEmail.toLowerCase() 
        });
        
        if (!customerLoyalty) {
          // Create new customer loyalty record
          customerLoyalty = new CustomerLoyalty({
            customerEmail: customerEmail.toLowerCase(),
            customerName,
            customerPhone
          });
          await customerLoyalty.save();
        }
      }
    } catch (loyaltyError) {
      console.error('Loyalty program error:', loyaltyError);
      // Don't fail the booking if loyalty program fails
    }

    // Send confirmation email
    try {
      await sendBookingConfirmation(booking);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        customerName: booking.customerName,
        service: booking.service,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        status: booking.status
      }
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
    
    const query = {};
    if (status) query.status = status;
    
    // Handle date filtering
    if (startDate && endDate) {
      // Date range filtering for calendar view
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        query.appointmentDate = { $gte: start, $lte: end };
      }
    } else if (date) {
      // Single date filtering
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }
    
    // Filter by stylist if provided
    if (stylist) {
      query.stylist = stylist;
    }

    // Determine if we should use pagination
    const usePagination = !startDate || !endDate;
    
    let bookingsQuery = Booking.find(query).sort({ appointmentDate: 1, appointmentTime: 1 });
    
    // Apply pagination only when not in calendar view mode
    if (usePagination) {
      bookingsQuery = bookingsQuery.limit(limit * 1).skip((page - 1) * limit);
    }

    const bookings = await bookingsQuery;
    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      totalPages: usePagination ? Math.ceil(total / limit) : 1,
      currentPage: usePagination ? page : 1,
      total
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
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
    const bookedSlots = await Booking.find({
      appointmentDate: date,
      status: { $in: ['pending', 'confirmed'] }
    }).select('appointmentTime');

    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];

    const bookedTimes = bookedSlots.map(slot => slot.appointmentTime);
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
    const query = {
      appointmentDate: { $gte: start, $lte: end },
      status: { $in: ['pending', 'confirmed'] }
    };
    
    // Filter by staff if provided
    if (staffId) {
      query.stylist = staffId;
    }
    
    const bookings = await Booking.find(query).select('appointmentDate appointmentTime');
    
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
        booking.appointmentDate.toISOString().split('T')[0] === dateString
      );
      
      const bookedTimes = dayBookings.map(booking => booking.appointmentTime);
      availableSlots[dateString] = allSlots.filter(slot => !bookedTimes.includes(slot));
    }
    
    res.json({ availableSlots });
  } catch (error) {
    console.error('Get availability range error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
