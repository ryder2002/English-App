import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth-service";

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();

    // Validate input
    if (!currentPassword || !newPassword) {
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

    // Get user from token (check both cookie and Authorization header)
    // Check cookie first (used by admin with httpOnly cookie)
    let token = request.cookies.get("token")?.value;
    
    // If no cookie token, check Authorization header (used by regular users)
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để tiếp tục" },
        { status: 401 }
      );
    }

    // Verify token using AuthService
    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Token không hợp lệ" },
        { status: 401 }
      );
    }

    // Use AuthService to change password
    await AuthService.changePassword(user.id, currentPassword, newPassword);

    return NextResponse.json({
      message: "Đổi mật khẩu thành công",
    });

  } catch (error) {
    console.error("Change password error:", error);
    
    // Handle specific errors from AuthService
    if (error instanceof Error) {
      if (error.message === "User not found") {
        return NextResponse.json(
          { error: "Không tìm thấy người dùng" },
          { status: 404 }
        );
      }
      if (error.message === "Current password is incorrect") {
        return NextResponse.json(
          { error: "Mật khẩu hiện tại không đúng" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Có lỗi xảy ra trên server" },
      { status: 500 }
    );
  }
}
