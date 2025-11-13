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
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { homeworkId, audioUrl } = await request.json();

    if (!homeworkId || !audioUrl) {
      return NextResponse.json({ error: 'Missing required fields: homeworkId and audioUrl' }, { status: 400 });
    }

    console.log('📝 Creating speaking submission...', {
      homeworkId,
      userId: user.id,
      audioUrl: audioUrl.substring(0, 50) + '...'
    });

    // Count existing submissions for this homework by this user
    const existingCount = await prisma.speakingSubmission.count({
      where: {
        homeworkId: parseInt(homeworkId, 10),
        userId: user.id,
      },
    });

    const attemptNumber = existingCount + 1;

    const submission = await prisma.speakingSubmission.create({
      data: {
        homeworkId: parseInt(homeworkId, 10),
        userId: user.id,
        audioUrl,
        transcribedText: '', // Will be filled by AI transcription
        score: 0, // Will be updated after AI assessment
        voiceAnalysis: { status: 'processing' } as any,
        attemptNumber,
        submittedAt: new Date(), // IMPORTANT: Set exact submission time
      },
    });

    console.log('✅ Submission created:', {
      submissionId: submission.id,
      attemptNumber,
      submittedAt: submission.submittedAt
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: 'Submission created successfully. AI analysis will begin shortly.',
    });

  } catch (error) {
    console.error('Error creating speaking submission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
