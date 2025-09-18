const prisma = require('../lib/prisma');
const { verifyToken, extractTokenFromHeader } = require('../utils/tokenUtils');

const customerAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    // Extract token from header
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return res.status(401).json({ message: 'No valid authorization token provided' });
    }

    // Verify and decode token
    const decoded = verifyToken(token);
    
    // Validate token type and payload
    if (decoded.type !== 'customer' || !decoded.customerId) {
      return res.status(401).json({ message: 'Invalid customer token' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!customer) {
      return res.status(401).json({ message: 'Customer not found' });
    }

    if (!customer.isActive) {
      return res.status(401).json({ message: 'Customer account is inactive' });
    }

    // Attach customer to request object
    req.user = { customerId: customer.id, email: customer.email, ...customer };
    next();
  } catch (error) {
    console.error('Customer authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

module.exports = customerAuth;
