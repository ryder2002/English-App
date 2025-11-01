import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { classCode } = await request.json();
    if (!classCode) {
      return NextResponse.json({ error: 'Class code is required' }, { status: 400 });
    }

    // Find class by code
    const clazz = await prisma.clazz.findUnique({
      where: { classCode: String(classCode).toUpperCase() },
    });

    if (!clazz) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.classMember.findUnique({
      where: {
        clazzId_userId: {
          clazzId: clazz.id,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this class' }, { status: 400 });
    }

    // Add user to class
    const member = await prisma.classMember.create({
      data: {
        clazzId: clazz.id,
        userId: user.id,
      },
      include: {
        clazz: {
          include: {
            teacher: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(member.clazz, { status: 201 });
  } catch (error: any) {
    console.error('Join class error:', error);
    return NextResponse.json({ error: error.message || 'Failed to join class' }, { status: 400 });
  }
}

