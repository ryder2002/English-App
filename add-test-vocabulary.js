const { PrismaClient } = require('@prisma/client');

async function addTestVocabulary() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Finding existing user and folder...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'dinhcongnhat.02@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    const folder = await prisma.folder.findFirst({
      where: { userId: user.id }
    });
    
    if (!folder) {
      console.log('❌ Folder not found');
      return;
    }
    
    console.log('✅ Found user:', user.email);
    console.log('✅ Found folder:', folder.name);
    
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
    
    // Check final counts
    const userCount = await prisma.user.count();
    const folderCount = await prisma.folder.count();
    const vocabCount = await prisma.vocabulary.count();
    
    console.log('📊 Final counts:');
    console.log('👥 Users:', userCount);
    console.log('📁 Folders:', folderCount);
    console.log('📚 Vocabulary:', vocabCount);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addTestVocabulary();
