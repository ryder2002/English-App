import * as admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Firebase Admin SDK
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  // For admin SDK, we only need project ID for public databases
};

if (!firebaseConfig.projectId) {
  console.error('❌ FIREBASE_PROJECT_ID not found in .env.local');
  process.exit(1);
}

// Initialize admin app
const app = admin.initializeApp({
  projectId: firebaseConfig.projectId
});

const firestore = admin.firestore(app);
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'temp123456';

async function testFirestoreAccess() {
  try {
    console.log('🔍 Testing Firestore access with Admin SDK...');
    console.log(`📊 Project ID: ${firebaseConfig.projectId}`);
    
    // Try to list collections
    const collections = await firestore.listCollections();
    console.log(`📁 Found ${collections.length} collections:`);
    
    for (const collection of collections) {
      try {
        const snapshot = await collection.limit(1).get();
        console.log(`   - ${collection.id}: ${snapshot.size} documents (showing first)`);
      } catch (error: any) {
        console.log(`   - ${collection.id}: Error - ${error.message}`);
      }
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Firestore access failed:', error.message);
    return false;
  }
}

async function migrateUsersFromFirebase() {
  console.log('🔄 Starting user migration from Firebase...');
  
  try {
    // Try different collection names
    const possibleCollections = ['users', 'user', 'accounts', 'User'];
    let usersRef = null;
    let collectionName = '';
    
    for (const name of possibleCollections) {
      try {
        const ref = firestore.collection(name);
        const snapshot = await ref.limit(1).get();
        if (!snapshot.empty) {
          usersRef = ref;
          collectionName = name;
          console.log(`✅ Found users in collection: ${name}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️  Collection '${name}' not accessible`);
      }
    }
    
    if (!usersRef) {
      console.log('❌ No accessible user collections found');
      return 0;
    }
    
    const userSnapshot = await usersRef.get();
    
    if (userSnapshot.empty) {
      console.log('⚠️ No users found in Firebase');
      return 0;
    }
    
    console.log(`📊 Found ${userSnapshot.size} users to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const doc of userSnapshot.docs) {
      const userData = doc.data();
      const firebaseUid = doc.id;
      
      console.log(`\n🔍 Processing user: ${firebaseUid}`);
      console.log(`📧 Email: ${userData.email || 'N/A'}`);
      console.log(`👤 Name: ${userData.name || userData.displayName || 'N/A'}`);
      
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
    
    console.log(`\n🎉 User migration complete!`);
    console.log(`✅ Migrated: ${migratedCount}`);
    console.log(`⚠️  Skipped: ${skippedCount}`);
    return migratedCount;
  } catch (error: any) {
    console.error('❌ Error migrating users:', error);
    throw error;
  }
}

async function migrateVocabularyFromFirebase() {
  console.log('\n🔄 Starting vocabulary migration from Firebase...');
  
  try {
    // Try different collection names for vocabulary
    const possibleCollections = ['vocabulary', 'vocab', 'words', 'Vocabulary'];
    let vocabRef = null;
    let collectionName = '';
    
    for (const name of possibleCollections) {
      try {
        const ref = firestore.collection(name);
        const snapshot = await ref.limit(1).get();
        if (!snapshot.empty) {
          vocabRef = ref;
          collectionName = name;
          console.log(`✅ Found vocabulary in collection: ${name}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️  Collection '${name}' not accessible`);
      }
    }
    
    if (!vocabRef) {
      console.log('❌ No accessible vocabulary collections found');
      return 0;
    }
    
    const vocabSnapshot = await vocabRef.get();
    
    if (vocabSnapshot.empty) {
      console.log('⚠️ No vocabulary found in Firebase');
      return 0;
    }
    
    console.log(`📊 Found ${vocabSnapshot.size} vocabulary items to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const doc of vocabSnapshot.docs) {
      const vocabData = doc.data();
      
      if (!vocabData.userId) {
        console.log(`⚠️ Skipping vocabulary ${vocabData.word} - no userId found`);
        skippedCount++;
        continue;
      }
      
      // Find corresponding PostgreSQL user by firebaseUid
      const user = await prisma.user.findFirst({
        where: { firebaseUid: vocabData.userId }
      });
      
      if (!user) {
        console.log(`⚠️ Skipping vocabulary ${vocabData.word} - user not found for Firebase UID: ${vocabData.userId}`);
        skippedCount++;
        continue;
      }
      
      // Check if vocabulary already exists
      const existingVocab = await prisma.vocabulary.findFirst({
        where: {
          word: vocabData.word,
          userId: user.id
        }
      });
      
      if (existingVocab) {
        console.log(`⚠️ Vocabulary '${vocabData.word}' already exists for user ${user.email}`);
        skippedCount++;
        continue;
      }
      
      // Create vocabulary
      await prisma.vocabulary.create({
        data: {
          word: vocabData.word,
          vietnameseTranslation: vocabData.meaning || vocabData.vietnameseTranslation || '',
          folder: vocabData.folder || 'Default',
          userId: user.id,
          language: vocabData.language || 'english',
          partOfSpeech: vocabData.partOfSpeech || null,
          ipa: vocabData.ipa || null,
          pinyin: vocabData.pinyin || null,
          audioSrc: vocabData.audioSrc || null,
          createdAt: vocabData.createdAt?.toDate() || new Date(),
        }
      });
      
      console.log(`✅ Migrated vocabulary: ${vocabData.word} (${user.email})`);
      migratedCount++;
    }
    
    console.log(`\n🎉 Vocabulary migration complete!`);
    console.log(`✅ Migrated: ${migratedCount}`);
    console.log(`⚠️  Skipped: ${skippedCount}`);
    return migratedCount;
  } catch (error: any) {
    console.error('❌ Error migrating vocabulary:', error);
    throw error;
  }
}

async function createFoldersFromVocabulary() {
  console.log('\n🔄 Creating folders from vocabulary data...');
  
  try {
    // Get all unique folder names from vocabulary
    const vocabularies = await prisma.vocabulary.findMany({
      select: {
        folder: true,
        userId: true,
      },
      distinct: ['folder', 'userId'],
    });
    
    let createdCount = 0;
    
    for (const vocab of vocabularies) {
      if (!vocab.folder) continue;
      
      // Check if folder already exists
      const existingFolder = await prisma.folder.findFirst({
        where: {
          name: vocab.folder,
          userId: vocab.userId
        }
      });
      
      if (!existingFolder) {
        await prisma.folder.create({
          data: {
            name: vocab.folder,
            userId: vocab.userId,
            createdAt: new Date(),
          }
        });
        
        console.log(`📁 Created folder: ${vocab.folder}`);
        createdCount++;
      }
    }
    
    console.log(`\n🎉 Folder creation complete! Created: ${createdCount} folders`);
    return createdCount;
  } catch (error: any) {
    console.error('❌ Error creating folders:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Firebase to PostgreSQL migration with Admin SDK...');
  console.log(`🔐 Default password for migrated users: "${DEFAULT_PASSWORD}"`);
  
  try {
    // Test Firestore access
    const canAccess = await testFirestoreAccess();
    if (!canAccess) {
      throw new Error('Cannot access Firestore');
    }
    
    console.log('\n' + '='.repeat(50));
    
    // 1. Migrate users
    const userCount = await migrateUsersFromFirebase();
    
    // 2. Migrate vocabulary (only if users were migrated)
    let vocabCount = 0;
    if (userCount > 0) {
      vocabCount = await migrateVocabularyFromFirebase();
    }
    
    // 3. Create folders (only if vocabulary was migrated)
    let folderCount = 0;
    if (vocabCount > 0) {
      folderCount = await createFoldersFromVocabulary();
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   📚 Vocabulary: ${vocabCount}`);
    console.log(`   📁 Folders: ${folderCount}`);
    console.log('\n🔑 Next steps:');
    console.log(`   1. Login with your Firebase email and password: "${DEFAULT_PASSWORD}"`);
    console.log(`   2. Change your password in Settings`);
    console.log(`   3. Check your folders and vocabulary`);
    
  } catch (error: any) {
    console.error('\n💥 Migration failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure FIREBASE_PROJECT_ID is correct in .env.local');
    console.log('2. Check if Firestore database exists and has data');
    console.log('3. Verify your PostgreSQL database is running');
  } finally {
    await prisma.$disconnect();
    // Note: Firebase Admin app doesn't need explicit disconnect
  }
}

if (require.main === module) {
  main();
}
