import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';
import { assessSpeech } from '@/ai/flows/speech-assessment';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { submissionId: submissionIdStr } = await params;
    const submissionId = parseInt(submissionIdStr, 10);
    const { audioUrl, transcribedText } = await request.json();

    if (!audioUrl || !transcribedText) {
      return NextResponse.json({ error: 'audioUrl and transcribedText are required' }, { status: 400 });
    }

    // Find the original homework to get the reference text
    const submission = await prisma.speakingSubmission.findUnique({
      where: { id: submissionId },
      include: { homework: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const referenceText = submission.homework.speakingText;
    if (!referenceText) {
      return NextResponse.json({ error: 'Reference text not found for this homework' }, { status: 400 });
    }

    // Call AI for assessment
    const assessment = await assessSpeech(referenceText, transcribedText);

    // Update submission with AI results
    const updatedSubmission = await prisma.speakingSubmission.update({
      where: { id: submissionId },
      data: {
        voiceAnalysis: assessment as any,
        score: assessment.overallScore,
      },
    });

    return NextResponse.json({
      success: true,
      assessment,
      submission: updatedSubmission,
    });

  } catch (error) {
    console.error('Error processing AI assessment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
