const jwt = require('jsonwebtoken');

/**
 * Standard JWT token utilities for consistent authentication
 */

// Standard token expiration times
const TOKEN_EXPIRY = {
  STAFF: '24h',
  CUSTOMER: '7d',
  REFRESH: '30d'
};

/**
 * Create a staff JWT token with consistent payload
 * @param {Object} staff - Staff object from database
 * @returns {string} JWT token
 */
const createStaffToken = (staff) => {
  const payload = {
    staffId: staff.id,
    email: staff.email,
    role: staff.role,
    type: 'staff'
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: TOKEN_EXPIRY.STAFF }
  );
};

/**
 * Create a customer JWT token with consistent payload
 * @param {Object} customer - Customer object from database
 * @returns {string} JWT token
 */
const createCustomerToken = (customer) => {
  const payload = {
    customerId: customer.id,
    email: customer.email,
    type: 'customer'
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: TOKEN_EXPIRY.CUSTOMER }
  );
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if invalid format
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (!token || token === 'null' || token === 'undefined') {
    return null;
  }
  
  return token;
};

module.exports = {
  createStaffToken,
  createCustomerToken,
  verifyToken,
  extractTokenFromHeader,
  TOKEN_EXPIRY
};
