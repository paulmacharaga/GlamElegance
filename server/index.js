// Load environment variables first
require('./load-env');

const express = require('express');
const cors = require('cors');
const prisma = require('./lib/prisma');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('./config/passport');
const session = require('express-session');

// Import routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const feedbackRoutes = require('./routes/feedback');
const qrRoutes = require('./routes/qr');
const analyticsRoutes = require('./routes/analytics');
const googleTokenRoutes = require('./routes/googleToken');
const serviceRoutes = require('./routes/services');
const staffRoutes = require('./routes/staff');
const staffAuthRoutes = require('./routes/staff-auth');
const loyaltyRoutes = require('./routes/loyalty');
const customerRoutes = require('./routes/customers');
const hierarchicalServicesRoutes = require('./routes/hierarchical-services');
const testRoutes = require('./routes/test');

// Environment variables are already loaded by load-env.js

const app = express();
const PORT = process.env.PORT || 5001;

// Enable trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In production, allow the main domain and deployment URLs
    const allowedOrigins = [
      'http://localhost:3000',
      'https://glam-elegance.vercel.app', // Main production URL
      'https://glam-elegance-lmo57cg84-paul-makos-projects.vercel.app',
      'https://glam-elegance-8cbwgd1by-paul-makos-projects.vercel.app',
      process.env.CLIENT_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow any Vercel deployment of this project
    if (origin && origin.includes('glam-elegance') && origin.includes('vercel.app')) {
      return callback(null, true);
    }

    // For development, be more permissive
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting - very permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // much higher limit for development
  trustProxy: true, // Enable X-Forwarded-For header checking
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and development
    return req.path === '/api/health' || process.env.NODE_ENV === 'development';
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Session middleware for passport
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Database connection
const connectDB = async () => {
  try {
    // Test Prisma connection
    await prisma.$connect();
    console.log('✅ Prisma PostgreSQL connected successfully');

    // Test with a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database query test successful');

  } catch (err) {
    console.error('❌ Database connection error:', err);
    // Don't exit process in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/google-token', googleTokenRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/hierarchical-services', hierarchicalServicesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/staff-auth', staffAuthRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/test', testRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process for unhandled rejections in production
  // process.exit(1);
});

// Global error handling middleware (should be last)
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message, stack: error.stack })
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
