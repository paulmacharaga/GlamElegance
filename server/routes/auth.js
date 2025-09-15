const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const passport = require('../config/passport');

const router = express.Router();

// Register admin/staff user
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      username,
      email,
      password,
      name,
      role: role || 'staff'
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for:', username);

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    console.log('Looking for user:', username);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ],
        isActive: true
      }
    });

    console.log('User found:', !!user);
    if (!user) {
      console.log('No user found for:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Testing password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch for user:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Generating JWT token...');
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for:', username);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth Routes - only available if credentials are configured
const googleCredentialsAvailable = 
  process.env.GOOGLE_CLIENT_ID && 
  process.env.GOOGLE_CLIENT_SECRET && 
  process.env.GOOGLE_CALLBACK_URL;

if (googleCredentialsAvailable) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get('/google/callback', passport.authenticate('google', { session: false }), async (req, res) => {
    try {
      // Generate JWT token for the authenticated Google user
      const token = jwt.sign(
        { userId: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL}/admin/google-auth-success?token=${token}`);
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/admin/login?error=auth_failed`);
    }
  });
}

// Link Google account to existing user
router.post('/link-google', auth, async (req, res) => {
  try {
    const { googleId, googleProfile, avatar } = req.body;
    
    if (!googleId || !googleProfile) {
      return res.status(400).json({ message: 'Google account data is required' });
    }
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if another user already has this Google ID
    const existingUser = await User.findOne({ googleId });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: 'This Google account is already linked to another user' });
    }
    
    user.googleId = googleId;
    user.googleProfile = googleProfile;
    if (avatar) user.avatar = avatar;
    
    await user.save();
    
    res.json({
      message: 'Google account linked successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Link Google account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unlink Google account
router.post('/unlink-google', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has a password before unlinking
    if (!user.password) {
      return res.status(400).json({ message: 'Cannot unlink Google account without setting a password first' });
    }
    
    user.googleId = undefined;
    user.googleProfile = undefined;
    
    await user.save();
    
    res.json({
      message: 'Google account unlinked successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Unlink Google account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
