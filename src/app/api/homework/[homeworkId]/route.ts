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

    // Get homework
    const homework = await prisma.homework.findUnique({
      where: { id: Number(homeworkId) },
      include: {
        clazz: {
          include: {
            members: { where: { userId: user.id } },
          },
        },
        submissions: {
          where: { userId: user.id },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!homework) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    // Check if user is a member of the class
    if (homework.clazz.members.length === 0) {
      return NextResponse.json({ error: 'You are not a member of this class' }, { status: 403 });
    }

    // Check deadline and auto-lock if expired
    const isExpired = new Date(homework.deadline) < now;
    if (homework.status === 'active' && isExpired) {
      await prisma.homework.update({
        where: { id: homework.id },
        data: { status: 'locked' },
      });
      homework.status = 'locked';
    }

    // Ensure there is a submission record to track progress
    const submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_userId: {
          homeworkId: homework.id,
          userId: user.id,
        },
      },
      create: {
        homeworkId: homework.id,
        userId: user.id,
        startedAt: now,
        lastActivityAt: now,
      },
      update: {
        lastActivityAt: now,
      },
    });

    // For listening homework, process the answer text based on hideMode if no prompt provided
    let processedAnswerText: string | null = null;
    if (!homework.promptText && homework.type === 'listening' && homework.answerText) {
      if (homework.hideMode === 'all') {
        // Hide all - return empty string
        processedAnswerText = '';
      } else if (homework.hideMode === 'random') {
        // Hide random words - replace some words with blanks
        const words = homework.answerText.split(/\s+/);
        const hidePercentage = 0.3; // Hide 30% of words
        const wordsToHide = Math.floor(words.length * hidePercentage);
        const indicesToHide = new Set<number>();

        while (indicesToHide.size < wordsToHide) {
          const randomIndex = Math.floor(Math.random() * words.length);
          if (randomIndex > 0 && randomIndex < words.length - 1) {
            // Don't hide first/last word
            indicesToHide.add(randomIndex);
          }
        }

        processedAnswerText = words
          .map((word, index) => (indicesToHide.has(index) ? '_____' : word))
          .join(' ');
      } else {
        processedAnswerText = homework.answerText;
      }
    }

    const { answerText, clazz, submissions, ...restHomework } = homework;

    return NextResponse.json({
      ...restHomework,
      clazz: {
        id: clazz.id,
        name: clazz.name,
      },
      promptText: homework.promptText,
      processedAnswerText,
      submissions: [submission],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}

