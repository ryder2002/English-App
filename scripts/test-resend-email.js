/**
 * Script để test gửi email với Resend
 * Chạy: node scripts/test-resend-email.js
 */

require('dotenv').config({ path: '.env' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResetPasswordEmail() {
  console.log('🔄 Testing Resend email service...\n');

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    console.log('Please add RESEND_API_KEY to your .env.local file');
    process.exit(1);
  }

  console.log('✅ API Key found');
  console.log(`📧 From: ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}\n`);

  // Prompt for test email
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Enter your email to receive test: ', async (testEmail) => {
    readline.close();

    if (!testEmail || !testEmail.includes('@')) {
      console.error('❌ Invalid email address');
      process.exit(1);
    }

    console.log(`\n📨 Sending test email to: ${testEmail}\n`);

    try {
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=test_token_12345`;

      const data = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'English App <onboarding@resend.dev>',
        to: [testEmail],
        subject: '🧪 TEST - Đặt lại mật khẩu - English Learning App',
        html: getTestEmailTemplate(resetUrl, testEmail),
      });

      console.log('✅ Email sent successfully!');
      console.log('\nResponse from Resend:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n📬 Please check your inbox (and spam folder)');
      console.log('📊 View detailed logs: https://resend.com/emails');

    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      
      if (error.message.includes('401')) {
        console.log('\n💡 Tip: Your API key may be invalid or expired');
        console.log('   Get a new one from: https://resend.com/api-keys');
      } else if (error.message.includes('429')) {
        console.log('\n💡 Tip: You have exceeded the rate limit');
        console.log('   Free tier: 100 emails/day, 3,000/month');
      }
    }
  });
}

function getTestEmailTemplate(resetUrl, email) {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Đặt lại mật khẩu - CN VOCAB</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 0 auto;
        }
        .container {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 48px 32px;
          text-align: center;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 20px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 800;
          color: #667eea;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .header h1 {
          color: white;
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        .header p {
          color: rgba(241, 234, 234, 0.9);
          font-size: 16px;
          margin: 0;
        }
        .content {
          padding: 48px 40px;
        }
        .greeting {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 24px;
        }
        .message {
          font-size: 16px;
          color: #4b5563;
          line-height: 1.8;
          margin-bottom: 20px;
        }
        .highlight {
          color: #667eea;
          font-weight: 600;
        }
        .security-notice {
          background: linear-gradient(135deg, #c2b474ff 0%, #efe29bff 100%);
          border-left: 4px solid #ffa200ff;
          padding: 20px;
          margin: 32px 0;
          border-radius: 8px;
        }
        .security-notice-title {
          font-size: 16px;
          font-weight: 700;
          color: #92400e;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .security-notice p {
          font-size: 14px;
          color: #78350f;
          margin: 8px 0;
          line-height: 1.6;
        }
        .button-container {
          text-align: center;
          margin: 40px 0;
        }
        .reset-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
          text-decoration: none;
          padding: 18px 48px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
        }
        .reset-button:hover {
          box-shadow: 0 20px 25px -5px rgba(102, 126, 234, 0.4);
          transform: translateY(-2px);
        }
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #e5e7eb, transparent);
          margin: 32px 0;
        }
        .link-section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
        }
        .link-section p {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .link-url {
          font-size: 12px;
          color: #667eea;
          word-break: break-all;
          font-family: monospace;
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        .expiry-notice {
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 16px;
          border-radius: 8px;
          margin: 24px 0;
        }
        .expiry-notice p {
          font-size: 14px;
          color: #991b1b;
          margin: 0;
        }
        .footer {
          background: #f9fafb;
          padding: 40px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-logo {
          font-size: 20px;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 16px;
        }
        .footer p {
          font-size: 14px;
          color: #6b7280;
          margin: 8px 0;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }
        .social-links {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .copyright {
          margin-top: 20px;
          font-size: 12px;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <div class="logo">CN</div>
            <h1>CN VOCAB</h1>
            <p>Your Smart Vocabulary Learning Platform</p>
          </div>
          
          <div class="content">
            <div class="greeting">Xin chào!</div>
            
            <p class="message">
              Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản <span class="highlight">${email}</span> 
              trên nền tảng CN VOCAB.
            </p>
            
            <p class="message">
              Để tiếp tục quá trình đặt lại mật khẩu, vui lòng nhấp vào nút bên dưới. 
              Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không bị thay đổi.
            </p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="reset-button">Đặt lại mật khẩu</a>
            </div>
            
            <div class="link-section">
              <p><strong>Hoặc sao chép link sau vào trình duyệt:</strong></p>
              <div class="link-url">${resetUrl}</div>
            </div>
            
            <div class="expiry-notice">
              <p>⏰ <strong>Lưu ý:</strong> Link này sẽ hết hạn sau 1 giờ kể từ khi được gửi vì lý do bảo mật.</p>
            </div>
            
            <div class="divider"></div>
            
            <div class="security-notice">
              <div class="security-notice-title">
                <span>🔒</span>
                <span>Bảo mật tài khoản</span>
              </div>
              <p>• Không chia sẻ link này với bất kỳ ai để bảo vệ tài khoản của bạn.</p>
              <p>• Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
              <p>• CN VOCAB sẽ không bao giờ yêu cầu mật khẩu của bạn qua email.</p>
            </div>
            
            <p class="message">
              Nếu bạn gặp bất kỳ vấn đề nào hoặc cần hỗ trợ, đừng ngần ngại liên hệ với đội ngũ của chúng tôi. 
              Chúng tôi luôn sẵn sàng giúp đỡ bạn!
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-logo">CN VOCAB</div>
            <p>Nền tảng học từ vựng thông minh</p>
            <p>Build your vocabulary, build your future</p>
            
            <div class="social-links">
              <p>
                <strong>Cần hỗ trợ?</strong><br>
                Email: <a href="mailto:dinhcongnhat.work@gmail.com">dinhcongnhat.work@gmail.com</a>
              </p>
            </div>
            
            <div class="copyright">
              <p>© ${new Date().getFullYear()} CN VOCAB. All rights reserved.</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Run the test
testResetPasswordEmail();
