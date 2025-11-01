import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

function ensureAdminOrThrow(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '') || req.cookies.get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  return token;
}

// Next.js 15 App Router: Handler signature must match spec
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const clazzId = Number(id);
    const clazz = await prisma.clazz.findUnique({
      where: { id: clazzId },
      include: {
        teacher: {
          select: { id: true, email: true, name: true }
        },
        members: { 
          include: { 
            user: {
              select: { id: true, email: true, name: true }
            }
          } 
        },
        quizzes: true, // Get all fields to handle cases where status might not exist yet
        _count: {
          select: {
            members: true,
            quizzes: true
          }
        }
      }
    });
    if (!clazz) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    // Verify this admin owns this class
    if (clazz.teacherId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Format the response to match the interface
    const formatted = {
      id: clazz.id,
      name: clazz.name,
      description: clazz.description,
      classCode: clazz.classCode,
      teacherId: clazz.teacherId,
      createdAt: clazz.createdAt.toISOString(),
      quizzes: clazz.quizzes.map((q: any) => ({
        id: q.id,
        title: q.title,
        quizCode: q.quizCode,
        status: (q.status || (q.endedAt ? 'ended' : 'active')) as string
      })),
      members: clazz.members.map(m => ({
        id: m.id,
        userId: m.userId,
        user: {
          id: m.user.id,
          email: m.user.email,
          name: m.user.name
        },
        joinedAt: m.joinedAt.toISOString()
      })),
      _count: clazz._count
    };
    
    return NextResponse.json(formatted);
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

    const clazzId = Number(id);
    const body = await request.json();
    const { name, description } = body;
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const updated = await prisma.clazz.update({ where: { id: clazzId }, data: { name, description } });
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

    const clazzId = Number(id);
    await prisma.clazz.delete({ where: { id: clazzId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}
