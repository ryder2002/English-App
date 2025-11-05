import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';
import { sendSystemNotificationEmail } from '@/lib/services/email-service';

function getTokenFromRequest(request: NextRequest) {
  const cookie = request.cookies.get('token')?.value;
  if (cookie) return cookie;
  
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

// GET - Lấy tất cả thông báo (admin only)
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUser = await AuthService.verifyToken(token);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const notifications = await prisma.systemNotification.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true
      }
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Tạo thông báo mới và gửi email (admin only)
export const maxDuration = 300; // 5 phút timeout cho route này
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUser = await AuthService.verifyToken(token);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, content, type, isActive, sendEmail } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Tạo thông báo mới
    const notification = await prisma.systemNotification.create({
      data: {
        title,
        content,
        type: type || 'info',
        isActive: isActive !== undefined ? isActive : true,
        createdBy: currentUser.id
      }
    });

    // Nếu chọn gửi email, gửi đến tất cả users
    let emailResults = { sent: 0, failed: 0, total: 0 };
    if (sendEmail) {
      try {
        const users = await prisma.user.findMany({
          select: {
            email: true,
            name: true
          }
        });

        emailResults.total = users.length;
        console.log(`📧 Preparing to send notification emails to ${users.length} users`);

        if (users.length === 0) {
          console.warn('⚠️ No users found to send emails to');
        } else {
          // Gửi email tuần tự cho từng user (giống như script) để tránh rate limit
          for (let i = 0; i < users.length; i++) {
            const user = users[i];
            try {
              console.log(`[${i + 1}/${users.length}] Sending email to ${user.email}...`);
              const result = await sendSystemNotificationEmail({
                to: user.email,
                title,
                content,
                type: type || 'info',
                userName: user.name || 'bạn'
              });
              console.log(`✅ Email sent successfully to ${user.email}`);
              emailResults.sent++;
              
              // Delay nhỏ giữa các email để tránh rate limit (500ms)
              if (i < users.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            } catch (error: any) {
              console.error(`❌ Error sending email to ${user.email}:`, error.message || error);
              emailResults.failed++;
              // Continue với user tiếp theo
              continue;
            }
          }
          
          console.log(`📧 Email sending completed: ${emailResults.sent} sent, ${emailResults.failed} failed out of ${emailResults.total} total`);
        }
      } catch (emailError: any) {
        console.error('❌ Error in email sending process:', emailError);
        // Log chi tiết lỗi
        console.error('Email error details:', {
          message: emailError.message,
          stack: emailError.stack,
          name: emailError.name
        });
        // Không fail request nếu email lỗi, vì thông báo đã được tạo
      }
    }

    return NextResponse.json({
      notification,
      message: 'Notification created successfully',
      emailsSent: sendEmail ? emailResults.sent > 0 : false,
      emailResults: sendEmail ? {
        sent: emailResults.sent,
        failed: emailResults.failed,
        total: emailResults.total
      } : null
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật thông báo (admin only)
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUser = await AuthService.verifyToken(token);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, title, content, type, isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const notification = await prisma.systemNotification.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({
      notification,
      message: 'Notification updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa thông báo (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUser = await AuthService.verifyToken(token);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    await prisma.systemNotification.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      message: 'Notification deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

