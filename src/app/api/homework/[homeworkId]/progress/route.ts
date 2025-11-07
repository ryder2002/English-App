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

    const body = await request.json();
    const increment = Number(body?.timeSpentSeconds ?? 0);
    const safeIncrement = Number.isFinite(increment) && increment > 0 ? Math.round(increment) : 0;

    const homework = await prisma.homework.findUnique({
      where: { id: Number(homeworkId) },
      select: {
        id: true,
        clazz: {
          select: {
            members: {
              where: { userId: user.id },
              select: { id: true },
            },
          },
        },
        status: true,
      },
    });

    if (!homework) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    if (homework.clazz.members.length === 0) {
      return NextResponse.json({ error: 'You are not a member of this class' }, { status: 403 });
    }

    if (homework.status === 'locked') {
      return NextResponse.json({ error: 'Homework is locked' }, { status: 400 });
    }

    const now = new Date();

    // Get or create the current attempt (default to attempt 1)
    let submission = await prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId: Number(homeworkId),
        userId: user.id,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
    });

    const currentAttemptNumber = submission?.attemptNumber || 1;

    submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_userId_attemptNumber: {
          homeworkId: Number(homeworkId),
          userId: user.id,
          attemptNumber: currentAttemptNumber,
        },
      },
      create: {
        homeworkId: Number(homeworkId),
        userId: user.id,
        attemptNumber: currentAttemptNumber,
        startedAt: now,
        lastActivityAt: now,
        timeSpentSeconds: safeIncrement,
      },
      update: {
        lastActivityAt: now,
        timeSpentSeconds: {
          increment: safeIncrement,
        },
      },
    });

    return NextResponse.json(submission);
  } catch (error: any) {
    console.error('Homework progress error:', error);
    return NextResponse.json({ error: error.message || 'Error tracking progress' }, { status: 400 });
  }
}
