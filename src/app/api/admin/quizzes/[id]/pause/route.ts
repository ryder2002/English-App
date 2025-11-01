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
    const { isPaused } = await request.json();

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

    // Update pause status
    const updated = await prisma.quiz.update({
      where: { id: quizId },
      data: { isPaused: Boolean(isPaused) },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Pause quiz error:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}

