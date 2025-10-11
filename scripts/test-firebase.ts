import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase config từ environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

console.log('🔍 Firebase Config Test:');
console.log('API Key:', process.env.FIREBASE_API_KEY ? 'Found' : 'Missing');
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID || 'Missing');
console.log('Auth Domain:', process.env.FIREBASE_AUTH_DOMAIN || 'Missing');

async function testConnection() {
  try {
    console.log('\n📡 Testing Firebase connection...');
    
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    
    // Test collection access
    const testCollection = collection(firestore, 'users');
    const snapshot = await getDocs(testCollection);
    
    console.log(`✅ Connected! Found ${snapshot.size} documents in 'users' collection`);
    
    // List first few documents
    if (snapshot.size > 0) {
      console.log('\n📄 Sample documents:');
      snapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ID: ${doc.id}, Email: ${data.email || 'No email'}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Firebase connection failed:', error.message);
    console.log('\n💡 Possible solutions:');
    console.log('   - Check Firestore security rules');
    console.log('   - Verify project ID and API key');
    console.log('   - Make sure Firestore is enabled');
  }
}

testConnection();
