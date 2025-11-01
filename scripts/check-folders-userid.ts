import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🔍 Kiểm tra folders và vocabulary trong database...\n');

  // Get all folders
  const allFolders = await prisma.folder.findMany({
    include: {
      user: {
        select: { id: true, email: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('📁 Tất cả folders:');
  allFolders.forEach(folder => {
    console.log(`  - ID: ${folder.id}, Name: "${folder.name}", UserID: ${folder.userId}, User: ${folder.user.email} (${folder.user.role})`);
  });

  // Get all vocabulary
  const allVocabulary = await prisma.vocabulary.findMany({
    include: {
      user: {
        select: { id: true, email: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('\n📝 Tất cả vocabulary:');
  allVocabulary.forEach(vocab => {
    console.log(`  - ID: ${vocab.id}, Word: "${vocab.word}", Folder: "${vocab.folder}", UserID: ${vocab.userId}, User: ${vocab.user.email} (${vocab.user.role})`);
  });

  // Get all users
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });

  console.log('\n👥 Tất cả users:');
  allUsers.forEach(user => {
    console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
  });

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

