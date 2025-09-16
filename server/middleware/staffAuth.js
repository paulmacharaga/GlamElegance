const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const staffAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization header provided' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Invalid authorization header format' });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    if (!decoded.staffId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: decoded.staffId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!staff) {
      return res.status(401).json({ message: 'Staff member not found' });
    }

    if (!staff.isActive) {
      return res.status(401).json({ message: 'Staff account is inactive' });
    }

    // Attach staff to request object
    req.staff = staff;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Middleware to check if staff has admin role
const staffAdmin = (req, res, next) => {
  if (req.staff.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

module.exports = staffAuth;
module.exports.staffAdmin = staffAdmin;
