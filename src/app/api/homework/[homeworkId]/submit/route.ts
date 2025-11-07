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
    const { answer, answers } = body;

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

    const normalized = (v: any) => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

    let score: number | null = null;
    let isCorrect: boolean | null = null;
    let boxResults: boolean[] | null = null;
    let saveAnswersJson: any = null;

    if (Array.isArray(homework.answerBoxes) && homework.answerBoxes.length > 0 && Array.isArray(answers)) {
      const keys = (homework.answerBoxes as any[]).map(normalized);
      const user = answers.map(normalized);
      const total = keys.length;
      const results: boolean[] = [];
      let correct = 0;
      for (let i = 0; i < total; i++) {
        const ok = user[i] !== undefined && user[i] === keys[i];
        results.push(ok);
        if (ok) correct++;
      }
      score = total > 0 ? correct / total : 0;
      isCorrect = total > 0 ? correct === total : null;
      boxResults = results;
      saveAnswersJson = answers;
    } else {
      const normalizedAnswer = normalized(answer);
      const normalizedKey = normalized(homework.answerText);
      const hasAnswerKey = Boolean(homework.answerText);
      isCorrect = hasAnswerKey ? normalizedAnswer === normalizedKey : null;
      score = hasAnswerKey ? (isCorrect ? 1 : 0) : null;
    }

    // Create or update submission
    const submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_userId: {
          homeworkId: Number(homeworkId),
          userId: user.id,
        },
      },
      update: {
        answer: Array.isArray(answers) ? null : (answer || null),
        answers: saveAnswersJson ? saveAnswersJson : undefined,
        boxResults: boxResults ? boxResults : undefined,
        status: score === null ? 'submitted' : 'graded',
        submittedAt: now,
        lastActivityAt: now,
        timeSpentSeconds,
        score,
      },
      create: {
        homeworkId: Number(homeworkId),
        userId: user.id,
        answer: Array.isArray(answers) ? null : (answer || null),
        answers: saveAnswersJson ? saveAnswersJson : undefined,
        boxResults: boxResults ? boxResults : undefined,
        status: score === null ? 'submitted' : 'graded',
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
      boxResults,
    });
  } catch (error: any) {
    console.error('Submit homework error:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}

