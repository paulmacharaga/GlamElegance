const express = require('express');
const Analytics = require('../models/Analytics');
const Booking = require('../models/Booking');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');

const router = express.Router();

// Get analytics dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // QR scan analytics
    const qrScans = await Analytics.countDocuments({
      type: 'qr_scan',
      timestamp: { $gte: startDate }
    });

    // Google review clicks
    const reviewClicks = await Analytics.countDocuments({
      type: 'google_review_click',
      timestamp: { $gte: startDate }
    });

    // Bookings analytics
    const bookingsCount = await Booking.countDocuments({
      createdAt: { $gte: startDate }
    });

    const bookingsByStatus = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Feedback analytics
    const feedbackCount = await Feedback.countDocuments({
      createdAt: { $gte: startDate }
    });

    const averageRating = await Feedback.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    // Daily analytics for charts
    const dailyAnalytics = await Analytics.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      summary: {
        qrScans,
        reviewClicks,
        bookingsCount,
        feedbackCount,
        averageRating: averageRating.length > 0 ? averageRating[0].avgRating : 0
      },
      bookingsByStatus: bookingsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      dailyAnalytics
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversion funnel
router.get('/funnel', auth, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const qrScans = await Analytics.countDocuments({
      type: 'qr_scan',
      timestamp: { $gte: startDate }
    });

    const reviewClicks = await Analytics.countDocuments({
      type: 'google_review_click',
      timestamp: { $gte: startDate }
    });

    const bookings = await Analytics.countDocuments({
      type: 'booking_created',
      timestamp: { $gte: startDate }
    });

    const feedback = await Analytics.countDocuments({
      type: 'feedback_submitted',
      timestamp: { $gte: startDate }
    });

    res.json({
      funnel: {
        qrScans,
        reviewClicks,
        bookings,
        feedback
      },
      conversionRates: {
        scanToReview: qrScans > 0 ? (reviewClicks / qrScans * 100).toFixed(2) : 0,
        scanToBooking: qrScans > 0 ? (bookings / qrScans * 100).toFixed(2) : 0,
        scanToFeedback: qrScans > 0 ? (feedback / qrScans * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Analytics funnel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
