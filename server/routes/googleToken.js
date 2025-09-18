const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const prisma = require('../lib/prisma');

// Verify Google ID token and authenticate user
router.post('/google-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    // Verify the token with Google
    const googleResponse = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );
    
    const { sub: googleId, email, name, picture } = googleResponse.data;
    
    if (!googleId) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }
    
    // Check if staff exists with this Google ID
    let staff = await prisma.staff.findFirst({ 
      where: { googleId } 
    });
    
    // If no staff with this Google ID, try to find by email
    if (!staff && email) {
      staff = await prisma.staff.findUnique({ 
        where: { email } 
      });
      
      // If staff exists with this email, link the Google account
      if (staff) {
        staff = await prisma.staff.update({
          where: { id: staff.id },
          data: {
            googleId,
            googleProfile: JSON.stringify({ name, email }),
            avatar: picture || staff.avatar
          }
        });
      }
    }
    
    // If still no staff, create a new one
    if (!staff) {
      // Check if there are any existing staff members
      const existingStaff = await prisma.staff.count();
      
      // Determine role - first staff is admin, others are staff
      const role = existingStaff === 0 ? 'admin' : 'staff';
      
      // Create new staff member
      staff = await prisma.staff.create({
        data: {
          name: name || email.split('@')[0],
          email,
          googleId,
          googleProfile: JSON.stringify({ name, email }),
          avatar: picture,
          role,
          isActive: true,
          password: '' // No password needed for Google OAuth users
        }
      });
    }
    
    // Check if staff is active
    if (!staff.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }
    
    // Generate JWT token
    const authToken = jwt.sign(
      { staffId: staff.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );
    
    // Return staff info and token (using 'user' key for compatibility)
    res.json({
      token: authToken,
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        avatar: staff.avatar
      }
    });
  } catch (error) {
    console.error('Google token verification error:', error);
    res.status(500).json({ message: 'Failed to verify Google token' });
  }
});

module.exports = router;
