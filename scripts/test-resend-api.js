/**
 * Script test Resend API với API key cụ thể
 * Chạy: node scripts/test-resend-api.js [email]
 */

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

async function testResendAPI() {
  const apiKey = 're_BNRSxLo8_K8uyZbR4av8i5g4oJusct7iM';
  const testEmail = process.argv[2] || 'dinhcongnhat.02@gmail.com';
  const domain = 'congnhat.online';
  
  console.log('🧪 Test Resend API...\n');
  console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`📧 Test Email: ${testEmail}`);
  console.log(`🌐 Domain: ${domain}\n`);

  try {
    const resend = new Resend(apiKey);

    // Test 1: Validate API key
    console.log('1. Kiểm tra API key...');
    try {
      const domains = await resend.domains.list();
      console.log('   ✅ API key hợp lệ!');
      console.log(`   📊 Số domains: ${domains.data?.length || 0}`);
      if (domains.data && domains.data.length > 0) {
        console.log('   📋 Domains:');
        domains.data.forEach(d => {
          console.log(`      - ${d.name} (${d.status})`);
        });
      }
    } catch (error) {
      if (error.statusCode === 401) {
        console.log('   ❌ API key không hợp lệ hoặc đã hết hạn');
        process.exit(1);
      }
      throw error;
    }

    // Test 2: Try sending with different email formats
    console.log('\n2. Test gửi email...');
    const emailFormats = [
      `CN English <noreply@${domain}>`,
      `CN English <onboarding@resend.dev>`
    ];

    let sent = false;
    let workingFormat = null;

    for (const fromEmail of emailFormats) {
      try {
        console.log(`   Thử gửi với: ${fromEmail}`);
        const result = await resend.emails.send({
          from: fromEmail,
          to: [testEmail],
          subject: '🧪 Test Email - CN English',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .logo { width: 100px; height: 100px; margin: 0 auto 20px; border-radius: 20px; }
                .content { padding: 30px; }
                .button { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <img src="https://${domain}/BG.png" alt="CN English" class="logo" />
                  <h1>CN English</h1>
                </div>
                <div class="content">
                  <h2>Test Email</h2>
                  <p>Đây là email test từ Resend API.</p>
                  <p>From: <strong>${fromEmail}</strong></p>
                  <p>Nếu bạn nhận được email này, API đã hoạt động thành công! ✅</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        console.log('   ✅ Email đã được gửi thành công!');
        console.log(`   📬 Email ID: ${result.data?.id || 'N/A'}`);
        console.log(`   📧 From: ${fromEmail}`);
        
        sent = true;
        workingFormat = fromEmail;
        break;
      } catch (error) {
        console.log(`   ❌ Lỗi: ${error.message}`);
        if (error.message?.includes('domain') || error.message?.includes('verified')) {
          console.log(`   ⚠️  Domain chưa verify, thử format khác...`);
          continue;
        }
      }
    }

    if (!sent) {
      console.log('\n   ❌ Không thể gửi email với bất kỳ format nào');
      console.log('   💡 Hãy verify domain trong Resend dashboard');
      process.exit(1);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ KẾT QUẢ:');
    console.log('─'.repeat(60));
    console.log(`✅ API key: Hợp lệ`);
    console.log(`✅ Email đã gửi thành công`);
    console.log(`✅ Format hoạt động: ${workingFormat}`);
    console.log('\n📋 Tiếp theo:');
    console.log(`   1. Kiểm tra inbox: ${testEmail}`);
    console.log('   2. Kiểm tra spam folder');
    console.log('   3. Xem logs: https://resend.com/emails');
    
    if (workingFormat.includes('resend.dev')) {
      console.log('\n⚠️  Đang dùng onboarding@resend.dev (email có thể vào spam)');
      console.log(`   → Verify domain ${domain} trong Resend để dùng noreply@${domain}`);
    }

  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    if (error.statusCode) {
      console.error(`   Status Code: ${error.statusCode}`);
    }
    process.exit(1);
  }
}

testResendAPI().catch(console.error);

