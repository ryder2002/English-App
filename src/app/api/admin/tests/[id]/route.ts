import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

function ensureAdminOrThrow(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '') || req.cookies.get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  return token;
}

// Next.js 15 expects context.params to be a Promise<{ id: string }>
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const quizId = Number(id);
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { clazz: true, folder: true, results: { include: { user: true } } }
    });
    if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(quiz);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const quizId = Number(id);
    
    // Get quiz and verify ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { clazz: true },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (quiz.clazz.teacherId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, clazzId, folderId } = body;
    if (!title || !clazzId || !folderId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const updated = await prisma.quiz.update({ 
      where: { id: quizId }, 
      data: { title, description, clazzId, folderId },
      include: { clazz: true, folder: true }
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const quizId = Number(id);
    
    // Get quiz and verify ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { clazz: true },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (quiz.clazz.teacherId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.quiz.delete({ where: { id: quizId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}
