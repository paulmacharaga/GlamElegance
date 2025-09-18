const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const staffAuth = require('../middleware/staffAuth');

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

    const { username, email, password, name, role = 'staff' } = req.body;

    // Check if staff already exists
    const existingStaff = await prisma.staff.findFirst({
      where: {
        OR: [
          { email },
          { name: username }
        ]
      }
    });

    if (existingStaff) {
      return res.status(400).json({ message: 'Staff with this email or name already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create staff
    const staff = await prisma.staff.create({
      data: {
        name: username,
        email,
        password: hashedPassword,
        role,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username/email and password are required' });
    }

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    // Check if user exists and is active
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Your account has been deactivated' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    // Remove password from user object before sending response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'An error occurred during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user
router.get('/me', staffAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
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

  router.get('/google/callback', 
    passport.authenticate('google', { 
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/admin/login?error=auth_failed`
    }), 
    async (req, res) => {
      try {
        if (!req.user) {
          throw new Error('No user returned from Google authentication');
        }

        // Generate JWT token for the authenticated Google user
        const token = jwt.sign(
          { 
            userId: req.user.id, 
            role: req.user.role 
          },
          process.env.JWT_SECRET || 'fallback_secret',
          { expiresIn: '24h' }
        );

        // Prepare user data for the frontend
        const userData = {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
          avatar: req.user.avatar
        };

        // Redirect to frontend with token and user data
        const redirectUrl = new URL(`${process.env.CLIENT_URL}/admin/google-auth-success`);
        redirectUrl.searchParams.set('token', token);
        redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify(userData)));
        
        res.redirect(redirectUrl.toString());
      } catch (error) {
        console.error('Google auth callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/admin/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
      }
    }
  );
}

// Link Google account to existing user
router.post('/link-google', staffAuth, async (req, res) => {
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
router.post('/unlink-google', staffAuth, async (req, res) => {
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
