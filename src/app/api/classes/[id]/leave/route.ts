import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classId = Number(id);

    // Check if user is a member of this class
    const membership = await prisma.classMember.findUnique({
      where: {
        clazzId_userId: {
          clazzId: classId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this class' }, { status: 404 });
    }

    // Remove user from class
    await prisma.classMember.delete({
      where: {
        clazzId_userId: {
          clazzId: classId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Đã rời lớp học thành công' });
  } catch (error: any) {
    console.error('Leave class error:', error);
    return NextResponse.json({ error: error.message || 'Failed to leave class' }, { status: 400 });
  }
}

