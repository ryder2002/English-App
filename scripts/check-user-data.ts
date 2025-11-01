import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('📊 Kiểm tra dữ liệu users và admin...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        _count: {
          select: {
            vocabulary: true,
            folders: true,
            classesJoined: true,
            classesOwned: true,
          }
        }
      }
    });

    console.log('=== USERS ===');
    for (const user of users) {
      console.log(`\nUser ${user.id} (${user.email}, ${user.role}):`);
      console.log(`  - Vocabulary: ${user._count.vocabulary}`);
      console.log(`  - Folders: ${user._count.folders}`);
      console.log(`  - Classes joined: ${user._count.classesJoined}`);
      console.log(`  - Classes owned: ${user._count.classesOwned}`);
    }

    // Get all vocabulary with owner info
    const vocab = await prisma.vocabulary.findMany({
      include: {
        user: {
          select: { id: true, email: true, role: true }
        }
      }
    });

    console.log('\n\n=== VOCABULARY ===');
    if (vocab.length === 0) {
      console.log('✅ Không có vocabulary nào trong database');
    } else {
      vocab.forEach(v => {
        console.log(`ID ${v.id}: "${v.word}" (folder: "${v.folder}") - Owner: ${v.userId} (${v.user.email}, ${v.user.role})`);
      });
    }

    // Get all folders with owner info
    const folders = await prisma.folder.findMany({
      include: {
        user: {
          select: { id: true, email: true, role: true }
        }
      }
    });

    console.log('\n\n=== FOLDERS ===');
    if (folders.length === 0) {
      console.log('✅ Không có folders nào trong database');
    } else {
      folders.forEach(f => {
        console.log(`ID ${f.id}: "${f.name}" - Owner: ${f.userId} (${f.user.email}, ${f.user.role})`);
      });
    }

    // Check for any vocabulary that might belong to wrong user
    const nonAdminVocab = vocab.filter(v => v.user.role !== 'admin');
    if (nonAdminVocab.length > 0) {
      console.log('\n\n⚠️  CẢNH BÁO: Có vocabulary của users (không phải admin):');
      nonAdminVocab.forEach(v => {
        console.log(`  - "${v.word}" (user ${v.userId})`);
      });
    } else {
      console.log('\n\n✅ Tất cả vocabulary đều thuộc về admin hoặc không có vocabulary của users');
    }

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

