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

    const { homeworkId, audioUrl, transcribedText } = await request.json();

    if (!homeworkId || !audioUrl || !transcribedText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const submission = await prisma.speakingSubmission.create({
      data: {
        homeworkId: parseInt(homeworkId, 10),
        userId: user.id,
        audioUrl,
        transcribedText,
        score: 0, // Initial score, will be updated by AI
        voiceAnalysis: { status: 'processing' }, // Initial status
      },
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
