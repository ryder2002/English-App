import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function DELETE(request: NextRequest, context: { params: Promise<{ homeworkId: string; userId: string }> }) {
  try {
    const { homeworkId, userId } = await context.params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = Number(userId);
    const hwId = Number(homeworkId);

    // Check if requesting user is admin or is deleting their own submissions
    if (user.role !== 'admin' && user.id !== targetUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If admin, check if homework belongs to their class
    if (user.role === 'admin') {
      const homework = await prisma.homework.findUnique({
        where: { id: hwId },
        include: { clazz: true },
      });

      if (!homework) {
        return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
      }

      if (homework.clazz.teacherId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Delete all submissions for this user and homework
    const deletedSubmissions = await prisma.homeworkSubmission.deleteMany({
      where: {
        homeworkId: hwId,
        userId: targetUserId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedSubmissions.count} submissions`,
      deletedCount: deletedSubmissions.count,
    });
  } catch (error: any) {
    console.error('Delete submissions error:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}
