/**
 * Script test cấu hình email: congnhat.online để gửi, cnenglish.io.vn để redirect
 * Chạy: node scripts/test-email-config.js [email]
 */

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

async function testEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY || 're_BNRSxLo8_K8uyZbR4av8i5g4oJusct7iM';
  const testEmail = process.argv[2] || 'dinhcongnhat.02@gmail.com';
  
  console.log('🧪 Test Email Configuration...\n');
  console.log('📋 Cấu hình mong đợi:');
  console.log('   • Email FROM: noreply@congnhat.online (đã verify)');
  console.log('   • Reset URL: https://cnenglish.io.vn/reset-password?token=...');
  console.log(`\n📧 Test Email: ${testEmail}\n`);

  try {
    const resend = new Resend(apiKey);

    // Test email FROM: congnhat.online
    const fromEmail = 'CN English <noreply@congnhat.online>';
    const resetUrl = 'https://cnenglish.io.vn/reset-password?token=test_token_12345_for_verification';
    
    console.log('📤 Đang gửi email test...');
    console.log(`   From: ${fromEmail}`);
    console.log(`   To: ${testEmail}`);
    console.log(`   Reset URL trong email: ${resetUrl}\n`);

    const result = await resend.emails.send({
      from: fromEmail,
      to: [testEmail],
      subject: '🧪 Test Email Configuration - CN English',
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
            .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .info-box strong { color: #1e40af; }
            .button { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
            .url-display { background: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://cnenglish.io.vn/Logo.png" alt="CN English" class="logo" />
              <h1>CN English</h1>
            </div>
            <div class="content">
              <h2>🧪 Test Email Configuration</h2>
              
              <div class="info-box">
                <p><strong>✅ Email FROM:</strong> noreply@congnhat.online (verified domain)</p>
                <p><strong>✅ Reset URL:</strong> cnenglish.io.vn (new domain)</p>
              </div>
              
              <p>Đây là email test để kiểm tra cấu hình:</p>
              <ul>
                <li>Email được gửi từ domain <strong>congnhat.online</strong> (đã verify trong Resend)</li>
                <li>Link reset password dẫn đến domain <strong>cnenglish.io.vn</strong></li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu (Test)</a>
              </div>
              
              <div style="margin-top: 30px;">
                <p><strong>Reset URL trong email:</strong></p>
                <div class="url-display">${resetUrl}</div>
              </div>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                <strong>Lưu ý:</strong> Đây là email test. Link trên sẽ không hoạt động vì token là test token.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('✅ Email đã được gửi thành công!\n');
    console.log('📊 Response:');
    console.log(`   Email ID: ${result.data?.id || 'N/A'}`);
    console.log(`   Status: Success\n`);
    
    console.log('✅ Verification:');
    console.log(`   ✅ FROM: ${fromEmail} (should be congnhat.online)`);
    console.log(`   ✅ Reset URL: ${resetUrl} (should be cnenglish.io.vn)`);
    
    console.log('\n📋 Hãy kiểm tra:');
    console.log(`   1. Email trong inbox: ${testEmail}`);
    console.log('   2. Kiểm tra "From" address - phải là noreply@congnhat.online');
    console.log('   3. Kiểm tra link reset - phải là cnenglish.io.vn');
    console.log('   4. Xem Resend dashboard: https://resend.com/emails');
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ TEST HOÀN TẤT');
    console.log('─'.repeat(60));
    console.log('Nếu mọi thứ đúng:');
    console.log('   ✅ Email FROM sẽ hiển thị: noreply@congnhat.online');
    console.log('   ✅ Link trong email sẽ là: https://cnenglish.io.vn/...');

  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    
    if (error.statusCode === 403) {
      console.log('\n💡 Domain chưa được verify trong Resend');
      console.log('   → Vui lòng verify domain congnhat.online trong Resend dashboard');
    } else if (error.statusCode === 401) {
      console.log('\n💡 API key không hợp lệ');
      console.log('   → Vui lòng kiểm tra lại RESEND_API_KEY trong .env.local');
    }
    
    process.exit(1);
  }
}

testEmailConfig().catch(console.error);

