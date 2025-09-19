const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

const router = express.Router();

// Customer Registration
router.post('/register', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required')
], async (req, res) => {
  try {
    console.log('Customer registration attempt:', { email: req.body.email, name: req.body.name });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password, name, phone } = req.body;

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email }
    });

    if (existingCustomer) {
      console.log('Customer already exists:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Customer with this email already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null
      }
    });

    // Create loyalty record for the customer
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        customerId: customer.id,
        email: customer.email,
        type: 'customer'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Customer registered successfully:', customer.email);

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone
      },
      token
    });

  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Customer Login
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('Customer login attempt:', { email: req.body.email });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { email },
      include: {
        loyalty: true
      }
    });

    if (!customer) {
      console.log('Customer not found:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    if (!customer.isActive) {
      console.log('Customer account is inactive:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Account is inactive' 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, customer.password);
    if (!isValidPassword) {
      console.log('Invalid password for customer:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        customerId: customer.id,
        email: customer.email,
        type: 'customer'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Customer logged in successfully:', customer.email);

    res.json({
      success: true,
      message: 'Login successful',
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        loyalty: customer.loyalty
      },
      token
    });

  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get customer profile (protected route)
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'customer') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token type' 
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
      include: {
        loyalty: true,
        bookings: {
          include: {
            service: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: 'Customer not found' 
      });
    }

    res.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        loyalty: customer.loyalty,
        bookings: customer.bookings
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
