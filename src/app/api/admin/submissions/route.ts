import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Admin getting user submission history...');
    
    // Authentication check
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await AuthService.verifyToken(token);
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const homeworkId = searchParams.get('homeworkId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query filters
    const where: any = {};
    if (userId) where.userId = parseInt(userId);
    if (homeworkId) where.homeworkId = parseInt(homeworkId);

    // Add filter for speaking homework only
    const speakingWhere = {
      ...where,
      homework: {
        type: 'speaking'
      }
    };

    // Get submissions with full details (using HomeworkSubmission for now)
    const submissions = await prisma.homeworkSubmission.findMany({
      where: speakingWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        homework: {
          select: {
            id: true,
            title: true,
            speakingText: true,
            type: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count
    const totalCount = await prisma.homeworkSubmission.count({ where: speakingWhere });

    // Format response with additional details
    const formattedSubmissions = submissions.map((submission: any) => ({
      id: submission.id,
      user: {
        id: submission.user.id,
        name: submission.user.name,
        email: submission.user.email
      },
      homework: {
        id: submission.homework.id,
        title: submission.homework.title,
        speakingText: submission.homework.speakingText
      },
      transcribedText: submission.transcribedText,
      score: submission.score,
      audioUrl: submission.audioUrl,
      voiceAnalysis: submission.answers, // Use answers field to store voice analysis
      submittedAt: submission.submittedAt,
      metadata: {
        audioSize: submission.audioUrl ? 'Available' : 'N/A',
        hasTranscription: !!submission.transcribedText,
        hasAIAnalysis: !!submission.answers,
        method: submission.answers?.method || 'ai-enhanced'
      }
    }));

    console.log(`✅ Retrieved ${submissions.length} submissions for admin`);

    return NextResponse.json({
      success: true,
      submissions: formattedSubmissions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + submissions.length < totalCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('💥 Admin submission history error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to retrieve submission history',
      success: false
    }, { status: 500 });
  }
}

// Get detailed submission info including audio
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Admin getting detailed submission...');
    
    // Authentication check
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await AuthService.verifyToken(token);
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ 
        error: 'Submission ID required' 
      }, { status: 400 });
    }

    // Get detailed submission (using HomeworkSubmission)
    const submission = await prisma.homeworkSubmission.findUnique({
      where: {
        id: parseInt(submissionId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        },
        homework: {
          select: {
            id: true,
            title: true,
            speakingText: true,
            type: true,
            createdAt: true
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ 
        error: 'Submission not found' 
      }, { status: 404 });
    }

    // Parse voice analysis if exists (stored in answers field)
    let analysisDetails = null;
    if (submission.answers) {
      try {
        analysisDetails = typeof submission.answers === 'string' 
          ? JSON.parse(submission.answers)
          : submission.answers;
      } catch (e) {
        console.warn('Failed to parse voice analysis:', e);
      }
    }

    const detailedSubmission = {
      id: submission.id,
      user: submission.user,
      homework: submission.homework,
      transcribedText: submission.transcribedText,
      score: submission.score,
      audioUrl: submission.audioUrl,
      submittedAt: submission.submittedAt,
      analysis: {
        raw: analysisDetails,
        method: analysisDetails?.method || 'basic',
        overallScore: analysisDetails?.assessment?.overallScore || submission.score,
        accuracy: analysisDetails?.assessment?.accuracy || null,
        fluency: analysisDetails?.assessment?.fluency || null,
        completeness: analysisDetails?.assessment?.completeness || null,
        prosody: analysisDetails?.assessment?.prosody || null,
        feedback: analysisDetails?.assessment?.feedback || [],
        suggestions: analysisDetails?.assessment?.suggestions || [],
        wordAssessments: analysisDetails?.assessment?.wordAssessments || []
      },
      statistics: {
        wordsSpoken: submission.transcribedText?.split(' ').length || 0,
        originalWords: submission.homework.speakingText?.split(' ').length || 0,
        completionRate: submission.transcribedText && submission.homework.speakingText
          ? Math.round((submission.transcribedText.split(' ').length / submission.homework.speakingText.split(' ').length) * 100)
          : 0
      }
    };

    console.log(`✅ Retrieved detailed submission ${submissionId} for admin`);

    return NextResponse.json({
      success: true,
      submission: detailedSubmission,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('💥 Admin detailed submission error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to retrieve detailed submission',
      success: false
    }, { status: 500 });
  }
}
