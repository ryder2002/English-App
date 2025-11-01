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
    const { resultId, score, maxScore, answers } = body;

    if (resultId === undefined || score === undefined || maxScore === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate answers array if provided
    if (answers && !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Answers must be an array' }, { status: 400 });
    }

    const quizId = Number(id);
    
    // Verify quiz exists and is still active
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Verify the result belongs to the user
    const existingResult = await prisma.quizResult.findUnique({
      where: { id: resultId },
      include: {
        user: true,
      },
    });

    if (!existingResult) {
      return NextResponse.json({ error: 'Quiz result not found' }, { status: 404 });
    }

    if (existingResult.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update quiz result and save answer details in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the result
      const updatedResult = await tx.quizResult.update({
        where: { id: resultId },
        data: {
          score,
          maxScore,
          endedAt: new Date(),
          status: 'submitted',
        },
      });

      // Delete existing answer details (in case of resubmission)
      await tx.quizAnswerDetail.deleteMany({
        where: { resultId: resultId },
      });

      // Create new answer details if provided
      if (answers && Array.isArray(answers) && answers.length > 0) {
        await tx.quizAnswerDetail.createMany({
          data: answers.map((answer: any) => ({
            resultId: resultId,
            vocabularyId: answer.vocabularyId,
            questionText: answer.questionText,
            questionType: answer.questionType,
            selectedAnswer: answer.selectedAnswer,
            correctAnswer: answer.correctAnswer,
            isCorrect: answer.isCorrect,
          })),
        });
      }

      return updatedResult;
    });

    // Fetch the complete result with relations
    const completeResult = await prisma.quizResult.findUnique({
      where: { id: resultId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        quiz: true,
        answers: {
          orderBy: { answeredAt: 'asc' },
        },
      },
    });

    return NextResponse.json(completeResult);
  } catch (error: any) {
    console.error('Submit quiz error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit quiz' }, { status: 400 });
  }
}

