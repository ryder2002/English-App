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
    const { answer } = body;

    // Get homework
    const homework = await prisma.homework.findUnique({
      where: { id: Number(homeworkId) },
      include: { clazz: { include: { members: { where: { userId: user.id } } } } },
    });

    if (!homework) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    // Check if user is a member of the class
    if (homework.clazz.members.length === 0) {
      return NextResponse.json({ error: 'You are not a member of this class' }, { status: 403 });
    }

    // Check if homework is locked
    const now = new Date();
    const isExpired = new Date(homework.deadline) < now;
    if (homework.status === 'locked' || isExpired) {
      return NextResponse.json({ error: 'This homework is locked. Deadline has passed.' }, { status: 400 });
    }

    const existingSubmission = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_userId: {
          homeworkId: Number(homeworkId),
          userId: user.id,
        },
      },
    });

    const startedAt = existingSubmission?.startedAt ?? now;
    const computedDuration = Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 1000));
    const previousDuration = existingSubmission?.timeSpentSeconds ?? 0;
    const timeSpentSeconds = Math.max(previousDuration, computedDuration);

    const normalize = (value: string | null | undefined) =>
      (value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

    const normalizedAnswer = normalize(answer);
    const normalizedKey = normalize(homework.answerText);
    const hasAnswerKey = Boolean(homework.answerText);
    const isCorrect = hasAnswerKey ? normalizedAnswer === normalizedKey : null;
    const score = hasAnswerKey ? (isCorrect ? 1 : 0) : null;
    const status = hasAnswerKey ? 'graded' : 'submitted';

    // Create or update submission
    const submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_userId: {
          homeworkId: Number(homeworkId),
          userId: user.id,
        },
      },
      update: {
        answer: answer || null,
        status,
        submittedAt: now,
        lastActivityAt: now,
        timeSpentSeconds,
        score,
      },
      create: {
        homeworkId: Number(homeworkId),
        userId: user.id,
        answer: answer || null,
        status,
        submittedAt: now,
        startedAt,
        lastActivityAt: now,
        timeSpentSeconds,
        score,
      },
    });

    return NextResponse.json({
      ...submission,
      isCorrect,
    });
  } catch (error: any) {
    console.error('Submit homework error:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}

