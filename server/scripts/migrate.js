const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Starting database migration...');

    // Test connection first
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Create tables using raw SQL
    console.log('📊 Creating database tables...');

    // Create users table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "username" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'user',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );
    `;

    // Create unique indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");`;

    // Create services table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "services" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "duration" INTEGER NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "services_pkey" PRIMARY KEY ("id")
      );
    `;

    // Create staff table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "staff" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT,
        "phone" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
      );
    `;

    // Create bookings table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "bookings" (
        "id" TEXT NOT NULL,
        "customerName" TEXT NOT NULL,
        "customerEmail" TEXT NOT NULL,
        "customerPhone" TEXT NOT NULL,
        "serviceId" TEXT NOT NULL,
        "staffId" TEXT,
        "bookingDate" TIMESTAMP(3) NOT NULL,
        "bookingTime" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
      );
    `;

    // Create feedback table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "feedback" (
        "id" TEXT NOT NULL,
        "customerName" TEXT NOT NULL,
        "customerEmail" TEXT,
        "serviceRating" INTEGER NOT NULL,
        "staffRating" INTEGER,
        "overallRating" INTEGER NOT NULL,
        "comments" TEXT,
        "serviceUsed" TEXT,
        "staffMember" TEXT,
        "wouldRecommend" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
      );
    `;

    console.log('✅ Database tables created successfully');

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

    // Generate unique ID
    const { randomBytes } = require('crypto');
    const adminId = randomBytes(12).toString('hex');

    // Create admin user with raw SQL to ensure proper ID
    await prisma.$executeRaw`
      INSERT INTO "users" ("id", "username", "email", "password", "name", "role", "isActive", "createdAt", "updatedAt")
      VALUES (${adminId}, 'paul', 'paul@ioi.co.zw', ${hashedPassword}, 'Paul Macharaga', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    // Get the created user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'paul@ioi.co.zw' }
    });

    console.log('✅ Admin user created successfully');

    // Create some default services
    console.log('💄 Creating default services...');

    const serviceId1 = randomBytes(12).toString('hex');
    const serviceId2 = randomBytes(12).toString('hex');
    const serviceId3 = randomBytes(12).toString('hex');
    const serviceId4 = randomBytes(12).toString('hex');

    await prisma.$executeRaw`
      INSERT INTO "services" ("id", "name", "description", "duration", "price", "isActive", "createdAt", "updatedAt")
      VALUES
        (${serviceId1}, 'Hair Cut & Style', 'Professional hair cutting and styling', 60, 25.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (${serviceId2}, 'Manicure', 'Complete nail care and polish', 45, 20.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (${serviceId3}, 'Pedicure', 'Foot care and nail treatment', 60, 30.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (${serviceId4}, 'Facial Treatment', 'Deep cleansing facial treatment', 90, 45.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    console.log('✅ Default services created');

    // Create default staff
    console.log('👥 Creating default staff...');

    const staffId1 = randomBytes(12).toString('hex');
    const staffId2 = randomBytes(12).toString('hex');

    await prisma.$executeRaw`
      INSERT INTO "staff" ("id", "name", "email", "phone", "isActive", "createdAt", "updatedAt")
      VALUES
        (${staffId1}, 'Sarah Johnson', 'sarah@glamelegance.com', '+1234567890', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (${staffId2}, 'Maria Garcia', 'maria@glamelegance.com', '+1234567891', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

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
