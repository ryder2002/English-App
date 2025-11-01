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

    // Get quiz status safely (may not exist in DB yet)
    const currentStatus = (quiz as any).status || 'pending';
    
    // Only allow starting if quiz is pending
    if (currentStatus !== 'pending') {
      return NextResponse.json({ error: 'Quiz can only be started when it is pending' }, { status: 400 });
    }

    // Start the quiz - set status to active
    const updateData: any = {
      status: 'active',
    };
    
    const updated = await prisma.quiz.update({
      where: { id: quizId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Start quiz error:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}

