const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// Get loyalty program settings (public)
router.get('/program', async (req, res) => {
  try {
    const program = await prisma.loyaltyProgram.findFirst({ 
      where: { isActive: true }
    });
    
    if (!program) {
      return res.status(404).json({ message: 'No active loyalty program found' });
    }
    
    res.json({
      name: program.name,
      description: program.description,
      pointsPerBooking: program.pointsPerBooking,
      pointsPerDollar: program.pointsPerDollar,
      rewardThreshold: program.rewardThreshold,
      rewardAmount: program.rewardAmount
    });
  } catch (error) {
    console.error('Get loyalty program error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update loyalty program settings (admin only)
router.post('/program', auth, [
  body('name').notEmpty().withMessage('Program name is required'),
  body('pointsPerBooking').isNumeric().withMessage('Points per booking must be a number'),
  body('pointsPerDollar').isNumeric().withMessage('Points per dollar must be a number'),
  body('rewardThreshold').isNumeric().withMessage('Reward threshold must be a number'),
  body('rewardAmount').isNumeric().withMessage('Reward amount must be a number')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      name,
      description,
      pointsPerBooking,
      pointsPerDollar,
      rewardThreshold,
      rewardAmount,
      isActive
    } = req.body;
    
    // Find existing program or create new one
    let program = await prisma.loyaltyProgram.findFirst({});
    
    if (program) {
      // Update existing program
      program = await prisma.loyaltyProgram.update({
        where: { id: program.id },
        data: {
          name,
          description,
          pointsPerBooking,
          pointsPerDollar,
          rewardThreshold,
          rewardAmount,
          isActive: isActive !== undefined ? isActive : program.isActive
        }
      });
    } else {
      // Create new program
      program = await prisma.loyaltyProgram.create({
        data: {
          name,
          description,
          pointsPerBooking,
          pointsPerDollar,
          rewardThreshold,
          rewardAmount,
          isActive: isActive !== undefined ? isActive : true
        }
      });
    }
    
    res.json({
      message: 'Loyalty program settings updated',
      program
    });
  } catch (error) {
    console.error('Update loyalty program error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer loyalty info by email
router.get('/customer/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const customerLoyalty = await prisma.customerLoyalty.findUnique({ 
      where: { customerEmail: email.toLowerCase() }
    });
    
    if (!customerLoyalty) {
      return res.status(404).json({ message: 'Customer not found in loyalty program' });
    }
    
    // Get active loyalty program for threshold info
    const program = await prisma.loyaltyProgram.findFirst({ 
      where: { isActive: true }
    });
    
    res.json({
      customerName: customerLoyalty.customerName,
      points: customerLoyalty.points,
      totalPointsEarned: customerLoyalty.totalPointsEarned,
      rewardsRedeemed: customerLoyalty.rewardsRedeemed,
      pointsToNextReward: program ? Math.max(0, program.rewardThreshold - customerLoyalty.points) : null,
      rewardAmount: program ? program.rewardAmount : null
    });
  } catch (error) {
    console.error('Get customer loyalty error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer loyalty history (requires auth)
router.get('/customer/:email/history', auth, async (req, res) => {
  try {
    const { email } = req.params;
    
    const customerLoyalty = await prisma.customerLoyalty.findUnique({ 
      where: { customerEmail: email.toLowerCase() },
      include: {
        pointsHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!customerLoyalty) {
      return res.status(404).json({ message: 'Customer not found in loyalty program' });
    }
    
    res.json({
      customerName: customerLoyalty.customerName,
      points: customerLoyalty.points,
      history: customerLoyalty.pointsHistory
    });
  } catch (error) {
    console.error('Get customer loyalty history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add points manually (admin/staff only)
router.post('/customer/:email/add-points', auth, [
  body('points').isNumeric().withMessage('Points must be a number'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email } = req.params;
    const { points, description } = req.body;
    
    let customerLoyalty = await prisma.customerLoyalty.findUnique({ 
      where: { customerEmail: email.toLowerCase() }
    });
    
    if (!customerLoyalty) {
      return res.status(404).json({ message: 'Customer not found in loyalty program' });
    }
    
    const pointsToAdd = parseInt(points, 10);
    
    // Update customer loyalty and add points history
    customerLoyalty = await prisma.customerLoyalty.update({
      where: { id: customerLoyalty.id },
      data: {
        points: { increment: pointsToAdd },
        totalPointsEarned: { increment: pointsToAdd }
      }
    });
    
    // Add to points history
    await prisma.pointsHistory.create({
      data: {
        customerLoyaltyId: customerLoyalty.id,
        points: pointsToAdd,
        type: 'earned',
        source: 'manual',
        description
      }
    });
    
    res.json({
      message: 'Points added successfully',
      currentPoints: customerLoyalty.points
    });
  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Redeem points for a reward (customer or staff)
router.post('/customer/:email/redeem', [
  body('bookingId').optional().isMongoId().withMessage('Valid booking ID is required if provided')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email } = req.params;
    const { bookingId } = req.body;
    
    // Get active loyalty program
    const program = await prisma.loyaltyProgram.findFirst({ 
      where: { isActive: true }
    });
    
    if (!program) {
      return res.status(404).json({ message: 'No active loyalty program found' });
    }
    
    let customerLoyalty = await prisma.customerLoyalty.findUnique({ 
      where: { customerEmail: email.toLowerCase() }
    });
    
    if (!customerLoyalty) {
      return res.status(404).json({ message: 'Customer not found in loyalty program' });
    }
    
    // Check if customer has enough points
    if (customerLoyalty.points < program.rewardThreshold) {
      return res.status(400).json({ 
        message: 'Insufficient points for redemption',
        currentPoints: customerLoyalty.points,
        requiredPoints: program.rewardThreshold
      });
    }
    
    // If booking ID is provided, verify it exists and belongs to this customer
    let booking = null;
    if (bookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });
      
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      if (booking.customerEmail.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({ message: 'Booking does not belong to this customer' });
      }
    }
    
    // Redeem points
    customerLoyalty = await prisma.customerLoyalty.update({
      where: { id: customerLoyalty.id },
      data: {
        points: { decrement: program.rewardThreshold },
        totalPointsRedeemed: { increment: program.rewardThreshold },
        rewardsRedeemed: { increment: 1 }
      }
    });
    
    // Add to points history
    await prisma.pointsHistory.create({
      data: {
        customerLoyaltyId: customerLoyalty.id,
        points: program.rewardThreshold,
        type: 'redeemed',
        source: 'reward',
        bookingId,
        description: `Redeemed ${program.rewardThreshold} points for $${program.rewardAmount} discount`
      }
    });
    
    res.json({
      message: 'Points redeemed successfully',
      rewardAmount: program.rewardAmount,
      remainingPoints: customerLoyalty.points
    });
  } catch (error) {
    console.error('Redeem points error:', error);
    
    if (error.message === 'Insufficient points') {
      return res.status(400).json({ message: 'Insufficient points for redemption' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all customers in loyalty program (admin/staff only)
router.get('/customers', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'points', order = 'desc' } = req.query;
    
    const orderBy = {};
    orderBy[sort] = order === 'desc' ? 'desc' : 'asc';
    
    const customers = await prisma.customerLoyalty.findMany({
      orderBy,
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });
    
    const total = await prisma.customerLoyalty.count();
    
    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get loyalty customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
