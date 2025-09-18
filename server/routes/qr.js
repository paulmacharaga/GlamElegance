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
    const analytics = new Analytics({
      type: 'qr_scan',
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        referrer: req.get('Referrer')
      }
    });
    await analytics.save();

    res.json({ message: 'QR scan tracked' });
  } catch (error) {
    console.error('QR scan tracking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Track Google Review click
router.post('/google-review-click', async (req, res) => {
  try {
    const analytics = new Analytics({
      type: 'google_review_click',
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });
    await analytics.save();

    res.json({ message: 'Google review click tracked' });
  } catch (error) {
    console.error('Google review click tracking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
