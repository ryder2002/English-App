import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';
import { assessSpeechTraditional } from '@/ai/flows/assess-speech-traditional';

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
    const { audioUrl, transcript } = await request.json();

    if (!audioUrl) {
      return NextResponse.json({ error: 'audioUrl is required' }, { status: 400 });
    }

    const submission = await prisma.speakingSubmission.findUnique({
      where: { id: submissionId },
      include: { homework: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const referenceText = submission.homework.speakingText;
    if (!referenceText) {
      return NextResponse.json({ error: 'Reference text not found' }, { status: 400 });
    }

    let transcribedText: string;
    
    // Use browser transcript (Speech Recognition API)
    if (transcript && transcript.trim().length > 0) {
      console.log('⚡ Using browser transcript', {
        submissionId,
        userId: user.id,
        transcriptLength: transcript.length
      });
      transcribedText = transcript.trim();
    } else {
      // No transcript available - mark as failed
      console.warn('❌ No transcript provided', {
        submissionId,
        audioUrl,
        userId: user.id
      });
      
      await prisma.speakingSubmission.update({
        where: { id: submissionId },
        data: {
          voiceAnalysis: { 
            status: 'transcription_failed',
            error: 'No transcript provided. Please ensure Speech Recognition is working in your browser.'
          },
        },
      });
      
      return NextResponse.json({ 
        error: 'No transcript provided', 
        details: 'Speech Recognition did not capture any text. Please try again and speak clearly.'
      }, { status: 400 });
    }

    console.log('🤖 Step 2: Assessing pronunciation with traditional comparison...', {
      submissionId,
      referenceText,
      transcribedText
    });

    const assessment = await assessSpeechTraditional(referenceText, transcribedText);
    
    console.log('✅ Assessment completed:', {
      submissionId,
      overallScore: assessment.overallScore,
      accuracyScore: assessment.accuracyScore,
      completenessScore: assessment.completenessScore,
      correctCount: assessment.correctCount,
      incorrectCount: assessment.incorrectCount
    });

    const updatedSubmission = await prisma.speakingSubmission.update({
      where: { id: submissionId },
      data: {
        transcribedText,
        voiceAnalysis: assessment as any,
        score: assessment.overallScore / 100,
        status: 'graded',
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
