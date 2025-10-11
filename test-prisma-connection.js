const { PrismaClient } = require('@prisma/client');

async function testPrismaConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔗 Testing Prisma connection...');
    
    // Test connection by counting users
    const userCount = await prisma.user.count();
    console.log('✅ Connected! User count:', userCount);
    
    // Test getting all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
    console.log('👥 Users:', users);
    
    // Test vocabulary count  
    const vocabCount = await prisma.vocabulary.count();
    console.log('📚 Vocabulary count:', vocabCount);
    
    // Test folder count
    const folderCount = await prisma.folder.count();
    console.log('📁 Folder count:', folderCount);
    
    console.log('🎉 Prisma is working correctly!');
    
  } catch (error) {
    console.error('❌ Prisma error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();
