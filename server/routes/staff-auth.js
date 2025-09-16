const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();

// Staff login
router.post('/login', [
  body('identifier').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  console.log('🔑 Staff login attempt');
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;
    const isEmail = identifier.includes('@');

    // Find staff member by email or name
    console.log(`🔍 Looking up staff member by ${isEmail ? 'email' : 'name'}:`, identifier);
    const staff = await prisma.staff.findFirst({
      where: {
        OR: [
          { email: isEmail ? identifier : undefined },
          { name: !isEmail ? identifier : undefined }
        ].filter(Boolean)
      }
    });
    console.log('📝 Found staff member:', staff ? 'Yes' : 'No');

    if (!staff) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!staff.isActive) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Check password
    console.log('🔑 Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      { 
        staffId: staff.id, 
        email: staff.email, 
        role: staff.role,
        type: 'staff'
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful');
    res.json({ 
      message: 'Login successful',
      token, 
      staff: { 
        id: staff.id, 
        name: staff.name, 
        email: staff.email, 
        role: staff.role 
      } 
    });
  } catch (error) {
    console.error('❌ Login error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...error
    });
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Staff password change
router.put('/change-password', async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    if (decoded.type !== 'staff') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: decoded.staffId }
    });

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, staff.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.staff.update({
      where: { id: staff.id },
      data: { password: hashedNewPassword }
    });

    // Generate a new token since password has changed
    const newToken = jwt.sign(
      { 
        staffId: staff.id, 
        email: staff.email, 
        role: staff.role,
        type: 'staff'
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Password changed successfully',
      token: newToken,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role
      }
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password - Generate reset token
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find staff member by email
    const staff = await prisma.staff.findUnique({
      where: { email }
    });

    if (!staff) {
      // For security, don't reveal if email exists or not
      return res.json({ message: 'If an account exists with this email, a password reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send email with reset link
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&id=${staff.id}`;
    
    try {
      await sendPasswordResetEmail(staff.email, resetUrl);
      res.json({ message: 'Password reset instructions have been sent to your email' });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      res.status(500).json({ message: 'Error sending password reset email' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password with token
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('staffId').notEmpty().withMessage('User ID is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, staffId, newPassword } = req.body;

    // Find staff member with valid reset token
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date() // Token not expired
        }
      }
    });

    if (!staff) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await prisma.staff.update({
      where: { id: staffId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
