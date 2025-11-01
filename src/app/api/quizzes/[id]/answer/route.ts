import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { resultId, answer } = body;

    if (!resultId || !answer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const quizId = Number(id);

    // Verify quiz exists and is active
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const quizStatus = (quiz as any).status || 'pending';
    if (quizStatus !== 'active') {
      return NextResponse.json({ error: 'Quiz is not active' }, { status: 400 });
    }

    // Verify the result belongs to the user
    const existingResult = await prisma.quizResult.findUnique({
      where: { id: resultId },
      include: {
        answers: {
          orderBy: { answeredAt: 'asc' },
        },
      },
    });

    if (!existingResult) {
      return NextResponse.json({ error: 'Quiz result not found' }, { status: 404 });
    }

    if (existingResult.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Save the answer detail
    const answerDetail = await prisma.quizAnswerDetail.create({
      data: {
        resultId: resultId,
        vocabularyId: answer.vocabularyId,
        questionText: answer.questionText,
        questionType: answer.questionType,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
      },
    });

    // Update score in real-time
    const allAnswers = [...existingResult.answers, answerDetail];
    const correctCount = allAnswers.filter((a: any) => a.isCorrect).length;
    const currentScore = correctCount;

    await prisma.quizResult.update({
      where: { id: resultId },
      data: {
        score: currentScore,
      },
    });

    return NextResponse.json({
      success: true,
      answer: answerDetail,
      currentScore,
      totalAnswers: allAnswers.length,
    });
  } catch (error: any) {
    console.error('Submit answer error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit answer' }, { status: 400 });
  }
}

