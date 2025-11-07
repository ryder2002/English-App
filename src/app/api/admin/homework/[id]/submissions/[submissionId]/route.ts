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
        homework: { 
          include: { 
            clazz: true 
          }
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    if (submission.homeworkId !== homeworkId) return NextResponse.json({ error: 'Submission not in this homework' }, { status: 400 });

    // Ownership: only teacher of the class can view
    if (submission.homework.clazz.teacherId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Convert audio data to base64 URL if exists
    let audioDataUrl: string | undefined;
    if (submission.audioData) {
      const base64 = Buffer.from(submission.audioData).toString('base64');
      audioDataUrl = `data:audio/webm;base64,${base64}`;
    }

    return NextResponse.json({
      id: submission.id,
      user: submission.user,
      homework: {
        id: submission.homework.id,
        title: submission.homework.title,
        type: submission.homework.type,
        speakingText: submission.homework.speakingText,
      },
      answer: submission.answer,
      transcribedText: submission.transcribedText,
      audioDataUrl,
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

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; submissionId: string }> }) {
  try {
    const { id, submissionId } = await context.params;
    const token = ensureToken(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const homeworkId = Number(id);
    const subId = Number(submissionId);

    // Check if submission exists and belongs to the homework
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: subId },
      include: {
        homework: {
          include: {
            clazz: true
          }
        }
      }
    });

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    if (submission.homeworkId !== homeworkId) return NextResponse.json({ error: 'Submission not in this homework' }, { status: 400 });

    // Ownership: only teacher of the class can delete
    if (submission.homework.clazz.teacherId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Delete the submission
    await prisma.homeworkSubmission.delete({
      where: { id: subId }
    });

    return NextResponse.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}
