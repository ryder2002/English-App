// Backup script using Firebase Client SDK (không cần service account key)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Firebase client config
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

const firebaseConfig = {
  "projectId": "studio-9320720500-9b879",
  "appId": "1:54917476718:web:397aaa5dd1ab5d0a81517f",
  "apiKey": "AIzaSyCb1Pte0GwL9zsQRoZaSfpbidMDqzS2ogU",
  "authDomain": "studio-9320720500-9b879.firebaseapp.com",
  "messagingSenderId": "54917476718"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const prisma = new PrismaClient();

async function backupFirestoreToPostgres() {
  try {
    console.log('🔥 Starting Firestore to PostgreSQL backup...');
    
    // Sign in anonymously to access Firestore
    await signInAnonymously(auth);
    console.log('✅ Authenticated with Firebase');
    
    const userMapping = new Map(); // Firebase UID -> PostgreSQL ID
    
    // 1. Backup Users
    console.log('\n👥 Backing up users...');
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const firebaseUid = userDoc.id;
        
        console.log(`Processing user: ${userData.email || 'No email'} (ID: ${firebaseUid})`);
        
        try {
          // Create user in PostgreSQL
          const hashedPassword = await bcrypt.hash('migrated123', 10); // Default password for migrated users
          
          const postgresUser = await prisma.user.create({
            data: {
              email: userData.email || `user_${firebaseUid}@migrated.com`,
              name: userData.displayName || userData.name || 'Migrated User',
              password: hashedPassword,
              createdAt: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : new Date(),
              updatedAt: userData.updatedAt ? new Date(userData.updatedAt.seconds * 1000) : new Date(),
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
    } catch (error) {
      console.error('❌ Error accessing users collection:', error.message);
    }
    
    // 2. Backup Folders
    console.log('\n📁 Backing up folders...');
    const folderMapping = new Map(); // Firebase folder name -> PostgreSQL ID
    
    try {
      const foldersSnapshot = await getDocs(collection(db, 'folders'));
      
      for (const folderDoc of foldersSnapshot.docs) {
        const folderData = folderDoc.data();
        const firebaseFolderId = folderDoc.id;
        
        console.log(`Processing folder: ${folderData.name} (User: ${folderData.userId})`);
        
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
              createdAt: folderData.createdAt ? new Date(folderData.createdAt.seconds * 1000) : new Date(),
            }
          });
          
          folderMapping.set(`${folderData.name}_${postgresUserId}`, postgresFolder.id);
          console.log(`✅ Folder migrated: ${folderData.name}`);
          
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
              folderMapping.set(`${folderData.name}_${postgresUserId}`, existingFolder.id);
              console.log(`⚠️ Folder already exists: ${folderData.name}`);
            }
          } else {
            console.error(`❌ Error migrating folder ${folderData.name}:`, error.message);
          }
        }
      }
      
      console.log(`✅ Folders backup completed. Processed ${folderMapping.size} folders.`);
    } catch (error) {
      console.error('❌ Error accessing folders collection:', error.message);
    }
    
    // 3. Backup Vocabulary
    console.log('\n📚 Backing up vocabulary...');
    let vocabularyCount = 0;
    
    try {
      const vocabularySnapshot = await getDocs(collection(db, 'vocabulary'));
      
      for (const vocabDoc of vocabularySnapshot.docs) {
        const vocabData = vocabDoc.data();
        const firebaseVocabId = vocabDoc.id;
        
        console.log(`Processing vocabulary: ${vocabData.word} (User: ${vocabData.userId})`);
        
        const postgresUserId = userMapping.get(vocabData.userId);
        if (!postgresUserId) {
          console.log(`⚠️ Skipping vocabulary ${vocabData.word} - user not found`);
          continue;
        }
        
        try {
          // Determine language
          let language = 'english'; // default
          if (vocabData.language) {
            const lang = vocabData.language.toLowerCase();
            if (['english', 'chinese', 'vietnamese'].includes(lang)) {
              language = lang;
            }
          }
          
          // Map old field names to new schema
          const postgresVocab = await prisma.vocabulary.create({
            data: {
              word: vocabData.word || '',
              language: language,
              vietnameseTranslation: vocabData.meaning || vocabData.vietnameseTranslation || '',
              folder: vocabData.folder || 'Default',
              partOfSpeech: vocabData.partOfSpeech || null,
              ipa: vocabData.phonetic || vocabData.ipa || null,
              pinyin: vocabData.pinyin || null,
              audioSrc: vocabData.audioUrl || vocabData.audioSrc || null,
              userId: postgresUserId,
              createdAt: vocabData.createdAt ? new Date(vocabData.createdAt.seconds * 1000) : new Date(),
              updatedAt: vocabData.updatedAt ? new Date(vocabData.updatedAt.seconds * 1000) : new Date(),
            }
          });
          
          vocabularyCount++;
          console.log(`✅ Vocabulary migrated: ${vocabData.word} (${language})`);
          
        } catch (error) {
          console.error(`❌ Error migrating vocabulary ${vocabData.word}:`, error.message);
          console.error('Vocab data:', JSON.stringify(vocabData, null, 2));
        }
      }
      
      console.log(`✅ Vocabulary backup completed. Migrated ${vocabularyCount} words.`);
    } catch (error) {
      console.error('❌ Error accessing vocabulary collection:', error.message);
    }
    
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
