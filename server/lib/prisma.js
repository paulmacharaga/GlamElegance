const { PrismaClient } = require('@prisma/client');

// Global variable to store the Prisma client instance
let prisma;

// Initialize Prisma client with connection pooling
if (process.env.NODE_ENV === 'production') {
  console.log('🔄 Initializing Prisma client in production mode');
  if (!global.prisma) {
    console.log('🔌 Creating new Prisma client instance for production');
    global.prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }
  prisma = global.prisma;
} else {
  // Development mode with hot-reload support
  if (!global.prisma) {
    console.log('🔌 Creating new Prisma client instance for development');
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error']
    });
  }
  prisma = global.prisma;
}

// Test the database connection on startup
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to the database');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    return false;
  }
}

// Test the connection immediately
testConnection().catch(console.error);

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
