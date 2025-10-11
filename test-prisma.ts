import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPrisma() {
  try {
    console.log('🔍 Testing Prisma connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Prisma connected successfully!');
    
    // Test creating a user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword123',
        name: 'Test User'
      }
    });
    console.log('✅ Created test user:', testUser);
    
    // Test creating a folder
    const testFolder = await prisma.folder.create({
      data: {
        name: 'Test Folder',
        userId: testUser.id
      }
    });
    console.log('✅ Created test folder:', testFolder);
    
    // Test creating vocabulary
    const testVocab = await prisma.vocabulary.create({
      data: {
        word: 'hello',
        language: 'english',
        vietnameseTranslation: 'xin chào',
        folder: 'Test Folder',
        userId: testUser.id
      }
    });
    console.log('✅ Created test vocabulary:', testVocab);
    
    // Clean up test data
    await prisma.vocabulary.delete({ where: { id: testVocab.id } });
    await prisma.folder.delete({ where: { id: testFolder.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Cleaned up test data');
    
    console.log('🎉 Prisma test completed successfully!');
    
  } catch (error) {
    console.error('❌ Prisma test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
