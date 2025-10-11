// Script tạo test accounts dễ nhớ hơn
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createFriendlyTestAccounts() {
  try {
    console.log('🔧 Creating user-friendly test accounts...');
    
    const friendlyAccounts = [
      {
        email: 'admin@test.com',
        password: '123456',
        name: 'Admin User',
        folders: ['Business English', 'Daily Conversation', 'TOEIC Prep'],
        sampleVocab: [
          { word: 'meeting', translation: 'cuộc họp', folder: 'Business English' },
          { word: 'schedule', translation: 'lịch trình', folder: 'Business English' },
          { word: 'hello', translation: 'xin chào', folder: 'Daily Conversation' },
          { word: 'goodbye', translation: 'tạm biệt', folder: 'Daily Conversation' },
          { word: 'achievement', translation: 'thành tựu', folder: 'TOEIC Prep' },
          { word: 'employee', translation: 'nhân viên', folder: 'TOEIC Prep' },
        ]
      },
      {
        email: 'user@test.com',
        password: '123456',
        name: 'Test User',
        folders: ['HSK Chinese', 'Basic English'],
        sampleVocab: [
          { word: '你好', translation: 'xin chào', folder: 'HSK Chinese', language: 'chinese', pinyin: 'nǐ hǎo' },
          { word: '谢谢', translation: 'cảm ơn', folder: 'HSK Chinese', language: 'chinese', pinyin: 'xiè xiè' },
          { word: 'book', translation: 'sách', folder: 'Basic English' },
          { word: 'pen', translation: 'bút', folder: 'Basic English' },
        ]
      },
      {
        email: 'student@test.com',
        password: '123456',
        name: 'Student',
        folders: ['Academic Words', 'Phrasal Verbs'],
        sampleVocab: [
          { word: 'analyze', translation: 'phân tích', folder: 'Academic Words' },
          { word: 'hypothesis', translation: 'giả thuyết', folder: 'Academic Words' },
          { word: 'give up', translation: 'từ bỏ', folder: 'Phrasal Verbs' },
          { word: 'look forward to', translation: 'mong chờ', folder: 'Phrasal Verbs' },
        ]
      }
    ];
    
    for (const account of friendlyAccounts) {
      try {
        console.log(`\\n👤 Creating account: ${account.email}`);
        
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: account.email }
        });
        
        let user;
        if (existingUser) {
          console.log(`⚠️ User ${account.email} already exists, using existing account`);
          user = existingUser;
        } else {
          const hashedPassword = await bcrypt.hash(account.password, 10);
          
          user = await prisma.user.create({
            data: {
              email: account.email,
              name: account.name,
              password: hashedPassword,
            }
          });
          
          console.log(`✅ Created user: ${account.email}`);
        }
        
        // Create folders
        for (const folderName of account.folders) {
          try {
            const folder = await prisma.folder.create({
              data: {
                name: folderName,
                userId: user.id,
              }
            });
            
            console.log(`✅ Created folder: ${folderName}`);
          } catch (error) {
            if (error.code === 'P2002') {
              console.log(`⚠️ Folder "${folderName}" already exists`);
            } else {
              console.error(`❌ Error creating folder "${folderName}":`, error.message);
            }
          }
        }
        
        // Create vocabulary
        for (const vocab of account.sampleVocab) {
          try {
            await prisma.vocabulary.create({
              data: {
                word: vocab.word,
                language: vocab.language || 'english',
                vietnameseTranslation: vocab.translation,
                folder: vocab.folder,
                ipa: vocab.ipa || null,
                pinyin: vocab.pinyin || null,
                userId: user.id,
              }
            });
            
            console.log(`✅ Added vocabulary: ${vocab.word} = ${vocab.translation}`);
          } catch (error) {
            console.error(`❌ Error adding vocabulary "${vocab.word}":`, error.message);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error creating account ${account.email}:`, error.message);
      }
    }
    
    // Final summary
    console.log('\\n📊 FINAL DATABASE SUMMARY:');
    const finalUserCount = await prisma.user.count();
    const finalFolderCount = await prisma.folder.count();
    const finalVocabCount = await prisma.vocabulary.count();
    
    console.log(`👥 Total Users: ${finalUserCount}`);
    console.log(`📁 Total Folders: ${finalFolderCount}`);
    console.log(`📚 Total Vocabulary: ${finalVocabCount}`);
    
    console.log('\\n🎉 FRIENDLY TEST ACCOUNTS CREATED!');
    console.log('\\n🔐 LOGIN CREDENTIALS:');
    console.log('📧 admin@test.com / password: 123456');
    console.log('📧 user@test.com / password: 123456');
    console.log('📧 student@test.com / password: 123456');
    console.log('📧 dinhcongnhat.02@gmail.com / password: 123456 (original test user)');
    console.log('\\n📝 PLUS all migrated Firebase users with password: migrated123');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFriendlyTestAccounts();
