import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Firebase config từ environment variables
let firebaseConfig: any;

// Kiểm tra nếu có FIREBASE_CONFIG (JSON string)
if (process.env.FIREBASE_CONFIG) {
  try {
    firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
    console.log('📦 Using FIREBASE_CONFIG from .env.local');
  } catch (error) {
    console.error('❌ Invalid FIREBASE_CONFIG JSON format');
    process.exit(1);
  }
} else {
  // Fallback to individual env vars
  firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };
  console.log('📦 Using individual Firebase env vars');
}

if (!firebaseConfig.projectId) {
  console.error('❌ Firebase config not found! Please check your .env.local file');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'temp123456';

async function checkFirebaseConnection() {
  try {
    console.log('🔍 Checking Firebase connection...');
    console.log(`📊 Project ID: ${firebaseConfig.projectId}`);
    
    // Try multiple collection names that might exist
    const possibleCollections = ['users', 'user', 'accounts', 'User'];
    let usersFound = 0;
    let workingCollection = null;
    
    for (const collectionName of possibleCollections) {
      try {
        console.log(`🔍 Checking collection: ${collectionName}`);
        const testCollection = collection(firestore, collectionName);
        const snapshot = await getDocs(testCollection);
        console.log(`📁 Collection '${collectionName}': ${snapshot.size} documents`);
        if (snapshot.size > 0) {
          usersFound = snapshot.size;
          workingCollection = collectionName;
          break;
        }
      } catch (error: any) {
        console.log(`⚠️  Collection '${collectionName}' not accessible: ${error.message}`);
      }
    }
    
    if (workingCollection) {
      console.log(`✅ Found users in collection '${workingCollection}': ${usersFound} users`);
      return workingCollection;
    } else {
      console.error('❌ No accessible user collections found');
      console.log('💡 Possible solutions:');
      console.log('   1. Check Firestore security rules');
      console.log('   2. Verify collection names in Firebase console');
      console.log('   3. Make sure you have read permissions');
      return false;
    }
  } catch (error: any) {
    console.error('❌ Failed to connect to Firebase:', error);
    console.log('💡 Common issues:');
    console.log('   - Invalid project ID or API key');
    console.log('   - Firestore not enabled for this project');
    console.log('   - Network connectivity issues');
    return false;
  }
}

async function migrateUsersFromFirebase(usersCollectionName: string = 'users') {
  console.log(`🔄 Starting user migration from Firebase collection: ${usersCollectionName}...`);
  
  try {
    const usersCollection = collection(firestore, usersCollectionName);
    const userSnapshot = await getDocs(usersCollection);
    
    if (userSnapshot.empty) {
      console.log('⚠️ No users found in Firebase');
      return 0;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const doc of userSnapshot.docs) {
      const userData = doc.data();
      const firebaseUid = doc.id;
      
      if (!userData.email) {
        console.log(`⚠️ Skipping user ${firebaseUid} - no email found`);
        skippedCount++;
        continue;
      }
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        // Update existing user with Firebase UID for mapping
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { firebaseUid: firebaseUid }
        });
        console.log(`🔗 Updated firebaseUid for existing user: ${userData.email} (password unchanged)`);
        migratedCount++;
      } else {
        // Create new user with default password
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
        
        await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name || userData.displayName || userData.email.split('@')[0],
            firebaseUid: firebaseUid,
            createdAt: userData.createdAt?.toDate() || new Date(),
          }
        });
        
        console.log(`✅ Created new user: ${userData.email} (temp password: ${DEFAULT_PASSWORD})`);
        migratedCount++;
      }
    }
    
    console.log(`🎉 User migration complete! Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
    return migratedCount;
  } catch (error) {
    console.error('❌ Error migrating users:', error);
    throw error;
  }
}

async function migrateVocabularyFromFirebase() {
  console.log('🔄 Starting vocabulary migration from Firebase...');
  
  try {
    const vocabularyCollection = collection(firestore, 'vocabulary');
    const vocabSnapshot = await getDocs(vocabularyCollection);
    
    if (vocabSnapshot.empty) {
      console.log('⚠️ No vocabulary found in Firebase');
      return 0;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const doc of vocabSnapshot.docs) {
      const vocabData = doc.data();
      
      if (!vocabData.userId) {
        console.log(`⚠️ Skipping vocabulary ${vocabData.word} - no userId found`);
        skippedCount++;
        continue;
      }
      
      // Find corresponding user in PostgreSQL
      const user = await prisma.user.findUnique({
        where: { firebaseUid: vocabData.userId }
      });
      
      if (!user) {
        console.log(`⚠️ User not found for vocabulary ${vocabData.word}, skipping...`);
        skippedCount++;
        continue;
      }
      
      // Create vocabulary item
      await prisma.vocabulary.create({
        data: {
          word: vocabData.word || '',
          language: vocabData.language || 'ENGLISH',
          vietnameseTranslation: vocabData.meaning || vocabData.vietnameseTranslation || '',
          folder: vocabData.folder || 'Default',
          partOfSpeech: vocabData.partOfSpeech,
          ipa: vocabData.ipa,
          pinyin: vocabData.pinyin,
          audioSrc: vocabData.audioSrc,
          userId: user.id,
          createdAt: vocabData.createdAt?.toDate() || new Date(),
        }
      });
      
      migratedCount++;
      console.log(`✅ Migrated vocabulary: ${vocabData.word} for ${user.email}`);
    }
    
    console.log(`🎉 Vocabulary migration complete! Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
    return migratedCount;
  } catch (error) {
    console.error('❌ Error migrating vocabulary:', error);
    throw error;
  }
}

