import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizCode } = await request.json();
    if (!quizCode) {
      return NextResponse.json({ error: 'Quiz code is required' }, { status: 400 });
    }

    // Find quiz by code
    const quiz = await prisma.quiz.findUnique({
      where: { quizCode: String(quizCode).toUpperCase() },
      include: {
        clazz: {
          include: {
            members: {
              where: { userId: user.id },
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

    // Check quiz status
    const quizStatus = (quiz as any).status || 'pending';
    if (quizStatus === 'ended') {
      return NextResponse.json({ error: 'Bài kiểm tra đã kết thúc' }, { status: 400 });
    }
    
    // Allow both pending and active quizzes - pending will go to lobby, active will go to live

    // Check if user is member of the class
    if (quiz.clazz && quiz.clazz.members.length === 0) {
      return NextResponse.json({ error: 'Bạn phải là thành viên của lớp này để làm bài kiểm tra' }, { status: 403 });
    }

    // Check if user already started this quiz
    // For pending quizzes, create a result entry if not exists (user joins lobby)
    // For active quizzes, find existing or create new
    const allUserResults = await prisma.quizResult.findMany({
      where: {
        quizId: quiz.id,
        userId: user.id,
      },
    });
    
    // Find in-progress result (endedAt is null or status is in_progress)
    const existingResult = allUserResults.find(r => {
      const status = (r as any).status;
      return r.endedAt === null || status === 'in_progress';
    });

    if (existingResult) {
      // Return existing quiz session
      return NextResponse.json({
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          quizCode: quiz.quizCode,
          status: quizStatus,
        },
        resultId: existingResult.id,
        startedAt: existingResult.startedAt,
      });
    }
    
    // If pending, create a result entry for lobby (user joins)
    // If active, create result and return immediately

    // Get vocabulary count (only needed for active quizzes)
    let vocabularyCount = 0;
    if (quizStatus === 'active') {
      const vocabulary = await prisma.vocabulary.findMany({
        where: {
          folder: quiz.folder.name,
          userId: quiz.folder.userId,
        },
      });
      vocabularyCount = vocabulary.length;
    }

    // Create new quiz result
    // For pending: status could be 'pending' or just create with in_progress (will be used when quiz starts)
    // For active: status is 'in_progress'
    const resultData: any = {
      quizId: quiz.id,
      userId: user.id,
      score: 0,
      maxScore: vocabularyCount || 0,
    };
    
    // Add status if field exists
    try {
      resultData.status = quizStatus === 'active' ? 'in_progress' : 'in_progress';
    } catch (e) {
      // Field doesn't exist yet, skip it
    }
    
    const result = await prisma.quizResult.create({
      data: resultData,
    });

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        quizCode: quiz.quizCode,
        status: quizStatus,
        vocabularyCount: vocabularyCount,
      },
      resultId: result.id,
      startedAt: result.startedAt,
    });
  } catch (error: any) {
    console.error('Enter quiz code error:', error);
    return NextResponse.json({ error: error.message || 'Failed to enter quiz' }, { status: 400 });
  }
}

