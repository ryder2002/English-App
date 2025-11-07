import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

function ensureToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '') || req.cookies.get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  return token;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string; submissionId: string }> }) {
  try {
    const { id, submissionId } = await context.params;
    const token = ensureToken(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const homeworkId = Number(id);
    const subId = Number(submissionId);

    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: subId },
      include: {
        homework: { include: { clazz: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    if (submission.homeworkId !== homeworkId) return NextResponse.json({ error: 'Submission not in this homework' }, { status: 400 });

    // Ownership: only teacher of the class can view
    if (submission.homework.clazz.teacherId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json({
      id: submission.id,
      user: submission.user,
      answer: submission.answer,
      score: submission.score,
      status: submission.status,
      startedAt: submission.startedAt,
      submittedAt: submission.submittedAt,
      lastActivityAt: submission.lastActivityAt,
      timeSpentSeconds: submission.timeSpentSeconds,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}
