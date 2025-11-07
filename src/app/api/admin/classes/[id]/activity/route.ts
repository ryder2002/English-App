import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

function ensureAdminOrThrow(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '') || req.cookies.get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  return token;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const classId = Number(id);
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clazz = await prisma.clazz.findUnique({
      where: { id: classId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                lastLoginAt: true,
              },
            },
          },
        },
        homeworks: {
          select: { id: true }
        },
        teacher: {
          select: { id: true },
        },
      },
    });

    if (!clazz) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (clazz.teacherId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const memberIds = clazz.members.map((member) => member.userId);

    if (memberIds.length === 0) {
      return NextResponse.json({
        classId,
        totalHomeworks: clazz.homeworks.length,
        members: [],
        summary: {
          totalDurationSeconds: 0,
          totalSessions: 0,
        },
      });
    }

    const sessions = await prisma.classActivitySession.findMany({
      where: {
        clazzId: classId,
        userId: { in: memberIds },
      },
    });

    const submissions = await prisma.homeworkSubmission.findMany({
      where: {
        homework: {
          clazzId: classId,
        },
        userId: { in: memberIds },
      },
      include: {
        homework: {
          select: {
            id: true,
            title: true,
            deadline: true,
          },
        },
      },
    });

    const sessionTotals = sessions.reduce<Record<number, { totalDuration: number; lastActiveAt: Date | null }>>((acc, session) => {
      const duration = session.durationSeconds ?? (session.endedAt ? Math.max(0, Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)) : 0);
      const lastActivity = session.endedAt ?? session.startedAt;
      if (!acc[session.userId]) {
        acc[session.userId] = {
          totalDuration: duration,
          lastActiveAt: lastActivity,
        };
      } else {
        acc[session.userId].totalDuration += duration;
        if (!acc[session.userId].lastActiveAt || acc[session.userId].lastActiveAt < lastActivity) {
          acc[session.userId].lastActiveAt = lastActivity;
        }
      }
      return acc;
    }, {});

    const homeworkTotals = submissions.reduce<Record<number, {
      submitted: number;
      inProgress: number;
      graded: number;
      lastHomeworkActivity: Date | null;
      totalTimeSpent: number;
    }>>((acc, submission) => {
      const entry = acc[submission.userId] || {
        submitted: 0,
        inProgress: 0,
        graded: 0,
        lastHomeworkActivity: null,
        totalTimeSpent: 0,
      };

      if (submission.status === 'submitted') {
        entry.submitted += 1;
      } else if (submission.status === 'graded') {
        entry.graded += 1;
      } else {
        entry.inProgress += 1;
      }

      entry.totalTimeSpent += submission.timeSpentSeconds ?? 0;

      const activityCandidates = [submission.lastActivityAt, submission.submittedAt, submission.updatedAt].filter(Boolean) as Date[];
      const latestActivity = activityCandidates.sort((a, b) => b.getTime() - a.getTime())[0];
      if (latestActivity) {
        if (!entry.lastHomeworkActivity || entry.lastHomeworkActivity < latestActivity) {
          entry.lastHomeworkActivity = latestActivity;
        }
      }

      acc[submission.userId] = entry;
      return acc;
    }, {});

    const totalSessions = sessions.length;
    const totalDurationSeconds = sessions.reduce((total, session) => {
      const duration = session.durationSeconds ?? (session.endedAt ? Math.max(0, Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)) : 0);
      return total + duration;
    }, 0);

    const members = clazz.members.map((member) => {
      const sessionInfo = sessionTotals[member.userId];
      const homeworkInfo = homeworkTotals[member.userId];

      return {
        userId: member.userId,
        memberId: member.id,
        name: member.user.name,
        email: member.user.email,
        lastLoginAt: member.user.lastLoginAt?.toISOString() ?? null,
        lastActiveAt: sessionInfo?.lastActiveAt?.toISOString() ?? null,
        totalDurationSeconds: sessionInfo?.totalDuration ?? 0,
        homework: {
          submitted: homeworkInfo?.submitted ?? 0,
          graded: homeworkInfo?.graded ?? 0,
          inProgress: homeworkInfo?.inProgress ?? 0,
          totalTimeSpentSeconds: homeworkInfo?.totalTimeSpent ?? 0,
          lastHomeworkActivityAt: homeworkInfo?.lastHomeworkActivity?.toISOString() ?? null,
        },
      };
    });

    return NextResponse.json({
      classId,
      totalHomeworks: clazz.homeworks.length,
      members,
      summary: {
        totalDurationSeconds,
        totalSessions,
      },
    });
  } catch (error: any) {
    console.error('Admin class activity error:', error);
    return NextResponse.json({ error: error.message || 'Error fetching activity' }, { status: 400 });
  }
}
