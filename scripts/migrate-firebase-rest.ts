import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'temp123456';

if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) {
  console.error('❌ Missing Firebase config in .env.local');
  console.log('Required: FIREBASE_PROJECT_ID, FIREBASE_API_KEY');
  process.exit(1);
}

async function fetchFirestoreCollection(collectionName: string) {
  try {
    console.log(`🔍 Fetching collection: ${collectionName}`);
    
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionName}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`⚠️  Collection '${collectionName}' not accessible: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Found ${data.documents?.length || 0} documents in '${collectionName}'`);
    
    return data.documents || [];
  } catch (error: any) {
    console.log(`⚠️  Error fetching '${collectionName}': ${error.message}`);
    return null;
  }
}

function parseFirestoreDocument(doc: any) {
  const parsed: any = {};
  const documentId = doc.name.split('/').pop();
  
  for (const [key, value] of Object.entries(doc.fields || {})) {
    const fieldValue = value as any;
    
    if (fieldValue.stringValue !== undefined) {
      parsed[key] = fieldValue.stringValue;
    } else if (fieldValue.integerValue !== undefined) {
      parsed[key] = parseInt(fieldValue.integerValue);
    } else if (fieldValue.doubleValue !== undefined) {
      parsed[key] = parseFloat(fieldValue.doubleValue);
    } else if (fieldValue.booleanValue !== undefined) {
      parsed[key] = fieldValue.booleanValue;
    } else if (fieldValue.timestampValue !== undefined) {
      parsed[key] = new Date(fieldValue.timestampValue);
    } else if (fieldValue.nullValue !== undefined) {
      parsed[key] = null;
    }
  }
  
  return { id: documentId, ...parsed };
}

async function testFirestoreAccess() {
  console.log('🔍 Testing Firestore REST API access...');
  console.log(`📊 Project ID: ${FIREBASE_PROJECT_ID}`);
  
  // Test access to common collections
  const collections = ['users', 'user', 'vocabulary', 'vocab'];
  const accessible = [];
  
  for (const collection of collections) {
    const docs = await fetchFirestoreCollection(collection);
    if (docs && docs.length > 0) {
      accessible.push({ name: collection, count: docs.length });
    }
  }
  
  if (accessible.length > 0) {
    console.log('✅ Accessible collections:');
    accessible.forEach(col => {
      console.log(`   - ${col.name}: ${col.count} documents`);
    });
    return accessible;
  } else {
    console.log('❌ No accessible collections found');
    return [];
  }
}

async function migrateUsersFromFirebase() {
  console.log('\n🔄 Starting user migration from Firebase...');
  
  try {
    // Try different collection names
    const possibleCollections = ['users', 'user', 'accounts', 'User'];
    let usersData = null;
    let collectionName = '';
    
    for (const name of possibleCollections) {
      const docs = await fetchFirestoreCollection(name);
      if (docs && docs.length > 0) {
        usersData = docs;
        collectionName = name;
        break;
      }
    }
    
    if (!usersData) {
      console.log('❌ No user collections found');
      return 0;
    }
    
    console.log(`📊 Found ${usersData.length} users in '${collectionName}' to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const doc of usersData) {
      const userData = parseFirestoreDocument(doc);
      const firebaseUid = userData.id;
      
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
            createdAt: userData.createdAt || new Date(),
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
    let vocabData = null;
    let collectionName = '';
    
    for (const name of possibleCollections) {
      const docs = await fetchFirestoreCollection(name);
      if (docs && docs.length > 0) {
        vocabData = docs;
        collectionName = name;
        break;
      }
    }
    
    if (!vocabData) {
      console.log('❌ No vocabulary collections found');
      return 0;
    }
    
    console.log(`📊 Found ${vocabData.length} vocabulary items in '${collectionName}' to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const doc of vocabData) {
      const vocabItem = parseFirestoreDocument(doc);
      
      if (!vocabItem.userId) {
        console.log(`⚠️ Skipping vocabulary ${vocabItem.word} - no userId found`);
        skippedCount++;
        continue;
      }
      
      // Find corresponding PostgreSQL user by firebaseUid
      const user = await prisma.user.findFirst({
        where: { firebaseUid: vocabItem.userId }
      });
      
      if (!user) {
        console.log(`⚠️ Skipping vocabulary ${vocabItem.word} - user not found for Firebase UID: ${vocabItem.userId}`);
        skippedCount++;
        continue;
      }
      
      // Check if vocabulary already exists
      const existingVocab = await prisma.vocabulary.findFirst({
        where: {
          word: vocabItem.word,
          userId: user.id
        }
      });
      
      if (existingVocab) {
        console.log(`⚠️ Vocabulary '${vocabItem.word}' already exists for user ${user.email}`);
        skippedCount++;
        continue;
      }
      
      // Create vocabulary
      await prisma.vocabulary.create({
        data: {
          word: vocabItem.word || '',
          vietnameseTranslation: vocabItem.meaning || vocabItem.vietnameseTranslation || '',
          folder: vocabItem.folder || 'Default',
          userId: user.id,
          language: vocabItem.language || 'english',
          partOfSpeech: vocabItem.partOfSpeech || null,
          ipa: vocabItem.ipa || null,
          pinyin: vocabItem.pinyin || null,
          audioSrc: vocabItem.audioSrc || null,
          createdAt: vocabItem.createdAt || new Date(),
        }
      });
      
      console.log(`✅ Migrated vocabulary: ${vocabItem.word} (${user.email})`);
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
  console.log('🚀 Starting Firebase to PostgreSQL migration with REST API...');
  console.log(`🔐 Default password for migrated users: "${DEFAULT_PASSWORD}"`);
  
  try {
    // Test Firestore access
    const accessibleCollections = await testFirestoreAccess();
    if (accessibleCollections.length === 0) {
      throw new Error('Cannot access any Firestore collections');
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
    console.log('1. Check Firebase config in .env.local');
    console.log('2. Verify Firebase project exists and has data');
    console.log('3. Make sure your PostgreSQL database is running');
    console.log('4. Check if Firestore has public read access or proper security rules');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
