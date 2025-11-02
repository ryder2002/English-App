import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; resultId: string }> }
) {
  try {
    const { id, resultId } = await context.params;
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quizId = Number(id);
    const resultIdNum = Number(resultId);

    // Get quiz result with answers
    const result = await prisma.quizResult.findUnique({
      where: { id: resultIdNum },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            quizCode: true,
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

    // Verify the result belongs to the user
    if (result.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify the result belongs to the quiz
    if (result.quizId !== quizId) {
      return NextResponse.json({ error: 'Result does not match quiz' }, { status: 400 });
    }

    return NextResponse.json({
      result: {
        id: result.id,
        score: result.score,
        maxScore: result.maxScore,
        startedAt: result.startedAt.toISOString(),
        endedAt: result.endedAt?.toISOString(),
        status: result.status,
      },
      answers: result.answers.map((a) => ({
        id: a.id,
        questionText: a.questionText,
        questionType: a.questionType,
        selectedAnswer: a.selectedAnswer,
        correctAnswer: a.correctAnswer,
        isCorrect: a.isCorrect,
      })),
    });
  } catch (error: any) {
    console.error('Get quiz result error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get quiz result' },
      { status: 400 }
    );
  }
}

