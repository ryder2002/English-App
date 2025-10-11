import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword(email: string, newPassword: string) {
  try {
    console.log(`🔄 Resetting password for: ${email}`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return false;
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    console.log(`✅ Password reset successfully for: ${email}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Command line usage
async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  
  if (!email || !newPassword) {
    console.log(`
Usage: 
  npm run reset-password <email> <new-password>

Examples:
  npm run reset-password user@example.com mynewpassword123
  npm run reset-password user@example.com temp123456
    `);
    process.exit(1);
  }
  
  const success = await resetPassword(email, newPassword);
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

export { resetPassword };
