const { PrismaClient } = require('@prisma/client');

// Global variable to store the Prisma client instance
let prisma;

// Initialize Prisma client with proper configuration for serverless
if (process.env.NODE_ENV === 'production') {
  // In production, create a new instance
  prisma = new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
} else {
  // In development, use global variable to prevent multiple instances
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  prisma = global.prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
