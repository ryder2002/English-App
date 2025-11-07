import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ homeworkId: string; submissionId: string }> }
) {
  try {
    const { homeworkId, submissionId } = await context.params;
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hwId = Number(homeworkId);
    const subId = Number(submissionId);

    // Get submission with homework details
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: subId },
      include: {
        homework: {
          select: {
            id: true,
            title: true,
            type: true,
            speakingText: true,
            deadline: true,
            status: true,
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Verify ownership
    if (submission.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (submission.homeworkId !== hwId) {
      return NextResponse.json({ error: 'Submission not in this homework' }, { status: 400 });
    }

    // Convert audio data to base64 URL if exists
    let audioDataUrl: string | undefined;
    if (submission.audioData) {
      const base64 = Buffer.from(submission.audioData).toString('base64');
      audioDataUrl = `data:audio/webm;base64,${base64}`;
    }

    return NextResponse.json({
      id: submission.id,
      homework: {
        id: submission.homework.id,
        title: submission.homework.title,
        type: submission.homework.type,
        speakingText: submission.homework.speakingText,
        deadline: submission.homework.deadline,
        status: submission.homework.status,
      },
      answer: submission.answer,
      transcribedText: submission.transcribedText,
      audioDataUrl,
      score: submission.score,
      status: submission.status,
      attemptNumber: submission.attemptNumber,
      startedAt: submission.startedAt,
      submittedAt: submission.submittedAt,
      timeSpentSeconds: submission.timeSpentSeconds,
    });
  } catch (error: any) {
    console.error('Get submission detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
