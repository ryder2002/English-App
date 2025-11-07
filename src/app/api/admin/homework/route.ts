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

    // Only get homework where this admin is the teacher of the class
    const homework = await prisma.homework.findMany({ 
      where: {
        clazz: {
          teacherId: user.id,
        },
      },
      include: { 
        clazz: { select: { id: true, name: true, classCode: true } },
        _count: { select: { submissions: true } }
      }, 
      orderBy: { createdAt: 'desc' } 
    });
    return NextResponse.json(homework);
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
    const { title, description, type, clazzId, deadline, audioUrl, answerText, promptText, hideMode, content, answerBoxes } = body;
    
    if (!title || !type || !clazzId || !deadline) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!answerText) {
      return NextResponse.json({ error: 'Answer text is required' }, { status: 400 });
    }

    // Verify the class belongs to this teacher
    const clazz = await prisma.clazz.findUnique({
      where: { id: Number(clazzId) },
    });

    if (!clazz || clazz.teacherId !== user.id) {
      return NextResponse.json({ error: 'Class not found or access denied' }, { status: 403 });
    }

    // Validate type-specific fields
    if (type === 'listening') {
      if (!audioUrl) {
        return NextResponse.json({ error: 'Audio URL is required for listening homework' }, { status: 400 });
      }
    }

    const created = await prisma.homework.create({ 
      data: { 
        title, 
        description: description || null,
        type,
        clazzId: Number(clazzId),
        deadline: new Date(deadline),
        audioUrl: audioUrl || null,
        answerText: answerText || null,
        promptText: promptText || null,
        hideMode: hideMode || 'all',
        content: content || null,
        answerBoxes: Array.isArray(answerBoxes) ? answerBoxes : null,
        status: 'active',
      } 
    });
    
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}

