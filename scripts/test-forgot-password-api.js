/**
 * Script để test API forgot password endpoint
 * Chạy: node scripts/test-forgot-password-api.js [email] [url]
 */

require('dotenv').config({ path: '.env.local' });

async function testForgotPasswordAPI() {
  const testEmail = process.argv[2] || 'dinhcongnhat.02@gmail.com';
  const apiUrl = process.argv[3] || 'https://congnhat.online';
  const endpoint = `${apiUrl}/api/auth/forgot-password`;

  console.log('🧪 Test API Forgot Password...\n');
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔗 API Endpoint: ${endpoint}\n`);

  try {
    console.log('⏳ Đang gửi request...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });

    const data = await response.json();

    console.log(`\n📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📦 Response:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ API đã xử lý thành công!');
      console.log('\n📋 Tiếp theo:');
      console.log(`   1. Kiểm tra server logs để xem email có được gửi không`);
      console.log(`   2. Kiểm tra inbox: ${testEmail}`);
      console.log('   3. Kiểm tra spam folder');
      console.log('   4. Xem Resend dashboard: https://resend.com/emails');
    } else {
      console.log('\n❌ API trả về lỗi');
      if (data.error) {
        console.log(`   Lỗi: ${data.error}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Lỗi khi gọi API:', error.message);
    
    if (error.message.includes('fetch') || error.code === 'ECONNREFUSED') {
      if (apiUrl.includes('localhost')) {
        console.log('\n💡 Server localhost chưa chạy');
        console.log('   → Chạy: npm run dev');
        console.log('   → Sau đó chạy lại script này');
      } else {
        console.log('\n💡 Không thể kết nối đến server');
        console.log(`   → Kiểm tra URL: ${apiUrl}`);
        console.log('   → Đảm bảo server đang chạy và accessible');
      }
    }
    
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ Node.js version không hỗ trợ fetch');
  console.log('   → Cần Node.js 18+ hoặc cài node-fetch');
  process.exit(1);
}

testForgotPasswordAPI().catch(console.error);
