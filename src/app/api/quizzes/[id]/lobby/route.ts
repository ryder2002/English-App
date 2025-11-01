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
              include: {
                user: {
                  select: { id: true, email: true, name: true },
                },
              },
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

    // Check access
    if (user.role === 'admin') {
      // Admin must own the class
      if (quiz.clazz.teacherId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      // Users must be members
      const isMember = quiz.clazz.members.some(m => m.userId === user.id);
      if (!isMember) {
        return NextResponse.json({ error: 'You are not a member of this class' }, { status: 403 });
      }
    }

    // Get all quiz results (users who have entered the quiz)
    const quizResults = await prisma.quizResult.findMany({
      where: { quizId: quizId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    // Get unique users who have joined (started a quiz result)
    const joinedUserIds = new Set(quizResults.map(r => r.userId));
    const joinedMembers = quiz.clazz.members
      .filter(m => joinedUserIds.has(m.userId))
      .map(m => {
        const result = quizResults.find(r => r.userId === m.userId);
        return {
          userId: m.userId,
          userName: m.user.name || m.user.email,
          joinedAt: result?.startedAt || m.joinedAt,
        };
      })
      .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

    // For admin: can start if there's at least 1 member joined
    // For users: just show status
    const canStart = user.role === 'admin' && quizStatus === 'pending' && joinedMembers.length > 0;

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        quizCode: quiz.quizCode,
        status: quizStatus,
      },
      joinedMembers,
      totalMembers: quiz.clazz.members.length,
      canStart,
    });
  } catch (error: any) {
    console.error('Lobby error:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}

