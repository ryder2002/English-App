import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(request: NextRequest, context: { params: Promise<{ homeworkId: string }> }) {
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

    const now = new Date();

    const homework = await prisma.homework.findUnique({
      where: { id: Number(homeworkId) },
      include: {
        clazz: {
          include: {
            members: true, // Include all members, filter later
          },
        },
        submissions: {
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!homework) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    const isMember = homework.clazz.members.some((member: any) => member.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: 'You are not a member of this class' }, { status: 403 });
    }

    const isExpired = new Date(homework.deadline) < now;
    if (homework.status === 'active' && isExpired) {
      await prisma.homework.update({
        where: { id: homework.id },
        data: { status: 'locked' },
      });
      homework.status = 'locked';
    }

    const submission = await prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId: homework.id,
        userId: user.id,
        status: 'in_progress',
      },
      orderBy: { attemptNumber: 'desc' },
    });

    // If no in-progress submission exists, create a new one
    let currentSubmission = submission;
    if (!currentSubmission) {
      const latestSubmission = await prisma.homeworkSubmission.findFirst({
        where: {
          homeworkId: homework.id,
          userId: user.id,
        },
        orderBy: { attemptNumber: 'desc' },
      });
      
      const nextAttemptNumber = latestSubmission ? latestSubmission.attemptNumber + 1 : 1;
      
      currentSubmission = await prisma.homeworkSubmission.create({
        data: {
          homeworkId: homework.id,
          userId: user.id,
          attemptNumber: nextAttemptNumber,
          startedAt: now,
          lastActivityAt: now,
          status: 'in_progress',
        },
      });
    } else {
      // Update lastActivityAt
      currentSubmission = await prisma.homeworkSubmission.update({
        where: { id: currentSubmission.id },
        data: { lastActivityAt: now },
      });
    }

    let processedAnswerText: string | null = null;
    if (!homework.promptText && homework.type === 'listening' && homework.answerText) {
      if (homework.hideMode === 'all') {
        processedAnswerText = '';
      } else if (homework.hideMode === 'random') {
        const words = homework.answerText.split(/\s+/);
        const hidePercentage = 0.3;
        const wordsToHide = Math.floor(words.length * hidePercentage);
        const indicesToHide = new Set<number>();
        while (indicesToHide.size < wordsToHide) {
          const randomIndex = Math.floor(Math.random() * words.length);
          if (randomIndex > 0 && randomIndex < words.length - 1) indicesToHide.add(randomIndex);
        }
        processedAnswerText = words.map((w, i) => (indicesToHide.has(i) ? '_____' : w)).join(' ');
      } else {
        processedAnswerText = homework.answerText;
      }
    }

    const hasSubmitted = currentSubmission ? (currentSubmission.status === 'submitted' || currentSubmission.status === 'graded') : false;
    const answerKey = hasSubmitted ? homework.answerText : null;

    // Get all submissions for history
    const allSubmissions = await prisma.homeworkSubmission.findMany({
      where: {
        homeworkId: homework.id,
        userId: user.id,
      },
      orderBy: { attemptNumber: 'desc' },
    });

    const { answerText, clazz, submissions, ...restHomework } = homework;

    return NextResponse.json({
      ...restHomework,
      clazz: {
        id: clazz.id,
        name: clazz.name,
      },
      promptText: homework.promptText,
      processedAnswerText,
      submissions: allSubmissions, // Return all submissions for history
      currentSubmission, // Current attempt
      answerKey,
      boxes: Array.isArray(homework.answerBoxes) ? homework.answerBoxes.length : 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}

