const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const auth = async (req, res, next) => {
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

    let user = null;
    let userDoc = null;

    // Check if it's a staff token (new format)
    if (decoded.staffId) {
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

      // Map staff to user format for compatibility
      user = {
        userId: staff.id,
        staffId: staff.id,
        role: staff.role,
        type: 'staff'
      };
      userDoc = {
        id: staff.id,
        username: staff.name,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt
      };
    }
    // Check if it's a user token (legacy format)
    else if (decoded.userId) {
      const userRecord = await prisma.user.findUnique({
        where: { id: decoded.userId },
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

      if (!userRecord) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!userRecord.isActive) {
        return res.status(401).json({ message: 'User account is inactive' });
      }

      user = decoded;
      userDoc = userRecord;
    }
    else {
      return res.status(401).json({ message: 'Invalid token payload - missing userId or staffId' });
    }

    req.user = user;
    req.userDoc = userDoc;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token format' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ message: 'Token not active yet' });
    }

    res.status(401).json({ message: 'Authentication failed' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = auth;
module.exports.adminAuth = adminAuth;
