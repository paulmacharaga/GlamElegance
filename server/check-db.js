const prisma = require('./lib/prisma');

async function checkDatabase() {
  try {
    console.log('🔍 Connecting to database...');
    
    // Test connection by querying the staff table
    const staffCount = await prisma.staff.count();
    console.log(`✅ Successfully connected to database. Found ${staffCount} staff members.`);
    
    // List all tables
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📊 Database tables:', result);
    
    // Check if staff table exists
    const staffTableExists = result.some(t => t.table_name === 'staff');
    console.log(staffTableExists ? '✅ Staff table exists' : '❌ Staff table does not exist');
    
    if (staffTableExists) {
      // Get first staff member
      const firstStaff = await prisma.staff.findFirst();
      console.log('👤 First staff member:', firstStaff);
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
