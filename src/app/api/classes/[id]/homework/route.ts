import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const clazzId = Number(id);
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership
    const classMember = await prisma.classMember.findUnique({
      where: {
        clazzId_userId: {
          clazzId,
          userId: user.id,
        },
      },
    });

    if (!classMember) {
      return NextResponse.json({ error: 'You are not a member of this class' }, { status: 403 });
    }

    const homework = await prisma.homework.findMany({
      where: { clazzId },
      include: {
        clazz: { select: { id: true, name: true } },
        submissions: {
          where: { userId: user.id },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const sanitized = [] as any[];
    for (const hw of homework) {
      if (hw.status === 'active' && new Date(hw.deadline) < now) {
        await prisma.homework.update({
          where: { id: hw.id },
          data: { status: 'locked' },
        });
        hw.status = 'locked';
      }

      const { answerText, ...rest } = hw;
      sanitized.push(rest);
    }

    return NextResponse.json(sanitized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}
