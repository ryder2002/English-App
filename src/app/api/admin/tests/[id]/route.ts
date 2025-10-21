import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

function ensureAdminOrThrow(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '') || req.cookies.get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  return token;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const id = Number(params.id);
    const quiz = await prisma.quiz.findUnique({ where: { id }, include: { clazz: true, folder: true, results: { include: { user: true } } } });
    if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(quiz);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const id = Number(params.id);
    const body = await request.json();
    const { title, description, clazzId, folderId } = body;
    if (!title || !clazzId || !folderId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const updated = await prisma.quiz.update({ where: { id }, data: { title, description, clazzId, folderId } });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const id = Number(params.id);
    await prisma.quiz.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}
