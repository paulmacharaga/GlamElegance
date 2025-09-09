const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');

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
    
    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });
    
    // If no user with this Google ID, try to find by email
    if (!user && email) {
      user = await User.findOne({ email });
      
      // If user exists with this email, link the Google account
      if (user) {
        user.googleId = googleId;
        user.googleProfile = { name, email };
        if (picture) user.avatar = picture;
        await user.save();
      }
    }
    
    // If still no user, create a new one
    if (!user) {
      // Check if there are any existing users
      const existingUsers = await User.countDocuments();
      
      // Determine role - first user is admin, others are staff
      const role = existingUsers === 0 ? 'admin' : 'staff';
      
      // Create a unique username if needed
      let username = email.split('@')[0];
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        // Add random suffix to make username unique
        username = `${username}${Math.floor(Math.random() * 10000)}`;  
      }
      
      // Create new user
      user = new User({
        username,
        email,
        name: name || username,
        googleId,
        googleProfile: { name, email },
        avatar: picture,
        role,
        isActive: true
      });
      
      await user.save();
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }
    
    // Generate JWT token
    const authToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user info and token
    res.json({
      token: authToken,
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
    console.error('Google token verification error:', error);
    res.status(500).json({ message: 'Failed to verify Google token' });
  }
});

module.exports = router;
