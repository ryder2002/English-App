import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

function ensureAdminOrThrow(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '') || req.cookies.get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  return token;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const quizId = Number(id);

    // Get quiz with all results
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        results: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
          orderBy: { startedAt: 'desc' },
        },
        clazz: {
          include: {
            members: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Check if admin owns this quiz's class
    const isOwner = quiz.clazz.teacherId === user.id;
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Safely get status fields (may not exist in DB yet)
    const getQuizStatus = (q: any) => q.status || 'pending';
    const getResultStatus = (r: any) => {
      if (r.status) return r.status;
      if (r.endedAt) return 'submitted';
      return 'in_progress';
    };

    // Only allow monitoring for active or ended quizzes
    const quizStatus = getQuizStatus(quiz);
    if (quizStatus === 'pending') {
      return NextResponse.json({ 
        error: 'Cannot monitor quiz that has not started yet',
        quizStatus: 'pending'
      }, { status: 400 });
    }

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        quizCode: quiz.quizCode,
        status: getQuizStatus(quiz),
        createdAt: quiz.createdAt,
      },
      results: await Promise.all(quiz.results.map(async (r: any) => {
        // Get answer details for each result
        const answerDetails = await prisma.quizAnswerDetail.findMany({
          where: { resultId: r.id },
          orderBy: { answeredAt: 'asc' },
        });

        return {
          id: r.id,
          userId: r.userId,
          user: r.user,
          score: r.score,
          maxScore: r.maxScore,
          status: getResultStatus(r),
          startedAt: r.startedAt,
          endedAt: r.endedAt,
          answerDetails: answerDetails.map((a: any) => ({
            id: a.id,
            questionText: a.questionText,
            questionType: a.questionType,
            selectedAnswer: a.selectedAnswer,
            correctAnswer: a.correctAnswer,
            isCorrect: a.isCorrect,
          })),
          correctCount: answerDetails.filter((a: any) => a.isCorrect).length,
          incorrectCount: answerDetails.filter((a: any) => !a.isCorrect).length,
        };
      })),
      totalMembers: quiz.clazz.members.length,
      completedCount: quiz.results.filter((r: any) => {
        const status = getResultStatus(r);
        return status === 'submitted' || status === 'completed';
      }).length,
      inProgressCount: quiz.results.filter((r: any) => getResultStatus(r) === 'in_progress').length,
    });
  } catch (error: any) {
    console.error('Monitor quiz error:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}

