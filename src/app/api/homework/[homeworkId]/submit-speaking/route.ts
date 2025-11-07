import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';
import { R2AudioStorage } from '@/lib/r2-storage';

// Enhanced similarity calculation with phonetic matching
function calculateSimilarity(text1: string, text2: string): number {
  const str1 = text1.toLowerCase().trim().replace(/[^\w\s]/g, '');
  const str2 = text2.toLowerCase().trim().replace(/[^\w\s]/g, '');
  
  // Normalize common speech recognition errors
  const normalizeText = (text: string) => {
    return text
      .replace(/\bwon't\b/g, 'will not')
      .replace(/\bcan't\b/g, 'cannot')
      .replace(/\bdont\b/g, 'do not')
      .replace(/\bdoesnt\b/g, 'does not')
      .replace(/\bwont\b/g, 'will not')
      .replace(/\byou're\b/g, 'you are')
      .replace(/\bthey're\b/g, 'they are')
      .replace(/\bwe're\b/g, 'we are')
      .replace(/\bi'm\b/g, 'i am')
      .replace(/\bhe's\b/g, 'he is')
      .replace(/\bshe's\b/g, 'she is')
      .replace(/\bit's\b/g, 'it is')
      .replace(/\bthat's\b/g, 'that is')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const normalizedStr1 = normalizeText(str1);
  const normalizedStr2 = normalizeText(str2);
  
  const words1 = normalizedStr1.split(/\s+/);
  const words2 = normalizedStr2.split(/\s+/);
  
  let matches = 0;
  const maxLength = Math.max(words1.length, words2.length);
  
  for (let i = 0; i < Math.min(words1.length, words2.length); i++) {
    const word1 = words1[i];
    const word2 = words2[i];
    
    if (word1 === word2) {
      matches += 1;
    } else {
      const distance = levenshteinDistance(word1, word2);
      const maxLen = Math.max(word1.length, word2.length);
      
      // More lenient scoring for speech recognition
      if (distance <= 1 && maxLen >= 3) {
        matches += 0.9; // Very close match
      } else if (distance <= 2 && maxLen >= 4) {
        matches += 0.7; // Close match
      } else if (distance <= Math.ceil(maxLen * 0.3)) {
        matches += 0.5; // Partial match
      }
      
      // Check for phonetic similarity (common speech recognition errors)
      if (arePhoneticallySimilar(word1, word2)) {
        matches += 0.8;
      }
    }
  }
  
  return maxLength > 0 ? Math.min(matches / maxLength, 1) : 0;
}

// Check for common phonetic errors in speech recognition
function arePhoneticallySimilar(word1: string, word2: string): boolean {
  const phoneticMap: { [key: string]: string[] } = {
    'to': ['too', 'two'],
    'there': ['their', 'they\'re'],
    'your': ['you\'re'],
    'its': ['it\'s'],
    'than': ['then'],
    'accept': ['except'],
    'affect': ['effect'],
    'brake': ['break'],
    'buy': ['by', 'bye'],
    'hear': ['here'],
    'hour': ['our'],
    'know': ['no'],
    'one': ['won'],
    'right': ['write'],
    'sea': ['see'],
    'week': ['weak'],
    'wood': ['would']
  };
  
  for (const [key, variants] of Object.entries(phoneticMap)) {
    if ((word1 === key && variants.includes(word2)) || 
        (word2 === key && variants.includes(word1)) ||
        (variants.includes(word1) && variants.includes(word2))) {
      return true;
    }
  }
  
  return false;
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
    console.log('🎤 Submit speaking API called');
    const params = await props.params;
    const homeworkId = parseInt(params.homeworkId);
    console.log('HomeworkId:', homeworkId);
    
    const token = request.cookies.get('token')?.value;
    if (!token) {
      console.log('❌ No token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      console.log('❌ Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.log('✅ User authenticated:', user.email);

    const body = await request.json();
    const { audioBase64, transcribedText } = body;
    
    console.log('📦 Request data:', {
      hasAudioBase64: !!audioBase64,
      audioBase64Length: audioBase64?.length || 0,
      transcribedText: transcribedText,
      transcribedTextLength: transcribedText?.length || 0
    });

    if (!audioBase64) {
      console.log('❌ Missing audio data');
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      );
    }

    if (!transcribedText || transcribedText.trim().length === 0) {
      console.log('⚠️ Missing or empty transcribed text, but proceeding with audio only');
      // Allow submission with empty transcription but log it
      // This can happen if speech recognition fails
    }

    // Get homework with optimized query
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: {
        id: true,
        type: true,
        status: true,
        speakingText: true,
        clazz: {
          select: {
            id: true,
            members: {
              where: { userId: user.id },
              select: { userId: true }
            }
          }
        }
      }
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

    // Convert base64 to buffer for R2 upload
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

    console.log(`📤 Uploading audio to R2...`);
    // Upload audio to R2 instead of storing in database
    const audioUrl = await R2AudioStorage.uploadAudio(
      audioBuffer,
      user.id,
      homeworkId,
      attemptNumber
    );
    console.log(`✅ Audio uploaded to R2: ${audioUrl}`);

    // Create submission with audioUrl instead of audioData
    const submission = await prisma.homeworkSubmission.create({
      data: {
        homeworkId,
        userId: user.id,
        attemptNumber,
        status: 'submitted',
        score,
        audioUrl, // Store R2 URL instead of binary data
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
