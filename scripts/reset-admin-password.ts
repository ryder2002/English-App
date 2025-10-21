import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: npx ts-node scripts/reset-admin-password.ts <admin-email> <new-password>');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  const user = await prisma.user.update({
    where: { email },
    data: { password: hashed },
    select: { id: true, email: true, role: true }
  });

  console.log('Password reset for:', user);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
