// This script should be run with production DATABASE_URL
const { execSync } = require('child_process');

console.log('🚀 Setting up production database...');

try {
  // Generate Prisma client for production
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Push schema to production database
  console.log('🗄️ Pushing schema to production database...');
  execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
  
  console.log('✅ Production database setup complete!');
} catch (error) {
  console.error('❌ Error setting up production database:', error.message);
  process.exit(1);
}
