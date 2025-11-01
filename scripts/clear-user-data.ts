import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🗑️  Đang xóa dữ liệu của tất cả users (không phải admin)...');

  try {
    // Get all users who are not admin
    const nonAdminUsers = await prisma.user.findMany({
      where: {
        role: { not: 'admin' }
      },
      select: { id: true, email: true }
    });

    console.log(`\nTìm thấy ${nonAdminUsers.length} users (không phải admin)`);
    
    for (const user of nonAdminUsers) {
      console.log(`\nĐang xóa dữ liệu của user ${user.id} (${user.email})...`);
      
      // Delete vocabulary
      const vocabCount = await prisma.vocabulary.deleteMany({
        where: { userId: user.id }
      });
      console.log(`  ✅ Đã xóa ${vocabCount.count} từ vựng`);
      
      // Delete folders
      const folderCount = await prisma.folder.deleteMany({
        where: { userId: user.id }
      });
      console.log(`  ✅ Đã xóa ${folderCount.count} thư mục`);
      
      // Delete quiz results
      const resultCount = await prisma.quizResult.deleteMany({
        where: { userId: user.id }
      });
      console.log(`  ✅ Đã xóa ${resultCount.count} kết quả bài kiểm tra`);
      
      // Remove from classes
      const memberCount = await prisma.classMember.deleteMany({
        where: { userId: user.id }
      });
      console.log(`  ✅ Đã xóa ${memberCount.count} thành viên lớp học`);
    }

    // Verify
    const remainingVocab = await prisma.vocabulary.findMany({
      where: {
        user: {
          role: { not: 'admin' }
        }
      }
    });

    const remainingFolders = await prisma.folder.findMany({
      where: {
        user: {
          role: { not: 'admin' }
        }
      }
    });

    console.log('\n✅ Hoàn thành!');
    console.log(`\nKiểm tra lại:`);
    console.log(`  - Vocabulary còn lại của users: ${remainingVocab.length}`);
    console.log(`  - Folders còn lại của users: ${remainingFolders.length}`);
    
    if (remainingVocab.length > 0 || remainingFolders.length > 0) {
      console.log('\n⚠️  CẢNH BÁO: Vẫn còn dữ liệu của users!');
    } else {
      console.log('\n✅ Tất cả users đã trống rỗng.');
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

