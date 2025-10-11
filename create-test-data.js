const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('👤 Creating test user...');
    
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'dinhcongnhat.02@gmail.com',
        name: 'Test User',
        password: hashedPassword,
      }
    });
    
    console.log('✅ Test user created:', user);
    
    // Create a test folder
    console.log('📁 Creating test folder...');
    const folder = await prisma.folder.create({
      data: {
        name: 'Test Folder',
        userId: user.id,
      }
    });
    
    console.log('✅ Test folder created:', folder);
    
    // Create test vocabulary
    console.log('📚 Creating test vocabulary...');
    const vocabulary = await prisma.vocabulary.create({
      data: {
        word: 'hello',
        language: 'english',
        vietnameseTranslation: 'xin chào',
        folder: folder.name,
        ipa: '/həˈloʊ/',
        userId: user.id,
      }
    });
    
    console.log('✅ Test vocabulary created:', vocabulary);
    
    console.log('🎉 Test data created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
