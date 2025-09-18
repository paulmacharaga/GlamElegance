const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const customerAuth = require('../middleware/customerAuth');
const staffAuth = require('../middleware/staffAuth');
const { createCustomerToken } = require('../utils/tokenUtils');

const router = express.Router();

// Get all customers (admin/staff only)
router.get('/', staffAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Build where clause for search
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    } : {};
    
    // Get customers with pagination
    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        loyalty: {
          select: {
            totalPoints: true,
            lifetimePoints: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take
    });
    
    // Get total count for pagination
    const total = await prisma.customer.count({ where });
    
    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Customer registration
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('phone').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, phone, dateOfBirth, address } = req.body;

      // Check if customer already exists
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingCustomer) {
        return res.status(400).json({ message: 'Customer already exists with this email' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create customer
      const customer = await prisma.customer.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          address,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          address: true,
          isActive: true,
          createdAt: true
        }
      });

      // Create loyalty record
      await prisma.customerLoyalty.create({
        data: {
          customerId: customer.id,
          customerEmail: customer.email,
          customerName: customer.name,
          customerPhone: customer.phone,
          totalPoints: 0,
          lifetimePoints: 0
        }
      });

      // Generate standardized JWT token
      const token = createCustomerToken(customer);

      res.status(201).json({
        token,
        customer
      });
    } catch (error) {
      console.error('Customer registration error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// Customer login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if customer exists
      const customer = await prisma.customer.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          phone: true,
          dateOfBirth: true,
          address: true,
          isActive: true,
          avatar: true,
          createdAt: true
        }
      });

      if (!customer) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!customer.isActive) {
        return res.status(401).json({ message: 'Account is inactive. Please contact support.' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate standardized JWT token
      const token = createCustomerToken(customer);

      // Return token and customer info (without password)
      const { password: _, ...customerWithoutPassword } = customer;
      res.json({
        token,
        customer: customerWithoutPassword
      });
    } catch (error) {
      console.error('Customer login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// Get customer profile
router.get('/profile', customerAuth, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.user.customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        avatar: true,
        createdAt: true,
        loyalty: {
          select: {
            totalPoints: true,
            lifetimePoints: true
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update customer profile
router.put('/profile', customerAuth, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please include a valid email'),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, dateOfBirth, address } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (address !== undefined) updateData.address = address;

    const customer = await prisma.customer.update({
      where: { id: req.user.customerId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        avatar: true,
        createdAt: true
      }
    });

    res.json(customer);
  } catch (error) {
    console.error('Error updating customer profile:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer bookings
router.get('/bookings', customerAuth, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { 
        OR: [
          { customerId: req.user.customerId },
          { customerEmail: req.user.email }
        ]
      },
      orderBy: { bookingDate: 'desc' }
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer loyalty info
router.get('/loyalty', customerAuth, async (req, res) => {
  try {
    const loyalty = await prisma.customerLoyalty.findFirst({
      where: { customerId: req.user.customerId }
    });

    if (!loyalty) {
      // Create loyalty record if it doesn't exist
      const customer = await prisma.customer.findUnique({
        where: { id: req.user.customerId }
      });

      const newLoyalty = await prisma.customerLoyalty.create({
        data: {
          customerId: customer.id,
          customerEmail: customer.email,
          customerName: customer.name,
          customerPhone: customer.phone,
          totalPoints: 0,
          lifetimePoints: 0
        }
      });

      return res.json(newLoyalty);
    }

    res.json(loyalty);
  } catch (error) {
    console.error('Error fetching customer loyalty:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
