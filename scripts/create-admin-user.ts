import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'nhatem85@gmail.com';
  const password = '10122002';
  const name = 'Admin';
  
  try {
    // Hash password
    const hash = await bcrypt.hash(password, 12);

    // Create or update admin user
    const admin = await prisma.user.upsert({
      where: { email },
      update: { 
        password: hash, 
        role: 'admin',
        name: name || undefined,
      },
      create: {
        email,
        password: hash,
        role: 'admin',
        name: name || undefined,
      },
    });
    
    console.log('✅ Admin user created/updated successfully!');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Name:', admin.name || 'N/A');
    console.log('ID:', admin.id);
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => { 
  console.error(e); 
  process.exit(1); 
});

