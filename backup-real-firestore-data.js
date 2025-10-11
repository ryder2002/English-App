// Backup script để lấy dữ liệu thực từ Firestore
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  "projectId": "studio-9320720500-9b879",
  "appId": "1:54917476718:web:397aaa5dd1ab5d0a81517f",
  "apiKey": "AIzaSyCb1Pte0GwL9zsQRoZaSfpbidMDqzS2ogU",
  "authDomain": "studio-9320720500-9b879.firebaseapp.com",
  "messagingSenderId": "54917476718"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const prisma = new PrismaClient();

async function backupAccessibleFirestoreData() {
  try {
    console.log('🔥 Starting backup of accessible Firestore data...');
    
    // Map để track users (từ folders và vocabulary)
    const userIds = new Set();
    const userMapping = new Map(); // Firebase UID -> PostgreSQL ID
    
    // 1. Đầu tiên lấy tất cả folders để có danh sách user IDs
    console.log('\n📁 Reading all folders from Firestore...');
    const foldersSnapshot = await getDocs(collection(db, 'folders'));
    const firestoreFolders = [];
    
    foldersSnapshot.forEach((doc) => {
      const data = doc.data();
      userIds.add(data.userId);
      firestoreFolders.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log(`✅ Found ${foldersSnapshot.size} folders from ${userIds.size} users`);
    
    // 2. Lấy tất cả vocabulary để có thêm user IDs
    console.log('\n📚 Reading all vocabulary from Firestore...');
    const vocabularySnapshot = await getDocs(collection(db, 'vocabulary'));
    const firestoreVocabulary = [];
    
    vocabularySnapshot.forEach((doc) => {
      const data = doc.data();
      userIds.add(data.userId);
      firestoreVocabulary.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log(`✅ Found ${vocabularySnapshot.size} vocabulary items from ${userIds.size} unique users`);
    
    // 3. Tạo users trong PostgreSQL cho tất cả user IDs tìm được
    console.log(`\\n👥 Creating ${userIds.size} users in PostgreSQL...`);
    
    for (const firebaseUserId of userIds) {
      try {
        const hashedPassword = await bcrypt.hash('migrated123', 10);
        
        // Tìm một vài thông tin từ folders/vocabulary để đoán email/name
        const userFolders = firestoreFolders.filter(f => f.userId === firebaseUserId);
        const userVocab = firestoreVocabulary.filter(v => v.userId === firebaseUserId);
        
        // Tạo email dựa trên Firebase UID
        const email = `user_${firebaseUserId}@migrated.com`;
        const name = `User ${firebaseUserId.substring(0, 8)}`;
        
        const postgresUser = await prisma.user.create({
          data: {
            email: email,
            name: name,
            password: hashedPassword,
          }
        });
        
        userMapping.set(firebaseUserId, postgresUser.id);
        console.log(`✅ Created user: ${email} (Firebase: ${firebaseUserId} -> Postgres: ${postgresUser.id})`);
        console.log(`   - Has ${userFolders.length} folders and ${userVocab.length} vocabulary items`);
        
      } catch (error) {
        if (error.code === 'P2002') {
          // User already exists, get existing user
          const email = `user_${firebaseUserId}@migrated.com`;
          const existingUser = await prisma.user.findUnique({
            where: { email: email }
          });
          if (existingUser) {
            userMapping.set(firebaseUserId, existingUser.id);
            console.log(`⚠️ User already exists: ${email}`);
          }
        } else {
          console.error(`❌ Error creating user for ${firebaseUserId}:`, error.message);
        }
      }
    }
    
    // 4. Migrate folders
    console.log(`\\n📁 Migrating ${firestoreFolders.length} folders...`);
    
    for (const folder of firestoreFolders) {
      const postgresUserId = userMapping.get(folder.userId);
      if (!postgresUserId) {
        console.log(`⚠️ Skipping folder ${folder.name} - user mapping not found`);
        continue;
      }
      
      try {
        const postgresFolder = await prisma.folder.create({
          data: {
            name: folder.name,
            userId: postgresUserId,
            createdAt: folder.createdAt ? new Date(folder.createdAt.seconds * 1000) : new Date(),
          }
        });
        
        console.log(`✅ Migrated folder: "${folder.name}" for user ${folder.userId}`);
        
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Folder "${folder.name}" already exists for user`);
        } else {
          console.error(`❌ Error migrating folder "${folder.name}":`, error.message);
        }
      }
    }
    
    // 5. Migrate vocabulary
    console.log(`\\n📚 Migrating ${firestoreVocabulary.length} vocabulary items...`);
    let vocabularySuccess = 0;
    let vocabularySkipped = 0;
    let vocabularyErrors = 0;
    
    for (const vocab of firestoreVocabulary) {
      const postgresUserId = userMapping.get(vocab.userId);
      if (!postgresUserId) {
        vocabularySkipped++;
        continue;
      }
      
      try {
        // Validate and convert language
        let language = 'english'; // default
        if (vocab.language) {
          const lang = vocab.language.toLowerCase();
          if (['english', 'chinese', 'vietnamese'].includes(lang)) {
            language = lang;
          }
        }
        
        const postgresVocab = await prisma.vocabulary.create({
          data: {
            word: vocab.word || '',
            language: language,
            vietnameseTranslation: vocab.vietnameseTranslation || '',
            folder: vocab.folder || 'Default',
            partOfSpeech: vocab.partOfSpeech || null,
            ipa: vocab.ipa || null,
            pinyin: vocab.pinyin || null,
            audioSrc: vocab.audioSrc || null,
            userId: postgresUserId,
            createdAt: vocab.createdAt ? new Date(vocab.createdAt.seconds * 1000) : new Date(),
            updatedAt: vocab.updatedAt ? new Date(vocab.updatedAt.seconds * 1000) : new Date(),
          }
        });
        
        vocabularySuccess++;
        if (vocabularySuccess % 100 === 0) {
          console.log(`✅ Migrated ${vocabularySuccess} vocabulary items...`);
        }
        
      } catch (error) {
        vocabularyErrors++;
        if (vocabularyErrors <= 5) { // Show first 5 errors
          console.error(`❌ Error migrating vocabulary "${vocab.word}":`, error.message);
        }
      }
    }
    
    console.log(`\\n📊 VOCABULARY MIGRATION SUMMARY:`);
    console.log(`✅ Successfully migrated: ${vocabularySuccess}`);
    console.log(`⚠️ Skipped (no user mapping): ${vocabularySkipped}`);
    console.log(`❌ Errors: ${vocabularyErrors}`);
    
    // 6. Final summary
    console.log('\\n📊 FINAL BACKUP SUMMARY:');
    const finalUserCount = await prisma.user.count();
    const finalFolderCount = await prisma.folder.count();
    const finalVocabCount = await prisma.vocabulary.count();
    
    console.log(`👥 Total Users in PostgreSQL: ${finalUserCount}`);
    console.log(`📁 Total Folders in PostgreSQL: ${finalFolderCount}`);
    console.log(`📚 Total Vocabulary in PostgreSQL: ${finalVocabCount}`);
    
    console.log('\\n🎉 BACKUP COMPLETED SUCCESSFULLY!');
    console.log('\\n📝 MIGRATION NOTES:');
    console.log('- All users have password: "migrated123"');
    console.log('- User emails follow pattern: user_[firebaseUID]@migrated.com');
    console.log('- Original Firebase timestamps preserved');
    console.log('- Language validation applied (english/chinese/vietnamese)');
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupAccessibleFirestoreData();
