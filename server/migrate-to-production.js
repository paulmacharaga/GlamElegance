// Script to migrate database schema to production
const { execSync } = require('child_process');
const fs = require('fs');

// Get production DATABASE_URL from command line argument or environment
const PRODUCTION_DATABASE_URL = process.argv[2] || process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

if (!PRODUCTION_DATABASE_URL) {
  console.error('❌ Production DATABASE_URL is required');
  console.log('Usage: node migrate-to-production.js "postgresql://user:pass@host:port/db"');
  console.log('Or set: export PRODUCTION_DATABASE_URL="your_vercel_postgres_url"');
  process.exit(1);
}

console.log('🚀 Migrating to production database...');
console.log('📍 Database URL:', PRODUCTION_DATABASE_URL.substring(0, 30) + '...');

try {
  // Temporarily set DATABASE_URL to production
  process.env.DATABASE_URL = PRODUCTION_DATABASE_URL;
  
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Push schema to production database
  console.log('🗄️ Pushing schema to production database...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  
  console.log('✅ Production database migration complete!');
  console.log('🎯 You can now run the seed script to add initial data');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
