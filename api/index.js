// Vercel serverless function entry point
// This file routes all API requests to the main server application

const app = require('../server/index.js');

// Export the Express app as a Vercel serverless function
module.exports = app;
