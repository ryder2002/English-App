import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { AuthService } from '@/lib/services/auth-service';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    const homeworkId = formData.get('homeworkId') as string;
    
    if (!file || !homeworkId) {
      return NextResponse.json({ 
        error: 'Missing required fields: audio and homeworkId' 
      }, { status: 400 });
    }

    console.log('📤 Uploading audio via server proxy...', {
      userId: user.id,
      homeworkId,
      fileSize: file.size,
      fileType: file.type,
    });

    // Generate unique filename
    const timestamp = Date.now();
    const key = `audio-submissions/${user.id}-${homeworkId}-${timestamp}.webm`;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type || 'audio/webm',
      })
    );

    // Generate signed URL for AI to access (valid for 1 hour)
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      }),
      { expiresIn: 3600 } // 1 hour
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    console.log('✅ Audio uploaded successfully:', { 
      publicUrl,
      signedUrl: signedUrl.substring(0, 100) + '...' 
    });

    return NextResponse.json({ 
      success: true, 
      audioUrl: signedUrl, // Use signed URL for AI processing
      publicUrl, // Keep public URL for reference (may not work if bucket is private)
      message: 'Audio uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Server proxy upload failed:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
