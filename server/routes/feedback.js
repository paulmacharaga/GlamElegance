const express = require('express');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Analytics = require('../models/Analytics');
const auth = require('../middleware/auth');

const router = express.Router();

// Submit feedback
router.post('/', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Comment too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      rating,
      comment,
      customerEmail,
      customerName,
      service,
      stylist,
      isAnonymous
    } = req.body;

    const feedback = new Feedback({
      rating,
      comment,
      customerEmail: isAnonymous ? undefined : customerEmail,
      customerName: isAnonymous ? undefined : customerName,
      service,
      stylist,
      isAnonymous: isAnonymous || false
    });

    await feedback.save();

    // Track analytics
    const analytics = new Analytics({
      type: 'feedback_submitted',
      feedbackId: feedback._id,
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });
    await analytics.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedbackId: feedback._id
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all feedback (admin/staff only)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, rating, service } = req.query;
    
    const query = {};
    if (rating) query.rating = parseInt(rating);
    if (service) query.service = service;

    const feedback = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments(query);

    res.json({
      feedback,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feedback statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalFeedback: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const ratingCounts = {};
    for (let i = 1; i <= 5; i++) {
      ratingCounts[i] = 0;
    }

    if (stats.length > 0) {
      stats[0].ratingDistribution.forEach(rating => {
        ratingCounts[rating]++;
      });
    }

    res.json({
      averageRating: stats.length > 0 ? stats[0].averageRating : 0,
      totalFeedback: stats.length > 0 ? stats[0].totalFeedback : 0,
      ratingDistribution: ratingCounts
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
