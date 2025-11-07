import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

// Helper function to calculate similarity score (Levenshtein distance based)
function calculateSimilarity(text1: string, text2: string): number {
  const str1 = text1.toLowerCase().trim();
  const str2 = text2.toLowerCase().trim();
  
  // Simple word-based comparison
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  let matches = 0;
  const maxLength = Math.max(words1.length, words2.length);
  
  for (let i = 0; i < Math.min(words1.length, words2.length); i++) {
    if (words1[i] === words2[i]) {
      matches++;
    } else if (levenshteinDistance(words1[i], words2[i]) <= 2) {
      matches += 0.5; // Partial credit for close matches
    }
  }
  
  return maxLength > 0 ? matches / maxLength : 0;
}

// Levenshtein distance algorithm
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ homeworkId: string }> }
) {
  try {
    const params = await props.params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const homeworkId = parseInt(params.homeworkId);
    const body = await request.json();
    const { audioBase64, transcribedText } = body;

    if (!audioBase64 || !transcribedText) {
      return NextResponse.json(
        { error: 'Audio and transcribed text are required' },
        { status: 400 }
      );
    }

    // Get homework
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        clazz: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!homework) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    if (homework.type !== 'speaking') {
      return NextResponse.json(
        { error: 'This endpoint is for speaking homework only' },
        { status: 400 }
      );
    }

    if (homework.clazz.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this class' },
        { status: 403 }
      );
    }

    if (homework.status === 'locked') {
      return NextResponse.json(
        { error: 'This homework is locked' },
        { status: 403 }
      );
    }

    if (!homework.speakingText) {
      return NextResponse.json(
        { error: 'Speaking text not found' },
        { status: 400 }
      );
    }

    // Calculate score based on text similarity
    const score = calculateSimilarity(homework.speakingText, transcribedText);

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(
      audioBase64.replace(/^data:audio\/\w+;base64,/, ''),
      'base64'
    );

    // Get current attempt number
    const existingSubmissions = await prisma.homeworkSubmission.findMany({
      where: {
        homeworkId,
        userId: user.id,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
      take: 1,
    });

    const attemptNumber = existingSubmissions.length > 0
      ? existingSubmissions[0].attemptNumber + 1
      : 1;

    // Create submission
    const submission = await prisma.homeworkSubmission.create({
      data: {
        homeworkId,
        userId: user.id,
        attemptNumber,
        status: 'submitted',
        score,
        audioData: audioBuffer,
        transcribedText,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        attemptNumber: submission.attemptNumber,
        score: submission.score,
        transcribedText: submission.transcribedText,
        status: submission.status,
      },
    });
  } catch (error: any) {
    console.error('Speaking homework submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
