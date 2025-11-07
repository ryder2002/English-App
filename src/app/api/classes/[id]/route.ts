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

    const classId = Number(id);

    // First check if user is a member
    const membership = await prisma.classMember.findUnique({
      where: {
        clazzId_userId: {
          clazzId: classId,
          userId: user.id,
        },
      },
    });
    
    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this class' }, { status: 403 });
    }

    // Optimized class details query - only essential data
    const clazz = await prisma.clazz.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        description: true,
        classCode: true,
        teacher: {
          select: { id: true, email: true, name: true },
        },
        quizzes: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            quizCode: true,
            status: true,
            createdAt: true,
            folder: {
              select: { id: true, name: true },
            },
          },
        },
        members: {
          select: {
            id: true,
            joinedAt: true,
            user: {
              select: { id: true, email: true, name: true },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        _count: {
          select: { members: true, quizzes: true },
        },
      },
    });

    if (!clazz) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json(clazz);
  } catch (error: any) {
    console.error('Get class detail error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get class details' }, { status: 400 });
  }
}

