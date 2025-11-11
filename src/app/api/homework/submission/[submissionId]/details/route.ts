import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(
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
        const submissionId = parseInt(submissionIdStr, 10);    const submission = await prisma.speakingSubmission.findUnique({
      where: { id: submissionId },
      include: {
        homework: {
          select: {
            speakingText: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Security check: ensure the user is the owner or an admin
    if (submission.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error fetching submission details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
