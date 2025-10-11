import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';

// Firebase configuration (existing)
const firebaseConfig = {
  "projectId": "studio-9320720500-9b879",
  "appId": "1:54917476718:web:397aaa5dd1ab5d0a81517f",
  "apiKey": "AIzaSyCb1Pte0GwL9zsQRoZaSfpbidMDqzS2ogU",
  "authDomain": "studio-9320720500-9b879.firebaseapp.com",
  "messagingSenderId": "54917476718"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
}

interface FirebaseVocabulary {
  id: string;
  word: string;
  language: string;
  vietnameseTranslation: string;
  folder: string;
  partOfSpeech?: string;
  ipa?: string;
  pinyin?: string;
  audioSrc?: string;
  userId: string;
  createdAt: any;
}

interface FirebaseFolder {
  id: string;
  name: string;
  userId: string;
  createdAt: any;
}

export class FirebaseToPostgreSQLMigration {
  
  // Step 1: Export all users from Firebase Auth
  static async exportFirebaseUsers(): Promise<FirebaseUser[]> {
    console.log("⚠️  Manual step required:");
    console.log("1. Go to Firebase Console > Authentication > Users");
    console.log("2. Export user data or manually create users in PostgreSQL");
    console.log("3. For this demo, we'll create a sample user");
    
    // Return sample users - in real scenario, you'd export from Firebase Console
    return [
      {
        uid: "sample-user-id",
        email: "user@example.com", 
        displayName: "Sample User"
      }
    ];
  }

  // Step 2: Export vocabulary data from Firestore
  static async exportVocabularyData(): Promise<FirebaseVocabulary[]> {
    console.log("📤 Exporting vocabulary data from Firestore...");
    
    const vocabularyRef = collection(db, "vocabulary");
    const snapshot = await getDocs(vocabularyRef);
    
    const vocabularyData: FirebaseVocabulary[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      vocabularyData.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as FirebaseVocabulary);
    });

    console.log(`✅ Exported ${vocabularyData.length} vocabulary items`);
    return vocabularyData;
  }

  // Step 3: Export folder data from Firestore
  static async exportFolderData(): Promise<FirebaseFolder[]> {
    console.log("📤 Exporting folder data from Firestore...");
    
    const foldersRef = collection(db, "folders");
    const snapshot = await getDocs(foldersRef);
    
    const folderData: FirebaseFolder[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      folderData.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as FirebaseFolder);
    });

    console.log(`✅ Exported ${folderData.length} folders`);
    return folderData;
  }

  // Step 4: Import users to PostgreSQL
  static async importUsers(firebaseUsers: FirebaseUser[]): Promise<Map<string, number>> {
    console.log("📥 Importing users to PostgreSQL...");
    
    const userIdMapping = new Map<string, number>();
    
    for (const fbUser of firebaseUsers) {
      try {
        // Create user with default password (user should reset it)
        const defaultPassword = await bcrypt.hash('TempPassword123!', 12);
        
        const user = await prisma.user.create({
          data: {
            email: fbUser.email,
            password: defaultPassword,
            name: fbUser.displayName || fbUser.email.split('@')[0]
          }
        });

        userIdMapping.set(fbUser.uid, user.id);
        console.log(`✅ Created user: ${fbUser.email} (ID: ${user.id})`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          // User already exists, get their ID
          const existingUser = await prisma.user.findUnique({
            where: { email: fbUser.email }
          });
          if (existingUser) {
            userIdMapping.set(fbUser.uid, existingUser.id);
            console.log(`ℹ️  User already exists: ${fbUser.email}`);
          }
        } else {
          console.error(`❌ Error creating user ${fbUser.email}:`, error.message);
        }
      }
    }

    return userIdMapping;
  }

  // Step 5: Import folders to PostgreSQL
  static async importFolders(folderData: FirebaseFolder[], userIdMapping: Map<string, number>): Promise<void> {
    console.log("📥 Importing folders to PostgreSQL...");

    for (const folder of folderData) {
      try {
        const userId = userIdMapping.get(folder.userId);
        if (!userId) {
          console.log(`⚠️  Skipping folder "${folder.name}" - user not found`);
          continue;
        }

        await prisma.folder.create({
          data: {
            name: folder.name,
            userId: userId,
            createdAt: folder.createdAt
          }
        });

        console.log(`✅ Created folder: ${folder.name}`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`ℹ️  Folder already exists: ${folder.name}`);
        } else {
          console.error(`❌ Error creating folder ${folder.name}:`, error.message);
        }
      }
    }
  }

  // Step 6: Import vocabulary to PostgreSQL
  static async importVocabulary(vocabularyData: FirebaseVocabulary[], userIdMapping: Map<string, number>): Promise<void> {
    console.log("📥 Importing vocabulary to PostgreSQL...");

    for (const vocab of vocabularyData) {
      try {
        const userId = userIdMapping.get(vocab.userId);
        if (!userId) {
          console.log(`⚠️  Skipping vocabulary "${vocab.word}" - user not found`);
          continue;
        }

        await prisma.vocabulary.create({
          data: {
            word: vocab.word,
            language: vocab.language as any,
            vietnameseTranslation: vocab.vietnameseTranslation,
            folder: vocab.folder,
            partOfSpeech: vocab.partOfSpeech || null,
            ipa: vocab.ipa || null,
            pinyin: vocab.pinyin || null,
            audioSrc: vocab.audioSrc || null,
            userId: userId,
            createdAt: vocab.createdAt
          }
        });

        console.log(`✅ Created vocabulary: ${vocab.word}`);
      } catch (error: any) {
        console.error(`❌ Error creating vocabulary ${vocab.word}:`, error.message);
      }
    }
  }

  // Main migration function
  static async runMigration(): Promise<void> {
    try {
      console.log("🚀 Starting Firebase to PostgreSQL migration...");

      // Step 1: Export users (manual step)
      const firebaseUsers = await this.exportFirebaseUsers();

      // Step 2: Export data from Firebase
      const [vocabularyData, folderData] = await Promise.all([
        this.exportVocabularyData(),
        this.exportFolderData()
      ]);

      // Step 3: Import to PostgreSQL
      const userIdMapping = await this.importUsers(firebaseUsers);
      await this.importFolders(folderData, userIdMapping);
      await this.importVocabulary(vocabularyData, userIdMapping);

      console.log("🎉 Migration completed successfully!");
      
      // Generate summary
      const userCount = await prisma.user.count();
      const folderCount = await prisma.folder.count();
      const vocabularyCount = await prisma.vocabulary.count();
      
      console.log("\n📊 Migration Summary:");
      console.log(`👥 Users: ${userCount}`);
      console.log(`📁 Folders: ${folderCount}`);
      console.log(`📝 Vocabulary items: ${vocabularyCount}`);

    } catch (error) {
      console.error("❌ Migration failed:", error);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  FirebaseToPostgreSQLMigration.runMigration()
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
