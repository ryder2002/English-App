import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(request: NextRequest, context: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await context.params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a member of the class
    const classMember = await prisma.classMember.findUnique({
      where: {
        clazzId_userId: {
          clazzId: Number(classId),
          userId: user.id,
        },
      },
    });

    if (!classMember) {
      return NextResponse.json({ error: 'You are not a member of this class' }, { status: 403 });
    }

    // Get all homework for this class
    const homework = await prisma.homework.findMany({
      where: {
        clazzId: Number(classId),
      },
      include: {
        clazz: { select: { id: true, name: true } },
        submissions: {
          where: { userId: user.id },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check deadlines and auto-lock expired homework
    const now = new Date();
    const sanitizedHomework = [] as any[];
    for (const hw of homework) {
      if (hw.status === 'active' && new Date(hw.deadline) < now) {
        await prisma.homework.update({
          where: { id: hw.id },
          data: { status: 'locked' }
        });
        hw.status = 'locked';
      }

      const { answerText, ...rest } = hw;
      sanitizedHomework.push(rest);
    }

    return NextResponse.json(sanitizedHomework);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}

