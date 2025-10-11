import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp email" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success for security reasons (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({
        message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email đặt lại mật khẩu.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database using raw SQL
    await prisma.$executeRaw`
      UPDATE users 
      SET reset_token = ${resetToken}, reset_token_expiry = ${resetTokenExpiry}
      WHERE email = ${email}
    `;

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'https://congnhat.online'}/reset-password?token=${resetToken}`;

    // Send email
    if (process.env.EMAIL_SERVICE_ENABLED === "true") {
      await sendResetEmail(email, resetUrl);
    } else {
      console.log("Email service not configured. Reset URL:", resetUrl);
    }

    return NextResponse.json({
      message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email đặt lại mật khẩu.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra trên server" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function sendResetEmail(email: string, resetUrl: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Cấu hình chuyên nghiệp để tránh spam
    tls: {
      rejectUnauthorized: false
    },
    dkim: {
      // DKIM signing nếu có cấu hình
      domainName: process.env.DKIM_DOMAIN || "gmail.com",
      keySelector: process.env.DKIM_SELECTOR || "default",
      privateKey: process.env.DKIM_PRIVATE_KEY || ""
    },
    // Connection timeout
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000
  });

  const mailOptions = {
    from: {
      name: 'English Learning App - Hệ thống học tiếng Anh',
      address: process.env.EMAIL_USER || "dinhcongnhat.02@gmail.com"
    },
    to: email,
    replyTo: process.env.EMAIL_USER || "dinhcongnhat.02@gmail.com",
    subject: "🔐 Yêu cầu đặt lại mật khẩu - English Learning App",
    // Thêm Message-ID unique
    messageId: `<reset-${crypto.randomBytes(16).toString('hex')}@english-learning-app.com>`,
    text: `
Kính chào quý khách,

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản English Learning App của bạn tại địa chỉ email: ${email}

Để đảm bảo an toàn, vui lòng truy cập liên kết bảo mật sau để tạo mật khẩu mới:
${resetUrl}

THÔNG TIN QUAN TRỌNG:
- Liên kết này chỉ có hiệu lực trong vòng 1 giờ kể từ khi gửi
- Chỉ sử dụng liên kết này nếu bạn thực sự yêu cầu đặt lại mật khẩu
- Sau khi đặt lại thành công, liên kết này sẽ tự động vô hiệu

Nếu bạn KHÔNG yêu cầu đặt lại mật khẩu:
- Vui lòng bỏ qua email này
- Tài khoản của bạn vẫn hoàn toàn an toàn
- Không có thay đổi nào được thực hiện

Để được hỗ trợ, vui lòng liên hệ: ${process.env.EMAIL_USER || "dinhcongnhat.02@gmail.com"}

Trân trọng cảm ơn,
Đội ngũ phát triển English Learning App
Website: ${process.env.NEXTAUTH_URL || 'https://congnhat.online'}
    `,
    html: `
      <!DOCTYPE html>
      <html lang="vi" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
        <title>Đặt lại mật khẩu - English Learning App</title>
        <!--[if gte mso 9]>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .button { display: inline-block; text-decoration: none; color: #ffffff !important; }
          @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; margin: 0 !important; }
            .content-padding { padding: 20px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <!-- Preheader text -->
        <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
          Yêu cầu đặt lại mật khẩu cho tài khoản English Learning App của bạn. Nhấn vào liên kết để tiếp tục.
        </div>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
          <tr>
            <td style="padding: 40px 20px;">
              <div class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <!-- Header -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                        🎓 English Learning App
                      </h1>
                      <p style="color: #e2e8f0; margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">
                        Hệ thống học tiếng Anh thông minh
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Main content -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td class="content-padding" style="padding: 40px 30px;">
                      <h2 style="color: #111827; margin: 0 0 24px 0; font-size: 24px; font-weight: 600; line-height: 1.3;">
                        🔐 Yêu cầu đặt lại mật khẩu
                      </h2>
                      
                      <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Kính chào <strong>${email}</strong>,
                      </p>
                      
                      <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản English Learning App của bạn. 
                        Để đảm bảo an toàn tài khoản, vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới:
                      </p>

                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
                        <tr>
                          <td style="text-align: center;">
                            <a href="${resetUrl}" class="button" 
                               style="display: inline-block; 
                                      padding: 16px 32px; 
                                      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                                      color: #ffffff !important; 
                                      text-decoration: none; 
                                      border-radius: 8px; 
                                      font-weight: 600;
                                      font-size: 16px;
                                      text-align: center;
                                      transition: all 0.2s ease;
                                      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);">
                              🔑 Đặt lại mật khẩu ngay
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Security notice -->
                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                        <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
                          ⚠️ THÔNG TIN BẢO MẬT QUAN TRỌNG
                        </p>
                        <ul style="color: #92400e; font-size: 14px; line-height: 1.5; margin: 0; padding-left: 20px;">
                          <li>Liên kết chỉ có hiệu lực trong <strong>1 giờ</strong> kể từ khi gửi</li>
                          <li>Chỉ sử dụng nếu bạn thực sự yêu cầu đặt lại mật khẩu</li>
                          <li>Sau khi đặt lại thành công, liên kết sẽ tự động vô hiệu</li>
                        </ul>
                      </div>

                      <p style="color: #374151; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
                        <strong>Nếu bạn KHÔNG yêu cầu đặt lại mật khẩu:</strong><br>
                        Vui lòng bỏ qua email này. Tài khoản của bạn vẫn hoàn toàn an toàn và không có thay đổi nào được thực hiện.
                      </p>

                      <hr style="border: none; height: 1px; background-color: #e2e8f0; margin: 32px 0;">
                      
                      <p style="color: #4b5563; font-size: 12px; line-height: 1.5; margin: 0;">
                        <strong>Gặp khó khăn?</strong> Sao chép và dán liên kết sau vào trình duyệt:<br>
                        <span style="color: #374151; word-break: break-all; font-family: 'Courier New', monospace; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 4px;">${resetUrl}</span>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Footer -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="background-color: #f8fafc; padding: 32px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="color: #374151; font-size: 14px; margin: 0 0 12px 0; line-height: 1.5;">
                        Trân trọng cảm ơn,<br>
                        <strong style="color: #111827;">Đội ngũ phát triển English Learning App</strong>
                      </p>
                      <p style="color: #4b5563; font-size: 12px; margin: 0; line-height: 1.4;">
                        📧 Hỗ trợ: ${process.env.EMAIL_USER || "dinhcongnhat.02@gmail.com"} | 🌐 Website: ${process.env.NEXTAUTH_URL || 'https://congnhat.online'}
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    // Headers chuyên nghiệp để tránh spam
    headers: {
      'X-Priority': '3',
      'X-MSMail-Priority': 'Normal',
      'Importance': 'Normal',
      'X-Mailer': 'English Learning App v1.0',
      'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
      'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=Unsubscribe>`,
      'X-Report-Abuse': `Report abuse to: ${process.env.EMAIL_USER}`,
      'X-Entity-ID': 'english-learning-app-system',
      'X-Campaign-Type': 'transactional',
      'X-Email-Type': 'password-reset'
    }
  };

  await transporter.sendMail(mailOptions);
}
