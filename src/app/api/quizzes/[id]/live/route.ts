import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const quizId = Number(id);

    // Get quiz with class info
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        clazz: {
          include: {
            members: {
              select: { userId: true },
            },
          },
        },
        folder: {
          include: {
            user: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const getQuizStatus = (q: any) => q.status || 'pending';
    const quizStatus = getQuizStatus(quiz);
    const isPaused = (quiz as any).isPaused || false;
    const timePerQuestion = (quiz as any).timePerQuestion || 0;

    // For users: check if they are member of the class
    if (user.role !== 'admin') {
      const isMember = quiz.clazz.members.some(m => m.userId === user.id);
      if (!isMember) {
        return NextResponse.json({ error: 'You are not a member of this class' }, { status: 403 });
      }

      // Get user's quiz result - find in-progress or submitted
      const userResult = await prisma.quizResult.findFirst({
        where: {
          quizId: quizId,
          userId: user.id,
          OR: [
            { status: 'in_progress' },
            { status: 'submitted' },
            { endedAt: null },
          ],
        },
        include: {
          answers: {
            orderBy: { answeredAt: 'asc' },
          },
        },
        orderBy: { startedAt: 'desc' },
      });

      // Get vocabulary for quiz
      const vocabulary = await prisma.vocabulary.findMany({
        where: {
          folder: quiz.folder.name,
          userId: quiz.folder.userId, // Admin's vocabulary
        },
        orderBy: { createdAt: 'asc' },
      });

      // Get direction from quiz, default to en_vi
      const quizDirection = (quiz as any).direction || 'en_vi';
      // Convert en_vi -> en-vi, vi_en -> vi-en, random -> random for frontend
      const directionMap: Record<string, string> = {
        'en_vi': 'en-vi',
        'vi_en': 'vi-en',
        'random': 'random'
      };
      const direction = directionMap[quizDirection] || 'en-vi';

      return NextResponse.json({
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          quizCode: quiz.quizCode,
          status: quizStatus,
          direction: quizDirection, // Keep database format for conversion
          timePerQuestion,
          isPaused,
        },
        vocabulary: vocabulary.map((v: any) => ({
          id: v.id.toString(),
          word: v.word,
          language: v.language,
          vietnameseTranslation: v.vietnameseTranslation,
          folder: v.folder,
          partOfSpeech: v.partOfSpeech || undefined,
          ipa: v.ipa || undefined,
          pinyin: v.pinyin || undefined,
          createdAt: v.createdAt.toISOString(),
          audioSrc: v.audioSrc || undefined,
        })),
        resultId: userResult?.id || null,
        userResult: userResult ? {
          id: userResult.id,
          score: userResult.score,
          maxScore: userResult.maxScore,
          status: userResult.status || (userResult.endedAt ? 'submitted' : 'in_progress'),
          startedAt: userResult.startedAt,
          endedAt: userResult.endedAt,
          answers: userResult.answers || [],
        } : null,
      });
    }

    // For admin: return monitoring data with leaderboard
    if (quiz.clazz.teacherId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const getResultStatus = (r: any) => {
      if (r.status) return r.status;
      if (r.endedAt) return 'submitted';
      return 'in_progress';
    };

    // Get all results with answer details
    const results = await prisma.quizResult.findMany({
      where: { quizId: quizId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        answers: {
          orderBy: { answeredAt: 'asc' },
        },
      },
      orderBy: [
        { score: 'desc' },
        { startedAt: 'asc' },
      ],
    });

    const resultsWithDetails = results.map((r: any) => {
      const answerDetails = r.answers || [];
      const correctAnswers = answerDetails.filter((a: any) => a.isCorrect);
      const incorrectAnswers = answerDetails.filter((a: any) => !a.isCorrect);
      
      // Calculate current streak (consecutive correct answers)
      let currentStreak = 0;
      if (answerDetails.length > 0) {
        // Count backwards from the most recent answer
        for (let i = answerDetails.length - 1; i >= 0; i--) {
          if (answerDetails[i].isCorrect) {
            currentStreak++;
          } else {
            break; // Streak broken
          }
        }
      }
      
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
          answeredAt: a.answeredAt,
        })),
        correctCount: correctAnswers.length,
        incorrectCount: incorrectAnswers.length,
        currentStreak: currentStreak, // Add streak counter
        currentQuestion: r.status === 'in_progress' ? (answerDetails.length > 0 ? answerDetails.length : 0) : (r.maxScore || 0), // Current question number
        maxQuestions: r.maxScore || 0,
      };
    });

    // Calculate leaderboard
    const leaderboard = resultsWithDetails
      .filter(r => r.status === 'submitted' || r.status === 'completed')
      .map(r => ({
        userId: r.userId,
        userName: r.user.name || r.user.email,
        score: r.score,
        maxScore: r.maxScore,
        correctCount: r.correctCount,
        incorrectCount: r.incorrectCount,
        percentage: r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0,
        endedAt: r.endedAt,
      }))
      .sort((a, b) => {
        // Sort by percentage, then by time (faster is better)
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        if (!a.endedAt || !b.endedAt) return 0;
        return new Date(a.endedAt).getTime() - new Date(b.endedAt).getTime();
      });

    // Get direction from quiz for admin view
    const quizDirection = (quiz as any).direction || 'en_vi';

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        quizCode: quiz.quizCode,
        status: quizStatus,
        createdAt: quiz.createdAt,
        direction: quizDirection, // Include direction for admin
        timePerQuestion,
        isPaused,
      },
      results: resultsWithDetails,
      leaderboard,
      totalMembers: quiz.clazz.members.length,
      completedCount: resultsWithDetails.filter(r => r.status === 'submitted' || r.status === 'completed').length,
      inProgressCount: resultsWithDetails.filter(r => r.status === 'in_progress').length,
      notStartedCount: quiz.clazz.members.length - resultsWithDetails.length,
    });
  } catch (error: any) {
    console.error('Live quiz error:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}

