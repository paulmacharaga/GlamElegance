const prisma = require('../lib/prisma');
const { verifyToken, extractTokenFromHeader } = require('../utils/tokenUtils');

const staffAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    // Extract token from header
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return res.status(401).json({ message: 'No valid authorization token provided' });
    }

    // Verify and decode token
    const decoded = verifyToken(token);
    
    // Validate token payload (backward compatible)
    if (!decoded.staffId) {
      return res.status(401).json({ message: 'Invalid staff token - missing staffId' });
    }
    
    // Check token type if present (new format), but allow old format without type
    if (decoded.type && decoded.type !== 'staff') {
      return res.status(401).json({ message: 'Invalid staff token - wrong type' });
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
    req.user = { ...staff, staffId: staff.id }; // Legacy compatibility
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
