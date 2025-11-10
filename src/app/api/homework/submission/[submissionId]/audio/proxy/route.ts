import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  try {
    console.log('🔄 Audio proxy called for submission:', context);
    
    const { submissionId } = await context.params;
    const subId = Number(submissionId);
    
    if (Number.isNaN(subId)) {
      return NextResponse.json({ error: 'Invalid submission id' }, { status: 400 });
    }
    
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
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

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check permissions
    const isOwner = submission.userId === user.id;
    const isTeacher = submission.homework?.clazz?.teacherId === user.id;
    const isMember = (submission.homework?.clazz?.members?.length || 0) > 0;
    const isAdmin = user.role === 'admin';
    
    if (!isOwner && !isTeacher && !isMember && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (submission.audioUrl && submission.audioUrl.startsWith('http')) {
      // Fetch the audio from R2 and proxy it
      console.log('🔄 Proxying audio from R2:', submission.audioUrl.substring(0, 100) + '...');
      
      try {
        const audioResponse = await fetch(submission.audioUrl);
        
        if (!audioResponse.ok) {
          throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
        }
        
        const audioBuffer = await audioResponse.arrayBuffer();
        
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/webm',
            'Content-Length': audioBuffer.byteLength.toString(),
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
        
      } catch (fetchError) {
        console.error('💥 Error fetching audio from R2:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 500 });
      }
      
    } else if (submission.audioData) {
      // Serve base64 audio data directly
      console.log('🔄 Serving base64 audio data');
      
      const audioBuffer = Buffer.from(submission.audioData);
      
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/webm',
          'Content-Length': audioBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
      
    } else {
      return NextResponse.json({ error: 'No audio data found' }, { status: 404 });
    }

  } catch (error: any) {
    console.error('💥 Audio proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

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