async function migrateFoldersFromVocabulary() {
  console.log('🔄 Creating folders from vocabulary data...');
  
  try {
    // Get unique folder names per user
    const uniqueFolders = await prisma.vocabulary.findMany({
      select: { folder: true, userId: true },
      distinct: ['folder', 'userId'],
      where: {
        folder: { not: 'Default' }
      }
    });
    
    let createdCount = 0;
    
    for (const { folder, userId } of uniqueFolders) {
      if (!folder) continue;
      
      const existingFolder = await prisma.folder.findFirst({
        where: { 
          name: folder,
          userId: userId
        }
      });
      
      if (!existingFolder) {
        await prisma.folder.create({
          data: {
            name: folder,
            userId: userId,
            createdAt: new Date()
          }
        });
        
        createdCount++;
        console.log(`✅ Created folder: ${folder}`);
      }
    }
    
    console.log(`🎉 Folder creation complete! Created: ${createdCount} folders`);
    return createdCount;
  } catch (error) {
    console.error('❌ Error creating folders:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Firebase to PostgreSQL migration...');
  console.log(`🔐 Default password for migrated users: "${DEFAULT_PASSWORD}"`);
  
  try {
    // Check Firebase connection
    const usersCollectionName = await checkFirebaseConnection();
    if (!usersCollectionName) {
      throw new Error('Cannot connect to Firebase');
    }
    
    // 1. Migrate users
    const userCount = await migrateUsersFromFirebase(usersCollectionName as string);
    
    // 2. Migrate vocabulary (only if users were migrated)
    let vocabCount = 0;
    if (userCount > 0) {
      vocabCount = await migrateVocabularyFromFirebase();
    }
    
    // 3. Create folders (only if vocabulary was migrated)
    let folderCount = 0;
    if (vocabCount > 0) {
      folderCount = await migrateFoldersFromVocabulary();
    }
    
    console.log('\n🎊 Migration Summary:');
    console.log(`👥 Users migrated: ${userCount}`);
    console.log(`📚 Vocabulary items migrated: ${vocabCount}`);
    console.log(`� Folders created: ${folderCount}`);
    console.log(`\n📝 Important Notes:`);
    console.log(`🔐 All users have default password: "${DEFAULT_PASSWORD}"`);
    console.log(`� Users should change their passwords after first login`);
    console.log(`✨ Migration completed successfully!`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Firebase config in .env.local');
    console.log('2. Make sure you have the correct Firebase project permissions');
    console.log('3. Verify your PostgreSQL database is running');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { migrateUsersFromFirebase, migrateVocabularyFromFirebase, migrateFoldersFromVocabulary };
