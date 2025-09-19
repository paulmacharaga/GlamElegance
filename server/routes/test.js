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
    // Test if ServiceCategory model exists
    const categoryCount = await prisma.serviceCategory.count();

    res.json({
      success: true,
      message: 'Hierarchical services test successful',
      categoryCount,
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

// Create hierarchical services tables with proper SQL
router.post('/migrate-hierarchical', async (req, res) => {
  try {
    // Drop existing tables if they exist (to fix column names)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS booking_service_variants CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS service_variants CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS services CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS hierarchical_services CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS service_categories CASCADE`);

    // Create service_categories table (matching Prisma schema)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE service_categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        "displayOrder" INTEGER DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create services table (matching Prisma schema)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE services (
        id TEXT PRIMARY KEY,
        "categoryId" TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        "basePrice" DECIMAL(10,2) NOT NULL,
        "baseDuration" INTEGER NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "displayOrder" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("categoryId") REFERENCES service_categories(id)
      )
    `);

    // Create service_variants table (matching Prisma schema)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE service_variants (
        id TEXT PRIMARY KEY,
        "serviceId" TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        "priceModifier" DECIMAL(10,2) NOT NULL,
        "durationModifier" INTEGER DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        "displayOrder" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("serviceId") REFERENCES services(id)
      )
    `);

    // Create booking_service_variants table (matching Prisma schema)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE booking_service_variants (
        id TEXT PRIMARY KEY,
        "bookingId" TEXT NOT NULL,
        "variantId" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("bookingId") REFERENCES bookings(id),
        FOREIGN KEY ("variantId") REFERENCES service_variants(id)
      )
    `);

    // Add missing columns to bookings table for hierarchical services
    await prisma.$executeRawUnsafe(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS "totalDuration" INTEGER DEFAULT 60
    `);

    res.json({
      success: true,
      message: 'Hierarchical services tables created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating hierarchical tables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hierarchical services tables',
      error: error.message
    });
  }
});

// Check for duplicate services
router.get('/check-services', async (req, res) => {
  try {
    // Count services in hierarchical services table
    const hierarchicalCount = await prisma.service.count();

    // Get sample services
    const sampleServices = await prisma.service.findMany({
      take: 10,
      include: {
        category: true
      }
    });

    res.json({
      success: true,
      hierarchicalServicesCount: hierarchicalCount,
      sampleServices: sampleServices.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category?.name,
        basePrice: s.basePrice,
        baseDuration: s.baseDuration
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check services',
      error: error.message
    });
  }
});

module.exports = router;
