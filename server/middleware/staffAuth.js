const prisma = require('../lib/prisma');
const { verifyToken, extractTokenFromHeader } = require('../utils/tokenUtils');

const staffAuth = async (req, res, next) => {
  console.log('🔐 staffAuth middleware called');
  try {
    const authHeader = req.header('Authorization');
    console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing');
    
    // Extract token from header
    const token = extractTokenFromHeader(authHeader);
    console.log('🔐 Token extracted:', token ? 'Valid token format' : 'Invalid token format');
    
    if (!token) {
      console.log('🔐 Authentication failed: No valid token');
      return res.status(401).json({ message: 'No valid authorization token provided' });
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = verifyToken(token);
      console.log('🔐 Token verified successfully. Payload:', {
        staffId: decoded.staffId || 'missing',
        type: decoded.type || 'not specified',
        exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'missing'
      });
    } catch (verifyError) {
      console.log('🔐 Token verification failed:', verifyError.message);
      return res.status(401).json({ message: `Invalid token: ${verifyError.message}` });
    }
    
    // Validate token payload (backward compatible)
    if (!decoded.staffId) {
      console.log('🔐 Invalid token: missing staffId');
      return res.status(401).json({ message: 'Invalid staff token - missing staffId' });
    }
    
    // Check token type if present (new format), but allow old format without type
    if (decoded.type && decoded.type !== 'staff') {
      return res.status(401).json({ message: 'Invalid staff token - wrong type' });
    }

    console.log('🔐 Looking up staff member with ID:', decoded.staffId);
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
      console.log('🔐 Staff member not found with ID:', decoded.staffId);
      return res.status(401).json({ message: 'Staff member not found' });
    }

    console.log('🔐 Staff member found:', {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      isActive: staff.isActive
    });

    if (!staff.isActive) {
      console.log('🔐 Staff account is inactive');
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
