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

    // Only get classes where this admin is the teacher
    const classes = await prisma.clazz.findMany({
      where: { teacherId: user.id },
      include: { teacher: { select: { id: true, email: true } }, members: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(classes);
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
    const { name, description } = body;
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    // Generate unique classCode
    const generateCode = async () => {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      const existing = await prisma.clazz.findUnique({ where: { classCode: code } });
      if (existing) return generateCode();
      return code;
    };

    const classCode = await generateCode();

    const created = await prisma.clazz.create({
      data: {
        name,
        description,
        classCode,
        teacherId: user.id
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}
