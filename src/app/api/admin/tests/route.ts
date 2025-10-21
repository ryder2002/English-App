import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

function ensureAdminOrThrow(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '') || req.cookies.get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  return token;
}

export async function GET(request: NextRequest) {
  try {
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const tests = await prisma.quiz.findMany({ include: { clazz: true, folder: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(tests);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { title, description, clazzId, folderId } = body;
    if (!title || !clazzId || !folderId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Generate unique quizCode
    const generateCode = async () => {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      const existing = await prisma.quiz.findUnique({ where: { quizCode: code } });
      if (existing) return generateCode();
      return code;
    };

    const quizCode = await generateCode();

    const created = await prisma.quiz.create({ data: { title, description, quizCode, clazzId, folderId } });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}
