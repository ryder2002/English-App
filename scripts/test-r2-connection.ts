import { R2AudioStorage } from '../src/lib/r2-storage';

async function testR2Connection() {
  console.log('🧪 Testing R2 Connection...\n');
  
  try {
    console.log('📝 Step 1: Testing R2 connection...');
    const isConnected = await R2AudioStorage.testConnection();
    
    if (isConnected) {
      console.log('✅ R2 connection test PASSED');
      console.log('🎉 Your R2 integration is ready to use!');
      console.log('\n📋 Next steps:');
      console.log('1. Run database migration: npx prisma db push');
      console.log('2. Try submitting a speaking homework to test upload');
      console.log('3. Check your R2 bucket for uploaded files');
    } else {
      console.log('❌ R2 connection test FAILED');
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check your .env.local file has correct R2 credentials');
      console.log('2. Verify R2 API tokens have correct permissions');
      console.log('3. Make sure bucket "cnenglishaudio" exists');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    console.log('\n🔧 Common issues:');
    console.log('1. Missing environment variables');
    console.log('2. Invalid R2 credentials');
    console.log('3. Network connectivity issues');
  }
}

// Run test
testR2Connection();
