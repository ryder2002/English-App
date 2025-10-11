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

async function fetchAllFirestoreDocuments(collectionName: string) {
  try {
    console.log(`🔍 Fetching all documents from: ${collectionName}`);
    
    let allDocuments: any[] = [];
    let pageToken = '';
    
    do {
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`⚠️  Collection '${collectionName}' not accessible: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      const documents = data.documents || [];
      allDocuments = allDocuments.concat(documents);
      
      pageToken = data.nextPageToken || '';
      console.log(`📄 Fetched ${documents.length} documents, total: ${allDocuments.length}`);
      
    } while (pageToken);
    
    console.log(`✅ Completed fetching ${allDocuments.length} documents from '${collectionName}'`);
    return allDocuments;
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

async function extractAndCreateUsersFromVocabulary() {
  console.log('🔄 Extracting users from vocabulary data...');
  
  try {
    // Fetch all vocabulary
    const vocabDocs = await fetchAllFirestoreDocuments('vocabulary');
    
    if (!vocabDocs) {
      throw new Error('Cannot fetch vocabulary data');
    }
    
    // Extract unique user IDs
    const userIds = new Set<string>();
    const userFirstVocab = new Map<string, any>();
    
    vocabDocs.forEach(doc => {
      const parsed = parseFirestoreDocument(doc);
      if (parsed.userId) {
        userIds.add(parsed.userId);
        
        // Keep track of first vocabulary for each user (for user creation date)
        if (!userFirstVocab.has(parsed.userId)) {
          userFirstVocab.set(parsed.userId, parsed);
        }
      }
    });
    
    console.log(`👥 Found ${userIds.size} unique users to create`);
    
    let createdCount = 0;
    
    for (const firebaseUid of userIds) {
      const firstVocab = userFirstVocab.get(firebaseUid);
      
      // Create email based on Firebase UID
      const email = `user_${firebaseUid.slice(-8)}@firebase-migration.local`;
      const name = `User ${firebaseUid.slice(-8)}`;
      
      console.log(`\n🔍 Creating user: ${firebaseUid}`);
      console.log(`📧 Email: ${email}`);
      console.log(`👤 Name: ${name}`);
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email }
      });
      
      if (existingUser) {
        console.log(`⚠️ User already exists: ${email}`);
        continue;
      }
      
      // Create new user
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
      
      await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          name: name,
          firebaseUid: firebaseUid,
          createdAt: firstVocab?.createdAt || new Date(),
        }
      });
      
      console.log(`✅ Created user: ${email} (temp password: ${DEFAULT_PASSWORD})`);
      createdCount++;
    }
    
    console.log(`\n🎉 User creation complete! Created: ${createdCount} users`);
    return createdCount;
  } catch (error: any) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
}

async function migrateVocabularyFromFirebase() {
  console.log('\n🔄 Starting vocabulary migration from Firebase...');
  
  try {
    // Fetch all vocabulary
    const vocabDocs = await fetchAllFirestoreDocuments('vocabulary');
    
    if (!vocabDocs) {
      throw new Error('Cannot fetch vocabulary data');
    }
    
    console.log(`📊 Found ${vocabDocs.length} vocabulary items to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const doc of vocabDocs) {
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
          vietnameseTranslation: vocabItem.vietnameseTranslation || '',
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
      
      if (migratedCount % 10 === 0) {
        console.log(`📚 Migrated ${migratedCount + 1} vocabulary items...`);
      }
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
        user: {
          select: {
            email: true
          }
        }
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
        
        console.log(`📁 Created folder: ${vocab.folder} (${vocab.user.email})`);
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
  console.log('🚀 Starting Firebase to PostgreSQL migration (Full Migration)...');
  console.log(`🔐 Default password for migrated users: "${DEFAULT_PASSWORD}"`);
  console.log(`📊 Project ID: ${FIREBASE_PROJECT_ID}`);
  
  try {
    console.log('\n' + '='.repeat(60));
    
    // 1. Extract users from vocabulary and create them
    const userCount = await extractAndCreateUsersFromVocabulary();
    
    // 2. Migrate vocabulary
    let vocabCount = 0;
    if (userCount > 0) {
      vocabCount = await migrateVocabularyFromFirebase();
    }
    
    // 3. Create folders from vocabulary
    let folderCount = 0;
    if (vocabCount > 0) {
      folderCount = await createFoldersFromVocabulary();
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Final Summary:`);
    console.log(`   👥 Users created: ${userCount}`);
    console.log(`   📚 Vocabulary migrated: ${vocabCount}`);
    console.log(`   📁 Folders created: ${folderCount}`);
    
    if (userCount > 0) {
      console.log('\n🔑 Login Information:');
      console.log(`   📧 Email format: user_XXXXXXXX@firebase-migration.local`);
      console.log(`   🔒 Password: "${DEFAULT_PASSWORD}"`);
      console.log('\n📋 Next steps:');
      console.log(`   1. Check PostgreSQL database for migrated data`);
      console.log(`   2. Login with generated email and default password`);
      console.log(`   3. Change password and update email in Settings`);
      console.log(`   4. Verify your folders and vocabulary are accessible`);
      
      // Show sample login credentials
      console.log('\n📝 Sample login credentials:');
      const sampleUsers = await prisma.user.findMany({
        where: { firebaseUid: { not: null } },
        take: 3,
        select: { email: true, firebaseUid: true }
      });
      
      sampleUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email} | Password: ${DEFAULT_PASSWORD}`);
      });
    }
    
  } catch (error: any) {
    console.error('\n💥 Migration failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check Firebase config in .env.local');
    console.log('2. Verify Firebase project exists and has vocabulary data');
    console.log('3. Make sure your PostgreSQL database is running');
    console.log('4. Try running migration again if it was interrupted');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
