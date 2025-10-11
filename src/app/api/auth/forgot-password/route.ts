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
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@englishapp.com",
    to: email,
    subject: "Đặt lại mật khẩu - English App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Đặt lại mật khẩu</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản English App của mình.</p>
        <p>Nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Đặt lại mật khẩu
        </a>
        <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
