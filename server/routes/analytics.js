const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// Get analytics dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get actual data from Prisma
    const bookingsCount = await prisma.booking.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    });

    const feedbackCount = await prisma.feedback.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    });

    // Get average rating
    const feedbackStats = await prisma.feedback.aggregate({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _avg: {
        overallRating: true
      }
    });

    // Get bookings by status
    const bookingsByStatusData = await prisma.booking.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        status: true
      }
    });

    const bookingsByStatus = bookingsByStatusData.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    // Mock data for analytics that don't exist yet
    const qrScans = Math.floor(Math.random() * 100) + 50;
    const reviewClicks = Math.floor(Math.random() * 50) + 20;

    // Generate mock daily analytics
    const dailyAnalytics = [];
    for (let i = parseInt(period); i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      dailyAnalytics.push({
        _id: { date: dateStr, type: 'qr_scan' },
        count: Math.floor(Math.random() * 10) + 1
      });
      dailyAnalytics.push({
        _id: { date: dateStr, type: 'google_review_click' },
        count: Math.floor(Math.random() * 5) + 1
      });
    }

    res.json({
      summary: {
        qrScans,
        reviewClicks,
        bookingsCount,
        feedbackCount,
        averageRating: feedbackStats._avg.overallRating || 0
      },
      bookingsByStatus,
      dailyAnalytics
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
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
