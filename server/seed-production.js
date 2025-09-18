const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedProduction() {
  try {
    console.log('🌱 Seeding production database...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.staff.findFirst({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
    } else {
      // Create admin user
      console.log('👤 Creating admin user...');
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
      
      console.log('✅ Admin user created:', admin.email);
    }

    // Check if services exist
    const serviceCount = await prisma.service.count();
    if (serviceCount === 0) {
      console.log('💇 Creating default services...');
      await prisma.service.createMany({
        data: [
          { name: 'Hair Cut', description: 'Professional hair cutting service', duration: 60, price: 50.00 },
          { name: 'Hair Color', description: 'Hair coloring and styling', duration: 120, price: 80.00 },
          { name: 'Hair Wash & Blow Dry', description: 'Hair washing and blow drying', duration: 45, price: 30.00 },
          { name: 'Hair Treatment', description: 'Deep conditioning hair treatment', duration: 90, price: 60.00 }
        ]
      });
      console.log('✅ Default services created');
    } else {
      console.log('✅ Services already exist:', serviceCount, 'services');
    }

    // Check if loyalty program exists
    const loyaltyCount = await prisma.loyaltyProgram.count();
    if (loyaltyCount === 0) {
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
      console.log('✅ Loyalty program created');
    } else {
      console.log('✅ Loyalty program already exists');
    }

    console.log('🎉 Production database seeding complete!');
    console.log('');
    console.log('📋 Login credentials:');
    console.log('   Email: admin@glamelegance.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProduction();
