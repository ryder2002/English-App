// Simple backup script - chỉ đọc dữ liệu Firestore nếu có thể
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Firebase client config
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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
const prisma = new PrismaClient();

async function testFirestoreAccess() {
  try {
    console.log('🔥 Testing Firestore access...');
    
    // Test reading collections without authentication
    console.log('\n👥 Testing users collection...');
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      console.log(`✅ Found ${usersSnapshot.size} users in Firestore`);
      
      // Show sample data
      if (usersSnapshot.size > 0) {
        const firstUser = usersSnapshot.docs[0];
        console.log('Sample user data:', {
          id: firstUser.id,
          data: firstUser.data()
        });
      }
    } catch (error) {
      console.log('❌ Cannot access users collection:', error.message);
    }
    
    console.log('\n📁 Testing folders collection...');
    try {
      const foldersSnapshot = await getDocs(collection(db, 'folders'));
      console.log(`✅ Found ${foldersSnapshot.size} folders in Firestore`);
      
      if (foldersSnapshot.size > 0) {
        const firstFolder = foldersSnapshot.docs[0];
        console.log('Sample folder data:', {
          id: firstFolder.id,
          data: firstFolder.data()
        });
      }
    } catch (error) {
      console.log('❌ Cannot access folders collection:', error.message);
    }
    
    console.log('\n📚 Testing vocabulary collection...');
    try {
      const vocabularySnapshot = await getDocs(collection(db, 'vocabulary'));
      console.log(`✅ Found ${vocabularySnapshot.size} vocabulary items in Firestore`);
      
      if (vocabularySnapshot.size > 0) {
        const firstVocab = vocabularySnapshot.docs[0];
        console.log('Sample vocabulary data:', {
          id: firstVocab.id,
          data: firstVocab.data()
        });
      }
    } catch (error) {
      console.log('❌ Cannot access vocabulary collection:', error.message);
    }
    
    // Check current PostgreSQL data
    console.log('\n📊 Current PostgreSQL data:');
    const userCount = await prisma.user.count();
    const folderCount = await prisma.folder.count();
    const vocabCount = await prisma.vocabulary.count();
    
    console.log(`👥 Users in PostgreSQL: ${userCount}`);
    console.log(`📁 Folders in PostgreSQL: ${folderCount}`);
    console.log(`📚 Vocabulary in PostgreSQL: ${vocabCount}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSampleDataFromFirebaseStructure() {
  try {
    console.log('\n🔧 Creating sample data based on typical Firebase structure...');
    
    // Create sample users
    const users = [
      { email: 'user1@example.com', name: 'User 1' },
      { email: 'user2@example.com', name: 'User 2' },
      { email: 'admin@example.com', name: 'Admin User' }
    ];
    
    for (const userData of users) {
      try {
        const hashedPassword = await bcrypt.hash('migrated123', 10);
        
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            password: hashedPassword,
          }
        });
        
        console.log(`✅ Created user: ${userData.email} (ID: ${user.id})`);
        
        // Create folders for each user
        const folderNames = ['General', 'Business', 'Travel', 'Study'];
        for (const folderName of folderNames) {
          try {
            const folder = await prisma.folder.create({
              data: {
                name: folderName,
                userId: user.id,
              }
            });
            
            console.log(`✅ Created folder: ${folderName} for ${userData.email}`);
            
            // Create some vocabulary for each folder
            const vocabularyItems = [
              { word: 'hello', translation: 'xin chào', language: 'english' },
              { word: 'goodbye', translation: 'tạm biệt', language: 'english' },
              { word: 'thank you', translation: 'cảm ơn', language: 'english' },
            ];
            
            for (const vocabData of vocabularyItems) {
              try {
                await prisma.vocabulary.create({
                  data: {
                    word: vocabData.word,
                    language: vocabData.language,
                    vietnameseTranslation: vocabData.translation,
                    folder: folder.name,
                    userId: user.id,
                  }
                });
                
                console.log(`✅ Created vocabulary: ${vocabData.word} in ${folderName}`);
              } catch (error) {
                if (error.code !== 'P2002') { // Skip duplicate errors
                  console.log(`⚠️ Vocabulary ${vocabData.word} might already exist`);
                }
              }
            }
          } catch (error) {
            if (error.code !== 'P2002') {
              console.log(`⚠️ Folder ${folderName} might already exist for ${userData.email}`);
            }
          }
        }
        
      } catch (error) {
        if (error.code !== 'P2002') {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
        } else {
          console.log(`⚠️ User ${userData.email} already exists`);
        }
      }
    }
    
    console.log('\n✅ Sample data creation completed!');
    
  } catch (error) {
    console.error('❌ Sample data creation failed:', error);
  }
}

// Run both tests
testFirestoreAccess().then(() => {
  return createSampleDataFromFirebaseStructure();
});
