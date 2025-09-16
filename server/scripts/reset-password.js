const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = 'paul@ioi.co.zw';
    const newPassword = 'newpassword123'; // Change this to a secure password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.staff.update({
      where: { email },
      data: {
        password: hashedPassword,
        isActive: true
      },
    });

    console.log('✅ Password reset successful for:', email);
    console.log('New password:', newPassword);
    return updatedUser;
  } catch (error) {
    console.error('❌ Error resetting password:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
