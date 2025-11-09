import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addAudioUrlToSubmissions() {
  console.log('🚀 Adding audioUrl to homework_submissions table...\n');
  
  try {
    // Check current columns in homework_submissions
    console.log('🔍 Current columns in homework_submissions:');
    const columns = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'homework_submissions'
      ORDER BY ordinal_position;
    `;
    
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Check if audioUrl already exists
    const hasAudioUrl = columns.find(col => col.column_name === 'audioUrl');
    const hasAudioData = columns.find(col => col.column_name === 'audioData');
    
    console.log('\n📊 Audio storage status:');
    console.log(`  - audioData (legacy): ${hasAudioData ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`  - audioUrl (R2): ${hasAudioUrl ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    if (!hasAudioUrl) {
      console.log('\n🔧 Adding audioUrl column...');
      await prisma.$executeRaw`
        ALTER TABLE "homework_submissions" 
        ADD COLUMN "audioUrl" TEXT;
      `;
      console.log('✅ audioUrl column added!');
      
      // Add index
      console.log('🔧 Adding index for audioUrl...');
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_homework_submissions_audio_url" 
        ON "homework_submissions" ("audioUrl") 
        WHERE "audioUrl" IS NOT NULL;
      `;
      console.log('✅ Index added!');
    } else {
      console.log('\n✅ audioUrl column already exists!');
    }
    
    // Final verification
    console.log('\n🔍 Final verification...');
    const finalColumns = await prisma.$queryRaw<any[]>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'homework_submissions' 
      AND column_name IN ('audioData', 'audioUrl');
    `;
    
    console.log('📋 Audio-related columns:');
    finalColumns.forEach(col => {
      console.log(`  ✅ ${col.column_name}`);
    });
    
    console.log('\n🎉 R2 integration ready!');
    console.log('📝 Next steps:');
    console.log('1. Update your .env.local with R2 credentials');
    console.log('2. Test R2 connection: npx tsx scripts/test-r2-connection.ts');
    console.log('3. Try submitting a speaking homework');
    
  } catch (error: any) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAudioUrlToSubmissions();
