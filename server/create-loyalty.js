const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createLoyaltyProgram() {
  try {
    const existing = await prisma.loyaltyProgram.findFirst();
    if (!existing) {
      await prisma.loyaltyProgram.create({
        data: {
          name: 'Glam Elegance Rewards',
          description: 'Earn points with every booking and redeem them for discounts on future services!',
          pointsPerBooking: 10,
          pointsPerDollar: 1,
          rewardThreshold: 100,
          rewardAmount: 10.0,
          isActive: true
        }
      });
      console.log('Loyalty program created successfully!');
    } else {
      console.log('Loyalty program already exists');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

createLoyaltyProgram();
