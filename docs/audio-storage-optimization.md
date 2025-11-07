# 🎵 Audio Storage Optimization Plan

## 🎯 Khuyến nghị: CloudFlare R2 + CDN

### 📊 So sánh hiệu suất:

| Method | Load Time | Cost | Scalability | CDN | Complexity |
|--------|-----------|------|-------------|-----|------------|
| PostgreSQL | 2-5s | Free | ❌ Limited | ❌ No | ⭐ Easy |
| AWS S3 | 200-500ms | $ Medium | ✅ Unlimited | ✅ Yes | ⭐⭐ Medium |
| **CloudFlare R2** | **100-300ms** | **$ Low** | **✅ Unlimited** | **✅ Yes** | **⭐⭐ Medium** |
| Local Files | 50-200ms | Free | ❌ Limited | ❌ No | ⭐⭐⭐ Hard |

## 🚀 Migration Steps:

### Phase 1: Add R2 Support (Parallel with current system)
```prisma
model HomeworkSubmission {
  id               Int      @id @default(autoincrement())
  // Keep existing
  audioData        Bytes?   // Legacy - will be deprecated
  
  // Add new fields
  audioUrl         String?  // CloudFlare R2 URL
  audioSize        Int?     // File size in bytes
  audioFormat      String?  // "mp3", "wav", etc.
  audioDuration    Float?   // Duration in seconds
  
  // ...other fields
}
```

### Phase 2: Update API Endpoints
```typescript
// New upload endpoint: /api/upload-audio
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audioFile = formData.get('audio') as File;
  
  // Upload to CloudFlare R2
  const r2Response = await uploadToR2(audioFile);
  
  return NextResponse.json({
    url: r2Response.url,
    size: audioFile.size,
    format: audioFile.type,
    duration: await getAudioDuration(audioFile)
  });
}
```

### Phase 3: Update Submit Logic
```typescript
// speaking-homework-player.tsx
const handleSubmit = async () => {
  setIsSubmitting(true);
  
  try {
    // 1. Upload audio to R2
    const formData = new FormData();
    formData.append('audio', recordedAudio);
    
    const uploadResponse = await fetch('/api/upload-audio', {
      method: 'POST',
      body: formData
    });
    const { url: audioUrl } = await uploadResponse.json();
    
    // 2. Submit with audio URL instead of base64
    const response = await fetch(`/api/homework/${homeworkId}/submit-speaking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        audioUrl,           // Instead of audioBase64
        transcribedText 
      })
    });
    
    // ...rest of logic
  } catch (error) {
    // ...error handling
  }
};
```

## 🔧 CloudFlare R2 Setup:

### 1. Create R2 Bucket
```bash
# Using Wrangler CLI
npm install -g wrangler
wrangler r2 bucket create english-app-audio
```

### 2. Environment Variables
```env
# .env.local
CLOUDFLARE_R2_BUCKET_NAME=english-app-audio
CLOUDFLARE_R2_ACCESS_KEY_ID=xxx
CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxx
CLOUDFLARE_R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
CLOUDFLARE_R2_PUBLIC_URL=https://audio.yourdomain.com
```

### 3. R2 Client Setup
```typescript
// lib/r2-client.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export const uploadAudioToR2 = async (
  audioBuffer: Buffer, 
  fileName: string,
  contentType: string
) => {
  const command = new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: `audio/${fileName}`,
    Body: audioBuffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // 1 year cache
  });

  await r2Client.send(command);
  
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/audio/${fileName}`;
};
```

## 📈 Performance Improvements Expected:

- **Load time**: 2-5s → 100-300ms (83-95% faster)
- **Database size**: Reduce by 60-80%
- **Memory usage**: Reduce by 70%
- **Backup speed**: 3x faster
- **Scalability**: Unlimited storage

## 💰 Cost Analysis:

### CloudFlare R2 Pricing:
- Storage: $0.015/GB/month
- Download: $0/GB (first 10GB free daily)
- Upload: $4.50/million requests

### Example: 1000 students, 10 submissions each
- Audio files: 10MB average × 10,000 = 100GB
- Monthly storage cost: 100GB × $0.015 = **$1.50/month**
- Download cost: **FREE** (under 10GB/day)

### Compared to server costs:
- Extra 100GB SSD storage: $10-20/month
- **R2 saves 85-93% vs server storage**

## 🎯 Next Steps:

1. **Immediate**: Fix current submit button issue (DONE ✅)
2. **Week 1**: Set up CloudFlare R2 bucket
3. **Week 2**: Implement parallel upload system
4. **Week 3**: Migrate existing audio data
5. **Week 4**: Deprecate old system

## 🛡️ Fallback Strategy:

Keep both systems for 1 month:
- New submissions → R2
- Old submissions → Keep in PostgreSQL
- Gradual migration with zero downtime
