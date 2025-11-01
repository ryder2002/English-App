import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🗑️  Đang xóa tất cả dữ liệu...');

  // Delete in correct order to avoid foreign key constraints
  try {
    // Delete quiz results first
    await prisma.quizResult.deleteMany({});
    console.log('✅ Đã xóa quiz results');

    // Delete quizzes
    await prisma.quiz.deleteMany({});
    console.log('✅ Đã xóa quizzes');

    // Delete class members
    await prisma.classMember.deleteMany({});
    console.log('✅ Đã xóa class members');

    // Delete classes
    await prisma.clazz.deleteMany({});
    console.log('✅ Đã xóa classes');

    // Delete vocabulary
    await prisma.vocabulary.deleteMany({});
    console.log('✅ Đã xóa vocabulary');

    // Delete folders (Cascade will handle children)
    await prisma.folder.deleteMany({});
    console.log('✅ Đã xóa folders');

    // Delete all users
    await prisma.user.deleteMany({});
    console.log('✅ Đã xóa tất cả users');

    // Create new admin
    const email = 'dinhcongnhat.02@gmail.com';
    const password = '10122002';
    const name = 'Admin';
    
    const hash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hash,
        role: 'admin',
        name: name || undefined,
      },
    });
    
    console.log('\n✅ Admin user đã được tạo thành công!');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Name:', admin.name || 'N/A');
    console.log('ID:', admin.id);
    
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

