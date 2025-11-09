import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testDirectBucketAccess() {
  console.log('🎯 Testing direct bucket access...\n');
  
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  
  if (!accountId || !accessKey || !secretKey || !bucketName) {
    console.log('❌ Missing environment variables');
    return false;
  }
  
  try {
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
    
    console.log('📤 Step 1: Testing upload to bucket...');
    const testKey = 'test/connection-test.txt';
    const testContent = 'Hello R2! Connection test successful.';
    
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });
    
    await r2Client.send(putCommand);
    console.log(`✅ Upload successful: ${testKey}`);
    
    console.log('📥 Step 2: Testing download...');
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    });
    
    const response = await r2Client.send(getCommand);
    const body = await response.Body?.transformToString();
    
    if (body === testContent) {
      console.log('✅ Download successful and content matches!');
      
      // Generate public URL
      const publicUrl = `https://pub-${accountId.replace(/-/g, '')}.r2.dev/${testKey}`;
      console.log(`🌐 Public URL: ${publicUrl}`);
      
      console.log('\n🎉 R2 connection is working perfectly!');
      console.log('📝 Ready for audio upload integration');
      
      return true;
    } else {
      console.log('❌ Content mismatch');
      return false;
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'NoSuchBucket') {
      console.log(`\n🔧 Bucket "${bucketName}" doesn't exist. Create it first.`);
    } else if (error.message.includes('Access Denied')) {
      console.log('\n🔧 Token permissions issue:');
      console.log('   - Token should have Object Read & Write for this bucket');
      console.log('   - Or create account-level token with R2:Edit permission');
    }
    
    return false;
  }
}

testDirectBucketAccess();
