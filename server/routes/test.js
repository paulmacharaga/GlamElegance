const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { main: runMigration } = require('../scripts/migrate');
const router = express.Router();

// Simple ping test
router.get('/ping', (req, res) => {
  console.log('Ping request received from:', req.headers.origin || 'unknown origin');
  res.json({
    success: true,
    message: 'API is accessible',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  });
});

// Environment variables test
router.get('/env-check', (req, res) => {
  console.log('Environment check requested');
  res.json({
    success: true,
    message: 'Environment variables check',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    }
  });
});

// Test POST endpoint for browser testing
router.post('/browser-test', (req, res) => {
  console.log('Browser test request received from:', req.headers.origin || 'unknown origin');
  console.log('Request body:', req.body);
  res.json({
    success: true,
    message: 'Browser POST test successful',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    receivedData: req.body
  });
});

// Test database connection and user lookup
router.get('/db-connection', async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    // Test Prisma database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('Prisma database connection successful');

    // Test by counting users
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);

    // Test finding the admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'paul@ioi.co.zw' }
    });
    console.log('Admin user found:', !!adminUser);
    
    if (adminUser) {
      console.log('Admin user details:', {
        email: adminUser.email,
        username: adminUser.username,
        name: adminUser.name,
        role: adminUser.role,
        isActive: adminUser.isActive
      });
    }
    
    res.json({
      success: true,
      userCount,
      adminUserExists: !!adminUser,
      adminUser: adminUser ? {
        email: adminUser.email,
        username: adminUser.username,
        name: adminUser.name,
        role: adminUser.role,
        isActive: adminUser.isActive
      } : null
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test login functionality
router.post('/test-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Testing login for:', username);
    
    // Find user with Prisma
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ],
        isActive: true
      }
    });

    console.log('User found:', !!user);

    if (!user) {
      return res.json({
        success: false,
        message: 'User not found',
        searchedFor: username
      });
    }

    // Test password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    res.json({
      success: true,
      userFound: true,
      passwordMatch: isMatch,
      user: {
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create admin user for production
router.post('/create-admin', async (req, res) => {
  try {
    console.log('Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'paul@ioi.co.zw' }
    });

    if (existingAdmin) {
      return res.json({
        success: false,
        message: 'Admin user already exists',
        user: {
          email: existingAdmin.email,
          username: existingAdmin.username,
          name: existingAdmin.name,
          role: existingAdmin.role,
          isActive: existingAdmin.isActive
        }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Letmein99x!', 12);

    // Create admin user with Prisma
    const adminUser = await prisma.user.create({
      data: {
        username: 'paul',
        email: 'paul@ioi.co.zw',
        password: hashedPassword,
        name: 'Paul Macharaga',
        role: 'admin',
        isActive: true
      }
    });

    console.log('Admin user created successfully with Prisma');

    res.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        email: adminUser.email,
        username: adminUser.username,
        name: adminUser.name,
        role: adminUser.role,
        isActive: adminUser.isActive
      }
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Run database migration
router.post('/migrate', async (req, res) => {
  try {
    console.log('🚀 Starting database migration via API...');

    const result = await runMigration();

    res.json({
      success: true,
      message: 'Database migration completed successfully',
      result: result
    });
  } catch (error) {
    console.error('❌ Migration API error:', error);
    res.status(500).json({
      success: false,
      message: 'Database migration failed',
      error: error.message
    });
  }
});

// Debug login endpoint with full error details
router.post('/debug-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('🔍 Debug login attempt for:', username);

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ],
        isActive: true
      }
    });

    console.log('User found:', !!user);
    if (!user) {
      return res.json({
        success: false,
        message: 'User not found',
        step: 'user_lookup'
      });
    }

    // Test password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.json({
        success: false,
        message: 'Invalid password',
        step: 'password_check'
      });
    }

    // Test JWT generation
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    const jwt = require('jsonwebtoken');

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Token generated successfully');

    res.json({
      success: true,
      message: 'Debug login successful',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Debug login error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug login failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Test auth route without validation middleware
router.post('/simple-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Simple login attempt for:', username);

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ],
        isActive: true
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Simple login error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Check DATABASE_URL format and connection details
router.get('/database-url-check', async (req, res) => {
  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return res.json({
        success: false,
        message: 'DATABASE_URL not set',
        details: {
          hasUrl: false
        }
      });
    }

    // Parse the URL to check its format
    const urlInfo = {
      hasUrl: true,
      startsWithPostgresql: databaseUrl.startsWith('postgresql://'),
      startsWithPostgres: databaseUrl.startsWith('postgres://'),
      startsWithFile: databaseUrl.startsWith('file:'),
      startsWithSqlite: databaseUrl.startsWith('sqlite:'),
      length: databaseUrl.length,
      firstPart: databaseUrl.substring(0, 20) + '...',
      containsHost: databaseUrl.includes('@'),
      containsPort: databaseUrl.includes(':5432') || databaseUrl.includes(':5433'),
      containsSslMode: databaseUrl.includes('sslmode='),
    };

    // Try to connect and get database info
    let connectionTest = null;
    try {
      await prisma.$connect();
      connectionTest = {
        canConnect: true,
        error: null
      };

      // Try a simple query to test the connection type
      try {
        const result = await prisma.$queryRaw`SELECT version()`;
        connectionTest.databaseVersion = result[0]?.version || 'Unknown';
        connectionTest.isPostgreSQL = result[0]?.version?.includes('PostgreSQL') || false;
      } catch (queryError) {
        connectionTest.queryError = queryError.message;
      }

      await prisma.$disconnect();
    } catch (connectError) {
      connectionTest = {
        canConnect: false,
        error: connectError.message
      };
    }

    res.json({
      success: true,
      message: 'Database URL analysis',
      urlInfo,
      connectionTest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking database URL',
      error: error.message,
      stack: error.stack
    });
  }
});

