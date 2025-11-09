import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testR2Credentials() {
  console.log('🔑 Testing R2 Credentials...\n');
  
  // Load environment variables
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  
  console.log('📋 Environment Variables:');
  console.log(`  - CLOUDFLARE_ACCOUNT_ID: ${accountId ? accountId.substring(0, 8) + '...' : 'MISSING'}`);
  console.log(`  - R2_ACCESS_KEY_ID: ${accessKey ? accessKey.substring(0, 8) + '...' : 'MISSING'}`);
  console.log(`  - R2_SECRET_ACCESS_KEY: ${secretKey ? secretKey.substring(0, 8) + '...' : 'MISSING'}`);
  console.log(`  - R2_BUCKET_NAME: ${bucketName || 'MISSING'}`);
  
  if (!accountId || !accessKey || !secretKey) {
    console.log('\n❌ Missing required environment variables!');
    return false;
  }
  
  try {
    console.log('\n🧪 Testing R2 connection...');
    
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
    
    // Test 1: List buckets
    console.log('📋 Step 1: Listing buckets...');
    const listCommand = new ListBucketsCommand({});
    const response = await r2Client.send(listCommand);
    
    console.log('✅ Success! Found buckets:');
    response.Buckets?.forEach(bucket => {
      console.log(`  - ${bucket.Name} (${bucket.CreationDate})`);
    });
    
    // Check if our bucket exists
    const ourBucket = response.Buckets?.find(b => b.Name === bucketName);
    if (ourBucket) {
      console.log(`✅ Target bucket "${bucketName}" found!`);
    } else {
      console.log(`⚠️  Target bucket "${bucketName}" not found. Available buckets:`);
      response.Buckets?.forEach(bucket => {
        console.log(`    - ${bucket.Name}`);
      });
    }
    
    return true;
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('InvalidAccessKeyId')) {
      console.log('\n🔧 Fix: Check R2_ACCESS_KEY_ID is correct');
    } else if (error.message.includes('SignatureDoesNotMatch')) {
      console.log('\n🔧 Fix: Check R2_SECRET_ACCESS_KEY is correct');
    } else if (error.message.includes('credential object is not valid')) {
      console.log('\n🔧 Fix: R2 credentials format or permissions issue');
      console.log('   - Make sure API token has Object Read & Write permissions');
      console.log('   - Check token is not expired');
    }
    
    return false;
  }
}

testR2Credentials();
