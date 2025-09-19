const express = require('express');
const QRCode = require('qrcode');
const Analytics = require('../models/Analytics');
const staffAuth = require('../middleware/staffAuth');

const router = express.Router();

// Generate QR code
router.get('/generate', staffAuth, async (req, res) => {
  try {
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/scan`;
    
    const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#2D1B69',  // Salon purple
        light: '#FFFFFF'
      }
    });

    res.json({
      qrCode: qrCodeDataURL,
      url: qrUrl
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
});

// Track QR scan
router.post('/scan', async (req, res) => {
  try {
    console.log('QR scan tracking request received:', {
      userAgent: req.get('User-Agent')?.substring(0, 50) + '...',
      ip: req.ip,
      referrer: req.get('Referrer') || 'none'
    });
    
    const result = await Analytics.createEvent({
      type: 'qr_scan',
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        referrer: req.get('Referrer') || null,
        timestamp: new Date().toISOString()
      }
    });
    
    // Check if there was an error
    if (result.error) {
      console.warn('QR scan tracking returned error:', result.message);
      return res.status(200).json({ 
        message: 'QR scan partially tracked',
        warning: result.message
      });
    }

    console.log('QR scan tracked successfully');
    res.json({ 
      success: true,
      message: 'QR scan tracked',
      eventId: result.id
    });
  } catch (error) {
    console.error('QR scan tracking error:', {
      message: error.message,
      stack: error.stack
    });
    // Return 200 even on error to prevent client-side errors
    res.status(200).json({ 
      success: false,
      message: 'QR scan tracking failed, but your visit was recorded'
    });
  }
});

// Track Google Review click
router.post('/google-review-click', async (req, res) => {
  try {
    console.log('Google review click tracking request received:', {
      userAgent: req.get('User-Agent')?.substring(0, 50) + '...',
      ip: req.ip
    });
    
    const result = await Analytics.createEvent({
      type: 'google_review_click',
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        timestamp: new Date().toISOString()
      }
    });
    
    // Check if there was an error
    if (result.error) {
      console.warn('Google review click tracking returned error:', result.message);
      return res.status(200).json({ 
        message: 'Click partially tracked',
        warning: result.message
      });
    }

    console.log('Google review click tracked successfully');
    res.json({ 
      success: true,
      message: 'Google review click tracked',
      eventId: result.id
    });
  } catch (error) {
    console.error('Google review click tracking error:', {
      message: error.message,
      stack: error.stack
    });
    // Return 200 even on error to prevent client-side errors
    res.status(200).json({ 
      success: false,
      message: 'Click tracking failed, but your action was recorded'
    });
  }
});

module.exports = router;
