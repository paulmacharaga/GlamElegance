const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if tables exist by trying to count records
    console.log('\n📊 Checking tables...');
    
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Users table exists - ${userCount} records`);
    } catch (error) {
      console.log('❌ Users table missing or error:', error.message);
    }
    
    try {
      const staffCount = await prisma.staff.count();
      console.log(`✅ Staff table exists - ${staffCount} records`);
    } catch (error) {
      console.log('❌ Staff table missing or error:', error.message);
    }
    
    try {
      const serviceCount = await prisma.service.count();
      console.log(`✅ Services table exists - ${serviceCount} records`);
    } catch (error) {
      console.log('❌ Services table missing or error:', error.message);
    }
    
    try {
      const bookingCount = await prisma.booking.count();
      console.log(`✅ Bookings table exists - ${bookingCount} records`);
    } catch (error) {
      console.log('❌ Bookings table missing or error:', error.message);
    }
    
    try {
      const customerCount = await prisma.customer.count();
      console.log(`✅ Customers table exists - ${customerCount} records`);
    } catch (error) {
      console.log('❌ Customers table missing or error:', error.message);
    }
    
    try {
      const loyaltyCount = await prisma.loyaltyProgram.count();
      console.log(`✅ LoyaltyProgram table exists - ${loyaltyCount} records`);
    } catch (error) {
      console.log('❌ LoyaltyProgram table missing or error:', error.message);
    }
    
    // Check for admin user
    console.log('\n👤 Checking for admin users...');
    try {
      const adminStaff = await prisma.staff.findMany({
        where: { role: 'admin' },
        select: { id: true, name: true, email: true, role: true, isActive: true }
      });
      
      if (adminStaff.length > 0) {
        console.log('✅ Admin users found:');
        adminStaff.forEach(admin => {
          console.log(`   - ${admin.name} (${admin.email}) - ${admin.isActive ? 'Active' : 'Inactive'}`);
        });
      } else {
        console.log('⚠️  No admin users found');
      }
    } catch (error) {
      console.log('❌ Error checking admin users:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
