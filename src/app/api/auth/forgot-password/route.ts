import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { sendResetPasswordEmail } from "@/lib/services/email-service";

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

    // Send email with Resend
    try {
      await sendResetPasswordEmail({
        to: email,
        resetUrl,
        userName: user.name || user.email
      });
      console.log('Reset password email sent successfully to:', email);
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
      // Don't throw error to user, just log it
      // User will still see success message for security
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