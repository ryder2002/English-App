import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { password: hash, role: 'admin' },
    create: {
      email,
      password: hash,
      role: 'admin',
      name: 'Admin',
    },
  });
  console.log('Admin user:', admin);
}

main().catch(e => { console.error(e); process.exit(1); });
