import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.R2_REGION!,
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET() {
  return NextResponse.json({ message: 'Ok' });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, homeworkId: string }> }
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

    const { homeworkId: homeworkIdStr } = await params;
    const homeworkId = parseInt(homeworkIdStr, 10);
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob;
    const transcribedText = formData.get('transcribedText') as string;

    if (!audioBlob) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }

    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    const audioKey = `audio-submissions/${user.id}-${homeworkId}-${Date.now()}.webm`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: audioKey,
      Body: audioBuffer,
      ContentType: 'audio/webm',
    });

    await s3Client.send(command);

    const audioUrl = `${process.env.R2_PUBLIC_URL}/${audioKey}`;

    const submission = await prisma.speakingSubmission.create({
      data: {
        homeworkId,
        userId: user.id,
        transcribedText,
        audioUrl,
        score: 0, // Initial score
      },
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: 'Submission successful',
    });
  } catch (error) {
    console.error('Error submitting speaking homework:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
