const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Starting database migration...');

    // Create tables using Prisma's migration
    console.log('📊 Creating database tables...');
    
    // Test connection first
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Create admin user
    console.log('👤 Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'paul@ioi.co.zw' }
    });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      return {
        success: true,
        message: 'Admin user already exists',
        user: existingAdmin
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Letmein99x!', 12);

    // Create admin user
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

    console.log('✅ Admin user created successfully');

    // Create some default services
    console.log('💄 Creating default services...');
    
    const services = [
      {
        name: 'Hair Cut & Style',
        description: 'Professional hair cutting and styling',
        duration: 60,
        price: 25.00,
        isActive: true
      },
      {
        name: 'Manicure',
        description: 'Complete nail care and polish',
        duration: 45,
        price: 20.00,
        isActive: true
      },
      {
        name: 'Pedicure',
        description: 'Foot care and nail treatment',
        duration: 60,
        price: 30.00,
        isActive: true
      },
      {
        name: 'Facial Treatment',
        description: 'Deep cleansing facial treatment',
        duration: 90,
        price: 45.00,
        isActive: true
      }
    ];

    for (const service of services) {
      await prisma.service.create({ data: service });
    }

    console.log('✅ Default services created');

    // Create default staff
    console.log('👥 Creating default staff...');
    
    const staff = [
      {
        name: 'Sarah Johnson',
        email: 'sarah@glamelegance.com',
        phone: '+1234567890',
        isActive: true
      },
      {
        name: 'Maria Garcia',
        email: 'maria@glamelegance.com',
        phone: '+1234567891',
        isActive: true
      }
    ];

    for (const member of staff) {
      await prisma.staff.create({ data: member });
    }

    console.log('✅ Default staff created');
    console.log('🎉 Database migration completed successfully!');

    return {
      success: true,
      message: 'Database migration completed successfully',
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        username: adminUser.username,
        name: adminUser.name,
        role: adminUser.role
      }
    };

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in API routes
module.exports = { main };

// Run if called directly
if (require.main === module) {
  main()
    .then((result) => {
      console.log('Migration result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
