import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đầy đủ thông tin" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu mới phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    // Find user by reset token using raw SQL
    const users = await prisma.$queryRaw<{id: number, email: string}[]>`
      SELECT id, email FROM users 
      WHERE reset_token = ${token} 
      AND reset_token_expiry > NOW()
      LIMIT 1
    `;

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "Token không hợp lệ hoặc đã hết hạn" },
        { status: 400 }
      );
    }

    const user = users[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token using raw SQL
    await prisma.$executeRaw`
      UPDATE users 
      SET password = ${hashedPassword}, reset_token = NULL, reset_token_expiry = NULL
      WHERE id = ${user.id}
    `;

    return NextResponse.json({
      message: "Mật khẩu đã được đặt lại thành công",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra trên server" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
