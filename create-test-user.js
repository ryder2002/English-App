const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash('123456', 12);
    console.log('✅ Password hashed');
    
    console.log('👤 Creating user...');
    const user = await prisma.user.create({
      data: {
        email: 'dinhcongnhat.02@gmail.com',
        password: hashedPassword,
        name: 'Test User'
      }
    });
    
    console.log('✅ Created test user:', {
      id: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️  User already exists');
      
      // Try to find existing user
      const existingUser = await prisma.user.findUnique({
        where: { email: 'dinhcongnhat.02@gmail.com' }
      });
      console.log('📋 Existing user:', existingUser ? {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name
      } : 'Not found');
    } else {
      console.error('❌ Error:', error.message);
      console.error('Full error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
