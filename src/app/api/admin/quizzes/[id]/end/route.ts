import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

function ensureAdminOrThrow(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '') || req.cookies.get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  return token;
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const quizId = Number(id);

    // Get quiz and verify ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        clazz: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (quiz.clazz.teacherId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check quiz status - only allow ending active quizzes
    const currentStatus = (quiz as any).status || 'pending';
    if (currentStatus === 'pending') {
      return NextResponse.json({ error: 'Cannot end a quiz that has not been started' }, { status: 400 });
    }
    if (currentStatus === 'ended') {
      return NextResponse.json({ error: 'Quiz is already ended' }, { status: 400 });
    }

    // End the quiz
    const updateData: any = {
      endedAt: new Date(),
    };
    
    // Add status if field exists
    try {
      updateData.status = 'ended';
    } catch (e) {
      // Field doesn't exist yet
    }
    
    const updated = await prisma.quiz.update({
      where: { id: quizId },
      data: updateData,
    });

    // Auto-submit all in-progress results (by null endedAt for backward compatibility)
    const resultUpdateData: any = {
      endedAt: new Date(),
    };
    
    try {
      resultUpdateData.status = 'submitted';
    } catch (e) {
      // Field doesn't exist yet
    }
    
    await prisma.quizResult.updateMany({
      where: {
        quizId: quizId,
        OR: [
          { endedAt: null },
          // @ts-ignore - status may not exist  
          { status: 'in_progress' },
        ],
      },
      data: resultUpdateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('End quiz error:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}

