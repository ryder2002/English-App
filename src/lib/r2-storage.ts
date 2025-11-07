import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

// Load environment variables (for scripts)
if (typeof window === 'undefined') {
  dotenv.config({ path: '.env.local' });
}

// R2 Client Configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export class R2AudioStorage {
  private static bucketName = process.env.R2_BUCKET_NAME || 'cnenglishaudio';
  private static publicDomain = process.env.R2_PUBLIC_DOMAIN; // Optional custom domain

  /**
   * Upload audio file to R2
   */
  static async uploadAudio(
    audioBuffer: Buffer,
    userId: number,
    homeworkId: number,
    attemptNumber: number
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const filename = `audio/${userId}/${homeworkId}/attempt_${attemptNumber}_${timestamp}.webm`;
      
      console.log(`📤 Uploading audio to R2: ${filename}`);
      console.log(`📊 Audio size: ${audioBuffer.length} bytes`);

      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filename,
        Body: audioBuffer,
        ContentType: 'audio/webm',
        CacheControl: 'public, max-age=31536000', // 1 year cache
        // Optional: Add metadata
        Metadata: {
          userId: userId.toString(),
          homeworkId: homeworkId.toString(),
          attemptNumber: attemptNumber.toString(),
          uploadedAt: new Date().toISOString(),
        }
      });

      await r2Client.send(uploadCommand);

      // Return public URL (remove hyphens from account ID for pub domain)
      const publicUrl = this.publicDomain 
        ? `https://${this.publicDomain}/${filename}`
        : `https://pub-${process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/-/g, '')}.r2.dev/${filename}`;

      console.log(`✅ Audio uploaded successfully: ${publicUrl}`);
      return publicUrl;

    } catch (error) {
      console.error('❌ R2 upload error:', error);
      throw new Error(`Failed to upload audio to R2: ${error}`);
    }
  }

  /**
   * Delete audio file from R2
   */
  static async deleteAudio(audioUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      const urlParts = audioUrl.split('/');
      const filenameIndex = urlParts.findIndex(part => part === 'audio');
      const filename = urlParts.slice(filenameIndex).join('/');

      console.log(`🗑️ Deleting audio from R2: ${filename}`);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filename,
      });

      await r2Client.send(deleteCommand);
      console.log(`✅ Audio deleted successfully: ${filename}`);

    } catch (error) {
      console.error('❌ R2 delete error:', error);
      throw new Error(`Failed to delete audio from R2: ${error}`);
    }
  }

  /**
   * Generate presigned URL for secure access (optional)
   */
  static async getPresignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filename,
      });

      const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn });
      return presignedUrl;

    } catch (error) {
      console.error('❌ R2 presigned URL error:', error);
      throw new Error(`Failed to generate presigned URL: ${error}`);
    }
  }

  /**
   * Test R2 connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing R2 connection...');
      
      // Test upload
      const testBuffer = Buffer.from('test-audio-data-' + Date.now());
      const testUrl = await this.uploadAudio(testBuffer, 999999, 999999, 1);
      
      // Test access via HTTP
      const response = await fetch(testUrl);
      const isAccessible = response.ok;
      
      if (isAccessible) {
        console.log(`✅ R2 connection test passed - ${testUrl}`);
        // Cleanup test file
        try {
          await this.deleteAudio(testUrl);
          console.log('🧹 Test file cleaned up');
        } catch (cleanupError) {
          console.log('⚠️ Test file cleanup failed (not critical)');
        }
      } else {
        console.log(`❌ R2 connection test failed - HTTP ${response.status}`);
      }
      
      return isAccessible;

    } catch (error) {
      console.error('❌ R2 connection test failed:', error);
      return false;
    }
  }
}
