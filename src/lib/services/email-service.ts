import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendResetEmailParams {
  to: string;
  resetUrl: string;
  userName?: string;
}

export async function sendResetPasswordEmail({
  to,
  resetUrl,
  userName = 'bạn'
}: SendResetEmailParams) {
  try {
    // Always use congnhat.online for email from (verified domain)
    // Force use congnhat.online even if RESEND_FROM_EMAIL is set to other domain
    let fromEmail = process.env.RESEND_FROM_EMAIL || 'CN English <noreply@congnhat.online>';
    
    // Ensure it uses congnhat.online domain (replace if needed)
    if (!fromEmail.includes('congnhat.online')) {
      // Extract name if exists, otherwise use default
      const nameMatch = fromEmail.match(/^([^<]+)</);
      const name = nameMatch ? nameMatch[1].trim() : 'CN English';
      fromEmail = `${name} <noreply@congnhat.online>`;
    }

    const data = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: '🔐 Đặt lại mật khẩu - CN English',
      html: getResetPasswordEmailTemplate(resetUrl, userName),
    });

    console.log('Reset password email sent successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending reset password email:', error);
    
    // Provide more helpful error message
    if (error.message?.includes('from') || error.message?.includes('validation_error')) {
      const errorMsg = `Invalid email format in RESEND_FROM_EMAIL. Current: "${process.env.RESEND_FROM_EMAIL || 'undefined'}". Expected: "CN English <noreply@congnhat.online>"`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    throw error;
  }
}

function getResetPasswordEmailTemplate(resetUrl: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Đặt lại mật khẩu - CN English</title>
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
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%), url('${process.env.NEXTAUTH_URL?.includes('cnenglish.io.vn') ? process.env.NEXTAUTH_URL : 'https://cnenglish.io.vn'}/BG.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
          background-blend-mode: overlay;
          padding: 20px;
          margin: 0;
          min-height: 100vh;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .container {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          position: relative;
          z-index: 2;
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
          color: rgba(255, 255, 255, 0.9);
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
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b;
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
            <div class="logo">
              <img src="${process.env.NEXTAUTH_URL?.includes('cnenglish.io.vn') ? process.env.NEXTAUTH_URL : 'https://cnenglish.io.vn'}/Logo.png" alt="CN English Logo" />
            </div>
            <h1>CN English</h1>
            <p>Your Smart Vocabulary Learning Platform</p>
          </div>
          
          <div class="content">
            <div class="greeting">Xin chào ${userName}!</div>
            
            <p class="message">
              Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên nền tảng 
              <span class="highlight">CN English</span>.
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
                <span>�</span>
                <span>Bảo mật tài khoản</span>
              </div>
              <p>• Không chia sẻ link này với bất kỳ ai để bảo vệ tài khoản của bạn.</p>
              <p>• Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
              <p>• CN English sẽ không bao giờ yêu cầu mật khẩu của bạn qua email.</p>
              <p>• Luôn sử dụng mật khẩu mạnh có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
            </div>
            
            <p class="message">
              Nếu bạn gặp bất kỳ vấn đề nào hoặc cần hỗ trợ, đừng ngần ngại liên hệ với đội ngũ của chúng tôi. 
              Chúng tôi luôn sẵn sàng giúp đỡ bạn!
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-logo">
              <img src="${process.env.NEXTAUTH_URL?.includes('cnenglish.io.vn') ? process.env.NEXTAUTH_URL : 'https://cnenglish.io.vn'}/Logo.png" alt="CN English" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px;" />
              <div style="font-size: 24px; font-weight: 700; color: #667eea; margin-top: 10px;">CN English</div>
            </div>
            <p>Nền tảng học từ vựng thông minh</p>
            <p>Build your vocabulary, build your future</p>
            
            <div class="social-links">
              <p>
                <strong>Cần hỗ trợ?</strong><br>
                Email: <a href="mailto:dinhcongnhat.work@gmail.com">dinhcongnhat.work@gmail.com</a>
              </p>
            </div>
            
            <div class="copyright">
              <p>© ${new Date().getFullYear()} CN English. All rights reserved.</p>
              <p>Email này được gửi tới tài khoản của bạn vì có yêu cầu đặt lại mật khẩu.</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Welcome email for new users (optional)
export async function sendWelcomeEmail(to: string, userName: string) {
  try {
    const data = await resend.emails.send({
      from: (() => {
        const email = process.env.RESEND_FROM_EMAIL || 'CN English <noreply@congnhat.online>';
        // Force use congnhat.online
        if (!email.includes('congnhat.online')) {
          const nameMatch = email.match(/^([^<]+)</);
          const name = nameMatch ? nameMatch[1].trim() : 'CN English';
          return `${name} <noreply@congnhat.online>`;
        }
        return email;
      })(),
      to: [to],
      subject: '🎉 Chào mừng đến với CN English!',
      html: getWelcomeEmailTemplate(userName),
    });

    console.log('Welcome email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

function getWelcomeEmailTemplate(userName: string): string {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chào mừng</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #333;
          font-size: 24px;
        }
        .content p {
          color: #666;
          font-size: 16px;
          margin: 15px 0;
        }
        .feature-list {
          margin: 25px 0;
        }
        .feature-item {
          padding: 15px;
          margin: 10px 0;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        .feature-item h3 {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 18px;
        }
        .feature-item p {
          margin: 0;
          font-size: 14px;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 15px 40px;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 30px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Chào mừng!</h1>
        </div>
        
        <div class="content">
          <h2>Xin chào ${userName},</h2>
          
          <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>English Learning App</strong>!</p>
          
          <p>Bạn đã sẵn sàng bắt đầu hành trình học tiếng Anh của mình. Đây là những tính năng bạn có thể sử dụng:</p>
          
          <div class="feature-list">
            <div class="feature-item">
              <h3>📚 Thêm từ vựng</h3>
              <p>Tạo và quản lý bộ từ vựng cá nhân của riêng bạn</p>
            </div>
            
            <div class="feature-item">
              <h3>🗂️ Quản lý thư mục</h3>
              <p>Tổ chức từ vựng theo chủ đề với hệ thống thư mục phân cấp</p>
            </div>
            
            <div class="feature-item">
              <h3>🎴 Flashcards</h3>
              <p>Ôn tập từ vựng hiệu quả với flashcards tương tác</p>
            </div>
            
            <div class="feature-item">
              <h3>🎯 Quiz & Games</h3>
              <p>Kiểm tra kiến thức với các bài quiz và trò chơi vui nhộn</p>
            </div>
            
            <div class="feature-item">
              <h3>🤖 AI Chatbot</h3>
              <p>Luyện tập hội thoại với trợ lý AI thông minh</p>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL?.includes('cnenglish.io.vn') ? process.env.NEXTAUTH_URL : 'https://cnenglish.io.vn'}" class="cta-button">
              Bắt đầu học ngay
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>English Learning App</strong></p>
          <p>Chúc bạn học tập hiệu quả!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export { resend };
