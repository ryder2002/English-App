import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get classes where user is a member
    const memberships = await prisma.classMember.findMany({
      where: { userId: user.id },
      include: {
        clazz: {
          include: {
            teacher: {
              select: { id: true, email: true, name: true },
            },
            quizzes: {
              // Get all quizzes, not just active ones
              select: {
                id: true,
                title: true,
                quizCode: true,
                status: true,
              },
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const classes = memberships.map((m) => ({
      ...m.clazz,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json(classes);
  } catch (error: any) {
    console.error('Get my classes error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get classes' }, { status: 400 });
  }
}

