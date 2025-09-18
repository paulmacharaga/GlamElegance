const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check if admin user exists
    const existingAdmin = await prisma.staff.findFirst({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Database already initialized',
        admin: {
          name: existingAdmin.name,
          email: existingAdmin.email
        }
      });
    }

    // Create default admin user
    console.log('👤 Creating default admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.staff.create({
      data: {
        name: 'Admin User',
        email: 'admin@glamelegance.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      }
    });

    // Create default services
    console.log('💇 Creating default services...');
    await prisma.service.createMany({
      data: [
        { name: 'Hair Cut', description: 'Professional hair cutting service', duration: 60, price: 50.00 },
        { name: 'Hair Color', description: 'Hair coloring and styling', duration: 120, price: 80.00 },
        { name: 'Hair Wash & Blow Dry', description: 'Hair washing and blow drying', duration: 45, price: 30.00 },
        { name: 'Hair Treatment', description: 'Deep conditioning hair treatment', duration: 90, price: 60.00 }
      ]
    });

    // Create default loyalty program
    console.log('🎁 Creating loyalty program...');
    await prisma.loyaltyProgram.create({
      data: {
        name: 'Glam Elegance Rewards',
        description: 'Earn points with every booking and get rewards!',
        pointsPerBooking: 10,
        pointsPerDollar: 1,
        rewardThreshold: 100,
        rewardAmount: 10.0,
        birthdayDiscountRate: 20.0,
        birthdayDiscountDays: 7,
        isActive: true
      }
    });

    console.log('✅ Database initialization complete');

    res.json({
      success: true,
      message: 'Database initialized successfully',
      admin: {
        name: admin.name,
        email: admin.email,
        defaultPassword: 'admin123'
      }
    });

  } catch (error) {
    console.error('❌ Database setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Database setup failed',
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
};
