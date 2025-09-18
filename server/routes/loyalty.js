const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const staffAuth = require('../middleware/staffAuth');

const router = express.Router();

// Get loyalty program settings (admin/staff only)
router.get('/program', staffAuth, async (req, res) => {
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
      rewardAmount: program.rewardAmount,
      birthdayDiscountRate: program.birthdayDiscountRate || 20.0,
      birthdayDiscountDays: program.birthdayDiscountDays || 7
    });
  } catch (error) {
    console.error('Get loyalty program error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or update loyalty program settings (admin only)
router.post('/program', staffAuth, [
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
      birthdayDiscountRate,
      birthdayDiscountDays,
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
          birthdayDiscountRate: birthdayDiscountRate !== undefined ? birthdayDiscountRate : program.birthdayDiscountRate,
          birthdayDiscountDays: birthdayDiscountDays !== undefined ? birthdayDiscountDays : program.birthdayDiscountDays,
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
          birthdayDiscountRate: birthdayDiscountRate !== undefined ? birthdayDiscountRate : 20.0,
          birthdayDiscountDays: birthdayDiscountDays !== undefined ? birthdayDiscountDays : 7,
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
      points: customerLoyalty.totalPoints,
      totalPointsEarned: customerLoyalty.lifetimePoints,
      pointsToNextReward: program ? Math.max(0, program.rewardThreshold - customerLoyalty.totalPoints) : null,
      rewardAmount: program ? program.rewardAmount : null
    });
  } catch (error) {
    console.error('Get customer loyalty error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer loyalty history (requires auth)
router.get('/customer/:email/history', staffAuth, async (req, res) => {
  try {
    const { email } = req.params;
    
    const customerLoyalty = await prisma.customerLoyalty.findUnique({ 
      where: { customerEmail: email.toLowerCase() }
    });
    
    if (!customerLoyalty) {
      return res.status(404).json({ message: 'Customer not found in loyalty program' });
    }
    
    // For now, return basic history info - can be expanded later with a separate PointsHistory model
    res.json({
      customerName: customerLoyalty.customerName,
      points: customerLoyalty.totalPoints,
      history: [
        {
          id: '1',
          type: 'earned',
          points: customerLoyalty.totalPoints,
          description: 'Total points earned',
          createdAt: customerLoyalty.createdAt
        }
      ]
    });
  } catch (error) {
    console.error('Get customer loyalty history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add points manually (admin/staff only)
router.post('/customer/:email/add-points', staffAuth, [
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
    
    // Update customer loyalty points
    customerLoyalty = await prisma.customerLoyalty.update({
      where: { id: customerLoyalty.id },
      data: {
        totalPoints: { increment: pointsToAdd },
        lifetimePoints: { increment: pointsToAdd }
      }
    });
    
    res.json({
      message: 'Points added successfully',
      currentPoints: customerLoyalty.totalPoints
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
    if (customerLoyalty.totalPoints < program.rewardThreshold) {
      return res.status(400).json({ 
        message: 'Insufficient points for redemption',
        currentPoints: customerLoyalty.totalPoints,
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
        totalPoints: { decrement: program.rewardThreshold }
      }
    });
    
    res.json({
      message: 'Points redeemed successfully',
      rewardAmount: program.rewardAmount,
      remainingPoints: customerLoyalty.totalPoints
    });
  } catch (error) {
    console.error('Redeem points error:', error);
    
    if (error.message === 'Insufficient points') {
      return res.status(400).json({ message: 'Insufficient points for redemption' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Check birthday discounts for customers (admin/staff only)
router.get('/birthday-discounts', staffAuth, async (req, res) => {
  try {
    // Get active loyalty program
    const program = await prisma.loyaltyProgram.findFirst({ 
      where: { isActive: true }
    });
    
    if (!program) {
      return res.status(404).json({ message: 'No active loyalty program found' });
    }

    // Get current date
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
    const currentDay = today.getDate();
    
    // Calculate date range for birthday discount eligibility
    const discountDays = program.birthdayDiscountDays;
    
    // Get all customers with birthdays
    const customers = await prisma.customer.findMany({
      where: {
        dateOfBirth: { not: null },
        isActive: true
      },
      include: {
        loyalty: true
      }
    });

    // Filter customers eligible for birthday discount
    const eligibleCustomers = customers.filter(customer => {
      if (!customer.dateOfBirth) return false;
      
      const birthDate = new Date(customer.dateOfBirth);
      const birthMonth = birthDate.getMonth() + 1;
      const birthDay = birthDate.getDate();
      
      // Check if birthday is within discount window
      const daysDifference = Math.abs(
        (new Date(today.getFullYear(), currentMonth - 1, currentDay) - 
         new Date(today.getFullYear(), birthMonth - 1, birthDay)) / (1000 * 60 * 60 * 24)
      );
      
      return daysDifference <= discountDays;
    });

    // Format response
    const birthdayCustomers = eligibleCustomers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth,
      loyaltyPoints: customer.loyalty?.totalPoints || 0,
      discountRate: program.birthdayDiscountRate,
      daysUntilBirthday: Math.ceil(
        (new Date(today.getFullYear(), new Date(customer.dateOfBirth).getMonth(), new Date(customer.dateOfBirth).getDate()) - today) / (1000 * 60 * 60 * 24)
      )
    }));

    res.json({
      program: {
        birthdayDiscountRate: program.birthdayDiscountRate,
        birthdayDiscountDays: program.birthdayDiscountDays
      },
      eligibleCustomers: birthdayCustomers,
      total: birthdayCustomers.length
    });
  } catch (error) {
    console.error('Get birthday discounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all customers in loyalty program (admin/staff only)
router.get('/customers', staffAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'totalPoints', order = 'desc' } = req.query;
    
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
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
