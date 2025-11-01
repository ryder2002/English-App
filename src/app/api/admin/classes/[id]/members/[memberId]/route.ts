import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

function ensureAdminOrThrow(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '') || req.cookies.get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  return token;
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await context.params;
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const classId = Number(id);
    const memberIdNum = Number(memberId);

    // Get class and verify admin owns it
    const clazz = await prisma.clazz.findUnique({
      where: { id: classId },
      select: { id: true, teacherId: true },
    });

    if (!clazz) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (clazz.teacherId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if member exists and belongs to this class
    const membership = await prisma.classMember.findUnique({
      where: {
        clazzId_userId: {
          clazzId: classId,
          userId: memberIdNum,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Member not found in this class' }, { status: 404 });
    }

    // Remove member from class
    await prisma.classMember.delete({
      where: {
        clazzId_userId: {
          clazzId: classId,
          userId: memberIdNum,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa học viên khỏi lớp thành công' });
  } catch (error: any) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove member' }, { status: 400 });
  }
}

