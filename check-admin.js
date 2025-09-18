const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('Checking for admin users...');
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, email: true, username: true, name: true }
    });
    
    console.log('Admin users found:', admins.length);
    console.log(admins);
    
    if (admins.length === 0) {
      console.log('No admin users found. Here are all users:');
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, username: true, name: true, role: true }
      });
      console.log(allUsers);
    }
  } catch (error) {
    console.error('Error checking admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
