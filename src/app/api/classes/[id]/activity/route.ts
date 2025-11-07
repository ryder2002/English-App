import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const classId = Number(id);
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body?.action as 'start' | 'end' | 'heartbeat' | undefined;
    const clientDuration = typeof body?.durationSeconds === 'number' ? body.durationSeconds : undefined;
    const sessionId = body?.sessionId ? Number(body.sessionId) : undefined;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Ensure the user belongs to the class
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

    if (action === 'start') {
      // Avoid creating duplicate active sessions
      const existing = await prisma.classActivitySession.findFirst({
        where: {
          clazzId: classId,
          userId: user.id,
          endedAt: null,
        },
        orderBy: { startedAt: 'desc' },
      });

      if (existing) {
        return NextResponse.json({ sessionId: existing.id, startedAt: existing.startedAt });
      }

      const session = await prisma.classActivitySession.create({
        data: {
          clazzId: classId,
          userId: user.id,
          startedAt: new Date(),
        },
      });

      return NextResponse.json({ sessionId: session.id, startedAt: session.startedAt });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required for this action' }, { status: 400 });
    }

    const session = await prisma.classActivitySession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
        clazzId: classId,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (action === 'heartbeat') {
      // Optionally update an ongoing session to extend duration tracking
      const now = new Date();
      const computedDuration = Math.max(0, Math.round((now.getTime() - session.startedAt.getTime()) / 1000));
      await prisma.classActivitySession.update({
        where: { id: session.id },
        data: {
          durationSeconds: clientDuration ?? computedDuration,
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'end') {
      if (session.endedAt) {
        return NextResponse.json({ success: true });
      }

      const endedAt = new Date();
      const computedDuration = Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000));
      const durationSeconds = clientDuration !== undefined ? clientDuration : computedDuration;

      await prisma.classActivitySession.update({
        where: { id: session.id },
        data: {
          endedAt,
          durationSeconds,
        },
      });

      return NextResponse.json({ success: true, durationSeconds });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    console.error('Class activity error:', error);
    return NextResponse.json({ error: error.message || 'Error tracking activity' }, { status: 400 });
  }
}
