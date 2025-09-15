const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function pushSchema() {
  try {
    console.log('🚀 Pushing Prisma schema to database...');
    
    // Push schema to database (creates tables)
    console.log('📊 Creating database tables...');
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      cwd: __dirname + '/..'
    });
    
    console.log('✅ Database schema pushed successfully');
    
    // Test connection
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connection verified');
    
    // Test table creation
    const userCount = await prisma.user.count();
    console.log(`✅ Users table exists (count: ${userCount})`);
    
    await prisma.$disconnect();
    
    return {
      success: true,
      message: 'Schema pushed successfully',
      userCount
    };
    
  } catch (error) {
    console.error('❌ Schema push error:', error);
    throw error;
  }
}

// Export for use in API routes
module.exports = { pushSchema };

// Run if called directly
if (require.main === module) {
  pushSchema()
    .then((result) => {
      console.log('Schema push result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Schema push failed:', error);
      process.exit(1);
    });
}
