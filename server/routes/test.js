const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Simple ping test
router.get('/ping', (req, res) => {
  console.log('Ping request received from:', req.headers.origin || 'unknown origin');
  res.json({
    success: true,
    message: 'API is accessible',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  });
});

// Test database connection and user lookup
router.get('/db-connection', async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);
    
    // Test finding the admin user
    const adminUser = await User.findOne({ email: 'paul@ioi.co.zw' });
    console.log('Admin user found:', !!adminUser);
    
    if (adminUser) {
      console.log('Admin user details:', {
        email: adminUser.email,
        username: adminUser.username,
        name: adminUser.name,
        role: adminUser.role,
        isActive: adminUser.isActive
      });
    }
    
    res.json({
      success: true,
      userCount,
      adminUserExists: !!adminUser,
      adminUser: adminUser ? {
        email: adminUser.email,
        username: adminUser.username,
        name: adminUser.name,
        role: adminUser.role,
        isActive: adminUser.isActive
      } : null
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test login functionality
router.post('/test-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Testing login for:', username);
    
    // Find user
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      isActive: true
    });
    
    console.log('User found:', !!user);
    
    if (!user) {
      return res.json({
        success: false,
        message: 'User not found',
        searchedFor: username
      });
    }
    
    // Test password
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    res.json({
      success: true,
      userFound: true,
      passwordMatch: isMatch,
      user: {
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create admin user for production
router.post('/create-admin', async (req, res) => {
  try {
    console.log('Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'paul@ioi.co.zw' });
    if (existingAdmin) {
      return res.json({
        success: false,
        message: 'Admin user already exists',
        user: {
          email: existingAdmin.email,
          username: existingAdmin.username,
          name: existingAdmin.name,
          role: existingAdmin.role,
          isActive: existingAdmin.isActive
        }
      });
    }

    // Create admin user
    const adminUser = new User({
      username: 'paul',
      email: 'paul@ioi.co.zw',
      password: 'Letmein99x!',
      name: 'Paul Macharaga',
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    console.log('Admin user created successfully');

    res.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        email: adminUser.email,
        username: adminUser.username,
        name: adminUser.name,
        role: adminUser.role,
        isActive: adminUser.isActive
      }
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
