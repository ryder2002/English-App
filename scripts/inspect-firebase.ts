const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

async function fetchFirestoreCollection(collectionName: string, limit: number = 5) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionName}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`⚠️  Collection '${collectionName}' not accessible: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    const documents = data.documents || [];
    
    return documents.slice(0, limit);
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
    }
  }
  
  return { id: documentId, ...parsed };
}

async function inspectVocabularyData() {
  console.log('🔍 Inspecting vocabulary data structure...');
  
  const vocabDocs = await fetchFirestoreCollection('vocabulary', 3);
  
  if (!vocabDocs) {
    console.log('❌ Cannot fetch vocabulary data');
    return;
  }
  
  console.log(`📊 Found ${vocabDocs.length} sample documents:`);
  
  vocabDocs.forEach((doc, index) => {
    const parsed = parseFirestoreDocument(doc);
    console.log(`\n📄 Document ${index + 1}:`);
    console.log(`   ID: ${parsed.id}`);
    console.log(`   Fields:`, JSON.stringify(parsed, null, 4));
  });
  
  // Extract unique userIds
  const userIds = new Set();
  vocabDocs.forEach(doc => {
    const parsed = parseFirestoreDocument(doc);
    if (parsed.userId) {
      userIds.add(parsed.userId);
    }
  });
  
  console.log(`\n👥 Found ${userIds.size} unique user IDs:`);
  userIds.forEach(id => console.log(`   - ${id}`));
}

async function main() {
  console.log('🚀 Firebase Data Inspector');
  console.log(`📊 Project ID: ${FIREBASE_PROJECT_ID}`);
  
  await inspectVocabularyData();
}

if (require.main === module) {
  main();
}
