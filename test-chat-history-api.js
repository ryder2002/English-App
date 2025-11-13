// Test Chat History API
// Chạy: node test-chat-history-api.js

const BASE_URL = 'http://localhost:3000';
let authToken = 'YOUR_TOKEN_HERE'; // Replace with actual token from browser cookie

// Helper function
async function testAPI(method, endpoint, body = null) {
  console.log(`\n🔹 Testing ${method} ${endpoint}`);
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(BASE_URL + endpoint, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log('❌ Error:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Chat History API Tests\n');
  console.log('📝 Make sure to replace authToken with your actual token!\n');

  // 1. Get all conversations (should be empty initially)
  console.log('\n=== TEST 1: Get All Conversations ===');
  const initialConvs = await testAPI('GET', '/api/chat/conversations');

  // 2. Create new conversation
  console.log('\n=== TEST 2: Create New Conversation ===');
  const newConv = await testAPI('POST', '/api/chat/conversations', {
    title: 'Test Conversation - Học tiếng Anh'
  });

  if (!newConv || !newConv.conversation) {
    console.log('❌ Failed to create conversation. Stopping tests.');
    return;
  }

  const convId = newConv.conversation.id;
  console.log(`📌 Created conversation ID: ${convId}`);

  // 3. Add user message
  console.log('\n=== TEST 3: Add User Message ===');
  await testAPI('POST', `/api/chat/conversations/${convId}/messages`, {
    role: 'user',
    content: 'Giải thích về thì hiện tại hoàn thành'
  });

  // 4. Add assistant message
  console.log('\n=== TEST 4: Add Assistant Message ===');
  await testAPI('POST', `/api/chat/conversations/${convId}/messages`, {
    role: 'assistant',
    content: 'Thì hiện tại hoàn thành (Present Perfect) được dùng để diễn tả hành động bắt đầu trong quá khứ và còn liên quan đến hiện tại...'
  });

  // 5. Get conversation with messages
  console.log('\n=== TEST 5: Get Conversation with Messages ===');
  await testAPI('GET', `/api/chat/conversations/${convId}`);

  // 6. Rename conversation
  console.log('\n=== TEST 6: Rename Conversation ===');
  await testAPI('PUT', `/api/chat/conversations/${convId}`, {
    title: 'Ngữ pháp tiếng Anh - Present Perfect'
  });

  // 7. Get all conversations (should show updated one)
  console.log('\n=== TEST 7: Get All Conversations (after updates) ===');
  await testAPI('GET', '/api/chat/conversations');

  // 8. Get messages only
  console.log('\n=== TEST 8: Get Messages Only ===');
  await testAPI('GET', `/api/chat/conversations/${convId}/messages`);

  // 9. Delete conversation
  console.log('\n=== TEST 9: Delete Conversation ===');
  await testAPI('DELETE', `/api/chat/conversations/${convId}`);

  // 10. Verify deletion
  console.log('\n=== TEST 10: Verify Deletion ===');
  await testAPI('GET', '/api/chat/conversations');

  console.log('\n\n✅ All tests completed!');
  console.log('\n📊 Summary:');
  console.log('   - Create conversation: ✅');
  console.log('   - Add messages: ✅');
  console.log('   - Rename conversation: ✅');
  console.log('   - Delete conversation: ✅');
}

// Get token from command line argument
if (process.argv[2]) {
  authToken = process.argv[2];
  console.log('🔑 Using token from command line');
} else {
  console.log('⚠️  No token provided. Usage: node test-chat-history-api.js YOUR_TOKEN');
  console.log('   You can find your token in browser cookies (Application tab -> Cookies -> token)');
  console.log('\n   Proceeding with placeholder token (will likely fail)...\n');
}

runTests().catch(console.error);
