const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Initialize Firebase Admin (you'll need to provide service account key)
const serviceAccount = {
  // Bạn cần thêm service account key ở đây
  // hoặc tải về từ Firebase Console > Project Settings > Service Accounts
};

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'studio-9320720500-9b879'
});

const firestore = admin.firestore();
const prisma = new PrismaClient();

async function backupFirestoreToPostgres() {
  try {
    console.log('🔥 Starting Firestore to PostgreSQL backup...');
    
    // 1. Backup Users
    console.log('\n👥 Backing up users...');
    const usersSnapshot = await firestore.collection('users').get();
    const userMapping = new Map(); // Firebase UID -> PostgreSQL ID
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const firebaseUid = userDoc.id;
      
      console.log(`Processing user: ${userData.email || 'No email'}`);
      
      try {
        // Create user in PostgreSQL
        const hashedPassword = userData.password 
          ? userData.password // If already hashed
          : await bcrypt.hash('defaultPassword123', 10); // Default password if none exists
        
        const postgresUser = await prisma.user.create({
          data: {
            email: userData.email || `user_${firebaseUid}@example.com`,
            name: userData.displayName || userData.name || 'Unknown User',
            password: hashedPassword,
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          }
        });
        
        userMapping.set(firebaseUid, postgresUser.id);
        console.log(`✅ User migrated: ${userData.email} (Firebase: ${firebaseUid} -> Postgres: ${postgresUser.id})`);
        
      } catch (error) {
        if (error.code === 'P2002') {
          // User already exists, get existing user
          const existingUser = await prisma.user.findUnique({
            where: { email: userData.email }
          });
          if (existingUser) {
            userMapping.set(firebaseUid, existingUser.id);
            console.log(`⚠️ User already exists: ${userData.email}`);
          }
        } else {
          console.error(`❌ Error migrating user ${userData.email}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Users backup completed. Migrated ${userMapping.size} users.`);
    
    // 2. Backup Folders
    console.log('\n📁 Backing up folders...');
    const foldersSnapshot = await firestore.collection('folders').get();
    const folderMapping = new Map(); // Firebase folder ID -> PostgreSQL ID
    
    for (const folderDoc of foldersSnapshot.docs) {
      const folderData = folderDoc.data();
      const firebaseFolderId = folderDoc.id;
      
      const postgresUserId = userMapping.get(folderData.userId);
      if (!postgresUserId) {
        console.log(`⚠️ Skipping folder ${folderData.name} - user not found`);
        continue;
      }
      
      try {
        const postgresFolder = await prisma.folder.create({
          data: {
            name: folderData.name,
            userId: postgresUserId,
            createdAt: folderData.createdAt?.toDate() || new Date(),
          }
        });
        
        folderMapping.set(firebaseFolderId, postgresFolder.id);
        console.log(`✅ Folder migrated: ${folderData.name} (Firebase: ${firebaseFolderId} -> Postgres: ${postgresFolder.id})`);
        
      } catch (error) {
        if (error.code === 'P2002') {
          // Folder already exists for this user
          const existingFolder = await prisma.folder.findFirst({
            where: { 
              name: folderData.name,
              userId: postgresUserId 
            }
          });
          if (existingFolder) {
            folderMapping.set(firebaseFolderId, existingFolder.id);
            console.log(`⚠️ Folder already exists: ${folderData.name}`);
          }
        } else {
          console.error(`❌ Error migrating folder ${folderData.name}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Folders backup completed. Migrated ${folderMapping.size} folders.`);
    
    // 3. Backup Vocabulary
    console.log('\n📚 Backing up vocabulary...');
    const vocabularySnapshot = await firestore.collection('vocabulary').get();
    let vocabularyCount = 0;
    
    for (const vocabDoc of vocabularySnapshot.docs) {
      const vocabData = vocabDoc.data();
      const firebaseVocabId = vocabDoc.id;
      
      const postgresUserId = userMapping.get(vocabData.userId);
      if (!postgresUserId) {
        console.log(`⚠️ Skipping vocabulary ${vocabData.word} - user not found`);
        continue;
      }
      
      try {
        // Determine language
        let language = 'english'; // default
        if (vocabData.language) {
          language = vocabData.language.toLowerCase();
        }
        
        // Map old field names to new schema
        const postgresVocab = await prisma.vocabulary.create({
          data: {
            word: vocabData.word,
            language: language,
            vietnameseTranslation: vocabData.meaning || vocabData.vietnameseTranslation || '',
            folder: vocabData.folder || 'Default',
            partOfSpeech: vocabData.partOfSpeech,
            ipa: vocabData.phonetic || vocabData.ipa,
            pinyin: vocabData.pinyin,
            audioSrc: vocabData.audioUrl || vocabData.audioSrc,
            userId: postgresUserId,
            createdAt: vocabData.createdAt?.toDate() || new Date(),
            updatedAt: vocabData.updatedAt?.toDate() || new Date(),
          }
        });
        
        vocabularyCount++;
        console.log(`✅ Vocabulary migrated: ${vocabData.word} (${language})`);
        
      } catch (error) {
        console.error(`❌ Error migrating vocabulary ${vocabData.word}:`, error.message);
      }
    }
    
    console.log(`✅ Vocabulary backup completed. Migrated ${vocabularyCount} words.`);
    
    // 4. Summary
    console.log('\n📊 BACKUP SUMMARY:');
    const finalUserCount = await prisma.user.count();
    const finalFolderCount = await prisma.folder.count();
    const finalVocabCount = await prisma.vocabulary.count();
    
    console.log(`👥 Total Users in PostgreSQL: ${finalUserCount}`);
    console.log(`📁 Total Folders in PostgreSQL: ${finalFolderCount}`);
    console.log(`📚 Total Vocabulary in PostgreSQL: ${finalVocabCount}`);
    
    console.log('\n🎉 BACKUP COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupFirestoreToPostgres();
