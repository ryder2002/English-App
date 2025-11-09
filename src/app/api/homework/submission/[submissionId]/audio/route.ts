import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  try {
    console.log('🎵 Audio API called for submission:', context);
    
    const { submissionId } = await context.params;
    const subId = Number(submissionId);
    
    console.log('📝 Parsed submission ID:', subId);
    
    if (Number.isNaN(subId)) {
      console.error('❌ Invalid submission ID:', submissionId);
      return NextResponse.json({ error: 'Invalid submission id' }, { status: 400 });
    }
    
    const token = request.cookies.get('token')?.value;
    console.log('🔑 Token found:', !!token);
    
    if (!token) {
      console.error('❌ No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    console.log('👤 User verified:', user?.id);
    
    if (!user) {
      console.error('❌ Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get submission with authorization check
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: subId },
      include: {
        homework: {
          include: {
            clazz: {
              include: {
                members: { where: { userId: user.id } }
              }
            }
          }
        }
      }
    });

    console.log('📄 Submission found:', !!submission);
    
    if (!submission) {
      console.error('❌ Submission not found for ID:', subId);
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if user is owner or teacher
    const isOwner = submission.userId === user.id;
    const isTeacher = submission.homework?.clazz?.teacherId === user.id;
    const isMember = (submission.homework?.clazz?.members?.length || 0) > 0;
    
    console.log('🔐 Access check:', { isOwner, isTeacher, isMember, userId: user.id, submissionUserId: submission.userId });
    
    if (!isOwner && !isTeacher && !isMember) {
      console.error('❌ Access denied for user:', user.id);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return audio URL or base64 data
    console.log('🎵 Audio data check:', { 
      hasAudioUrl: !!submission.audioUrl, 
      hasAudioData: !!submission.audioData,
      audioUrlType: typeof submission.audioUrl,
      audioDataType: typeof submission.audioData 
    });
    
    if (submission.audioUrl) {
      // New R2 URL - return direct URL
      console.log('✅ Returning R2 audio URL:', submission.audioUrl.substring(0, 100) + '...');
      
      const response = NextResponse.json({
        success: true,
        audioUrl: submission.audioUrl,
        type: 'url'
      });
      
      // Add CORS headers for audio playback
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
      
    } else if (submission.audioData) {
      // Legacy base64 conversion
      console.log('✅ Converting audioData to base64, size:', submission.audioData.length);
      
      const base64 = Buffer.from(submission.audioData).toString('base64');
      const audioDataUrl = `data:audio/webm;base64,${base64}`;
      
      console.log('✅ Base64 audio URL created, length:', audioDataUrl.length);
      
      const response = NextResponse.json({
        success: true,
        audioUrl: audioDataUrl,
        type: 'base64'
      });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
      
    } else {
      console.error('❌ No audio data found for submission:', subId);
      return NextResponse.json({ 
        error: 'No audio data found for this submission' 
      }, { status: 404 });
    }

  } catch (error: any) {
    console.error('💥 Audio API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
