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

    // First, check if this is a speaking homework
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: { type: true, clazz: { select: { teacherId: true } } }
    });

    if (!homework) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    // Check ownership first
    if (homework.clazz.teacherId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check speaking submission table if it's a speaking homework
    if (homework.type === 'speaking') {
      const speakingSubmission = await prisma.speakingSubmission.findUnique({
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

      if (!speakingSubmission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }

      if (speakingSubmission.homeworkId !== homeworkId) {
        return NextResponse.json({ error: 'Submission not in this homework' }, { status: 400 });
      }

      return NextResponse.json({
        id: speakingSubmission.id,
        user: speakingSubmission.user,
        homework: {
          id: speakingSubmission.homework.id,
          title: speakingSubmission.homework.title,
          type: speakingSubmission.homework.type,
          speakingText: speakingSubmission.homework.speakingText,
        },
        transcribedText: speakingSubmission.transcribedText,
        audioUrl: speakingSubmission.audioUrl,
        audioDataUrl: speakingSubmission.audioUrl, // For compatibility
        score: speakingSubmission.score,
        voiceAnalysis: speakingSubmission.voiceAnalysis,
        status: speakingSubmission.status,
        attemptNumber: speakingSubmission.attemptNumber,
        submittedAt: speakingSubmission.submittedAt, // Exact submission time
      });
    }

    // Get regular homework submission
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: subId },
      include: {
        homework: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    if (submission.homeworkId !== homeworkId) return NextResponse.json({ error: 'Submission not in this homework' }, { status: 400 });

    // Use audioUrl from R2 if available, fallback to audioData for legacy submissions
    let audioDataUrl: string | undefined;
    if (submission.audioUrl) {
      audioDataUrl = submission.audioUrl;
    } else if (submission.audioData) {
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
        answerBoxes: submission.homework.answerBoxes, // Json array of correct answers for listening
      },
      answer: submission.answer,
      answers: submission.answers, // Array of student answers for listening
      boxResults: submission.boxResults, // Array of true/false for each answer
      transcribedText: submission.transcribedText,
      audioDataUrl,
      audioUrl: submission.audioUrl,
      score: submission.score,
      voiceAnalysis: submission.voiceAnalysis,
      status: submission.status,
      attemptNumber: submission.attemptNumber,
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

    // First, check if this is a speaking homework
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: { type: true, clazz: { select: { teacherId: true } } }
    });

    if (!homework) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    // Check ownership first
    if (homework.clazz.teacherId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check speaking submission table if it's a speaking homework
    if (homework.type === 'speaking') {
      const speakingSubmission = await prisma.speakingSubmission.findUnique({
        where: { id: subId },
        select: { id: true, homeworkId: true }
      });

      if (!speakingSubmission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }

      if (speakingSubmission.homeworkId !== homeworkId) {
        return NextResponse.json({ error: 'Submission not in this homework' }, { status: 400 });
      }

      // Delete the speaking submission
      await prisma.speakingSubmission.delete({
        where: { id: subId }
      });

      return NextResponse.json({ success: true, message: 'Submission deleted successfully' });
    }

    // Check if regular submission exists and belongs to the homework
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: subId },
      select: { id: true, homeworkId: true }
    });

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    if (submission.homeworkId !== homeworkId) return NextResponse.json({ error: 'Submission not in this homework' }, { status: 400 });

    // Delete the submission
    await prisma.homeworkSubmission.delete({
      where: { id: subId }
    });

    return NextResponse.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  }
}
