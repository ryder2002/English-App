import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

function ensureAdminOrThrow(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '') || req.cookies.get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  return token;
}

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ id: string; resultId: string }> }
) {
  try {
    const { id, resultId } = await context.params;
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const quizId = Number(id);
    const resultIdNum = Number(resultId);

    // Get quiz result with answers
    const result = await prisma.quizResult.findUnique({
      where: { id: resultIdNum },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        quiz: {
          include: {
            clazz: true,
          },
        },
        answers: {
          orderBy: { answeredAt: 'asc' },
        },
      },
    });

    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Verify admin owns this quiz's class
    if (result.quiz.clazz.teacherId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify result belongs to this quiz
    if (result.quizId !== quizId) {
      return NextResponse.json({ error: 'Result does not belong to this quiz' }, { status: 400 });
    }

    return NextResponse.json({
      result: {
        id: result.id,
        userId: result.userId,
        user: result.user,
        score: result.score,
        maxScore: result.maxScore,
        status: result.status || 'in_progress',
        startedAt: result.startedAt,
        endedAt: result.endedAt,
        correctCount: result.answers.filter(a => a.isCorrect).length,
        incorrectCount: result.answers.filter(a => !a.isCorrect).length,
        answers: result.answers.map(a => ({
          id: a.id,
          questionText: a.questionText,
          questionType: a.questionType,
          selectedAnswer: a.selectedAnswer,
          correctAnswer: a.correctAnswer,
          isCorrect: a.isCorrect,
          answeredAt: a.answeredAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get result details error:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}

