// Vercel serverless function entry point
// This file routes all API requests to the main server application

try {
  // Import the Express app from the server directory
  const app = require('../server/index.js');

  // Export the Express app as a Vercel serverless function
  module.exports = app;
} catch (error) {
  console.error('Error loading server application:', error);

  // Fallback handler for debugging
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  };
}
