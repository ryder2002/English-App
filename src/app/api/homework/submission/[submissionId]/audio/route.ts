import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const submissionId = parseInt(params.submissionId);
    
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
      where: { id: submissionId },
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

    // Check if user is owner or teacher
    const isOwner = submission.userId === user.id;
    const isTeacher = submission.homework.clazz.teacherId === user.id;
    const isMember = submission.homework.clazz.members.length > 0;
    
    if (!isOwner && !isTeacher && !isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return audio URL or base64 data
    if (submission.audioUrl) {
      // New R2 URL - return direct URL
      return NextResponse.json({
        success: true,
        audioUrl: submission.audioUrl,
        type: 'url'
      });
    } else if (submission.audioData) {
      // Legacy base64 conversion
      const base64 = Buffer.from(submission.audioData).toString('base64');
      const audioDataUrl = `data:audio/webm;base64,${base64}`;
      
      return NextResponse.json({
        success: true,
        audioUrl: audioDataUrl,
        type: 'base64'
      });
    } else {
      return NextResponse.json({ 
        error: 'No audio data found for this submission' 
      }, { status: 404 });
    }

  } catch (error: any) {
    console.error('Audio playback error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
