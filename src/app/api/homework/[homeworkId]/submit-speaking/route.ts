import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';
import { R2AudioStorage } from '@/lib/r2-storage';

// Enhanced similarity calculation - IGNORE ALL PUNCTUATION
function calculateSimilarity(text1: string, text2: string): number {
  // Comprehensive normalization - remove ALL punctuation and special characters
  const normalizeForComparison = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      // Remove ALL punctuation marks: . , ; : ! ? ' " ( ) [ ] { } - _ + = * & ^ % $ # @ ~ ` | \ / < >
      .replace(/[.,;:!?'"(){}\[\]\-_+=*&^%$#@~`|\\/<>]/g, '')
      .replace(/[^\w\s]/g, '') // Remove any remaining special characters
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .trim();
  };
  
  // Normalize contractions and common speech variations
  const normalizeContractions = (text: string) => {
    return text
      // Contractions WITH apostrophe
      .replace(/\bwon't\b/g, 'will not')
      .replace(/\bcan't\b/g, 'cannot')
      .replace(/\bdon't\b/g, 'do not')
      .replace(/\bdoesn't\b/g, 'does not')
      .replace(/\bdidn't\b/g, 'did not')
      .replace(/\byou're\b/g, 'you are')
      .replace(/\bthey're\b/g, 'they are')
      .replace(/\bwe're\b/g, 'we are')
      .replace(/\bi'm\b/g, 'i am')
      .replace(/\bhe's\b/g, 'he is')
      .replace(/\bshe's\b/g, 'she is')
      .replace(/\bit's\b/g, 'it is')
      .replace(/\bthat's\b/g, 'that is')
      .replace(/\bisn't\b/g, 'is not')
      .replace(/\baren't\b/g, 'are not')
      .replace(/\bwasn't\b/g, 'was not')
      .replace(/\bweren't\b/g, 'were not')
      .replace(/\bhaven't\b/g, 'have not')
      .replace(/\bhasn't\b/g, 'has not')
      .replace(/\bhadn't\b/g, 'had not')
      .replace(/\bwouldn't\b/g, 'would not')
      .replace(/\bcouldn't\b/g, 'could not')
      .replace(/\bshouldn't\b/g, 'should not')
      
      // Contractions WITHOUT apostrophe (speech recognition often misses apostrophes)
      .replace(/\bwont\b/g, 'will not')
      .replace(/\bcant\b/g, 'cannot')
      .replace(/\bdont\b/g, 'do not')
      .replace(/\bdoesnt\b/g, 'does not')
      .replace(/\bdidnt\b/g, 'did not')
      .replace(/\byoure\b/g, 'you are')
      .replace(/\btheyre\b/g, 'they are')
      .replace(/\bwere\b/g, 'we are') // Common misheard "we're"
      .replace(/\bim\b/g, 'i am')
      .replace(/\bhes\b/g, 'he is')
      .replace(/\bshes\b/g, 'she is')
      .replace(/\bits\b/g, 'it is')
      .replace(/\bthats\b/g, 'that is')
      .replace(/\bisnt\b/g, 'is not')
      .replace(/\barent\b/g, 'are not')
      .replace(/\bwasnt\b/g, 'was not')
      .replace(/\bwerent\b/g, 'were not')
      .replace(/\bhavent\b/g, 'have not')
      .replace(/\bhasnt\b/g, 'has not')
      .replace(/\bhadnt\b/g, 'had not')
      .replace(/\bwouldnt\b/g, 'would not')
      .replace(/\bcouldnt\b/g, 'could not')
      .replace(/\bshouldnt\b/g, 'should not')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  // Apply all normalizations
  let str1 = normalizeForComparison(text1);
  let str2 = normalizeForComparison(text2);
  
  str1 = normalizeContractions(str1);
  str2 = normalizeContractions(str2);
  
  console.log('🔍 Text comparison (ignoring punctuation):');
  console.log(`  📝 Original: "${text1}"`);
  console.log(`  📝 Transcribed: "${text2}"`);
  console.log(`  ✨ Normalized original: "${str1}"`);
  console.log(`  ✨ Normalized transcribed: "${str2}"`);
  
  // Perfect match after normalization
  if (str1 === str2) {
    console.log('  🎉 PERFECT MATCH after removing punctuation!');
    return 1.0;
  }
  
  const normalizedStr1 = str1;
  const normalizedStr2 = str2;
  
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

    // Import intelligent speech processor
    const { IntelligentSpeechProcessor } = await import('@/lib/intelligent-speech-processor');
    
    // Calculate enhanced score using intelligent processor
    const score = IntelligentSpeechProcessor.calculateAdvancedSimilarity(
      homework.speakingText, 
      transcribedText
    );
    
    // Process the speech result for additional insights
    const processedResult = IntelligentSpeechProcessor.processSpeechResult(
      transcribedText,
      homework.speakingText
    );
    
    console.log('🎯 Enhanced scoring result:', {
      originalScore: score,
      processedConfidence: processedResult.confidence,
      suggestions: processedResult.suggestions
    });

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
