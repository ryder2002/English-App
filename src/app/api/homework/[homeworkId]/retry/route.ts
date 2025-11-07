import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest, context: { params: Promise<{ homeworkId: string }> }) {
  try {
    const { homeworkId } = await context.params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hw = await prisma.homework.findUnique({
      where: { id: Number(homeworkId) },
      include: { clazz: { include: { members: { where: { userId: user.id } } } } },
    });

    if (!hw) return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    if (hw.clazz.members.length === 0) return NextResponse.json({ error: 'You are not a member of this class' }, { status: 403 });

    // If locked or expired, do not allow retry
    const now = new Date();
    if (hw.status === 'locked' || now > new Date(hw.deadline)) {
      return NextResponse.json({ error: 'Homework is locked or deadline passed' }, { status: 400 });
    }

    // Find the latest submission
    const latestSubmission = await prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId: Number(homeworkId),
        userId: user.id,
      },
      orderBy: { attemptNumber: 'desc' },
    });

    const nextAttemptNumber = latestSubmission ? latestSubmission.attemptNumber + 1 : 1;

    // Create a new attempt (don't reset previous attempts)
    const newAttempt = await prisma.homeworkSubmission.create({
      data: {
        homeworkId: Number(homeworkId),
        userId: user.id,
        attemptNumber: nextAttemptNumber,
        status: 'in_progress',
        startedAt: new Date(),
        lastActivityAt: new Date(),
        timeSpentSeconds: 0,
      },
    });

    return NextResponse.json(newAttempt);
  } catch (error: any) {
    console.error('Retry homework error:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}