// Force regenerate Prisma client
router.post('/regenerate-prisma', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const path = require('path');

    // Change to server directory and regenerate Prisma client
    const serverDir = path.join(process.cwd(), 'server');

    exec('cd server && npx prisma generate', (error, stdout, stderr) => {
      if (error) {
        console.error('Prisma generate error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to regenerate Prisma client',
          error: error.message,
          stderr: stderr
        });
      }

      res.json({
        success: true,
        message: 'Prisma client regenerated successfully',
        stdout: stdout,
        stderr: stderr,
        timestamp: new Date().toISOString()
      });
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error regenerating Prisma client',
      error: error.message,
      stack: error.stack
    });
  }
});

// Check what tables exist in the database
router.get('/check-tables', async (req, res) => {
  try {
    // Check if tables exist and what data they contain
    const results = {};

    // Check users table
    try {
      const userCount = await prisma.user.count();
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });
      results.users = {
        exists: true,
        count: userCount,
        data: users
      };
    } catch (error) {
      results.users = {
        exists: false,
        error: error.message
      };
    }

    // Check staff table
    try {
      const staffCount = await prisma.staff.count();
      const staff = await prisma.staff.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true
        }
      });
      results.staff = {
        exists: true,
        count: staffCount,
        data: staff
      };
    } catch (error) {
      results.staff = {
        exists: false,
        error: error.message
      };
    }

    // Check services table
    try {
      const serviceCount = await prisma.service.count();
      results.services = {
        exists: true,
        count: serviceCount
      };
    } catch (error) {
      results.services = {
        exists: false,
        error: error.message
      };
    }

    // Check bookings table
    try {
      const bookingCount = await prisma.booking.count();
      results.bookings = {
        exists: true,
        count: bookingCount
      };
    } catch (error) {
      results.bookings = {
        exists: false,
        error: error.message
      };
    }

    res.json({
      success: true,
      message: 'Database tables check',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking tables',
      error: error.message,
      stack: error.stack
    });
  }
});

// Test hierarchical services route
router.get('/hierarchical-test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Hierarchical services route is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in hierarchical test',
      error: error.message
    });
  }
});

module.exports = router;
