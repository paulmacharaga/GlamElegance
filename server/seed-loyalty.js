const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedLoyaltyProgram() {
  try {
    // Check if loyalty program already exists
    const existingProgram = await prisma.loyaltyProgram.findFirst();
    
    if (existingProgram) {
      console.log('Loyalty program already exists, skipping seed');
      return;
    }

    // Create default loyalty program
    const loyaltyProgram = await prisma.loyaltyProgram.create({
      data: {
        name: 'Hair Studio Rewards',
        description: 'Earn points with every visit and redeem them for exclusive rewards!',
        pointsPerBooking: 10,
        pointsPerDollar: 1,
        rewardThreshold: 100,
        rewardAmount: 10,
        isActive: true
      }
    });

    console.log('Loyalty program created successfully:', loyaltyProgram);
  } catch (error) {
    console.error('Error seeding loyalty program:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedLoyaltyProgram()
  .then(() => {
    console.log('Loyalty program seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during loyalty program seeding:', error);
    process.exit(1);
  });
