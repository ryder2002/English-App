import { PrismaClient } from '@prisma/client';
import { R2AudioStorage } from '../src/lib/r2-storage';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

interface AudioSubmission {
  id: number;
  userId: number;
  homeworkId: number;
  audioData: Buffer;
  audioUrl: string | null;
}

async function migrateAudioToR2() {
  console.log('🚀 Starting audio migration to R2...\n');

  try {
    // Step 1: Find submissions with audio_data but no audioUrl
    console.log('📋 Step 1: Finding submissions to migrate...');
    const submissionsToMigrate = await prisma.homeworkSubmission.findMany({
      where: {
        audioData: { not: null },
        audioUrl: null
      },
      select: {
        id: true,
        userId: true,
        homeworkId: true,
        audioData: true,
        audioUrl: true
      }
    }) as AudioSubmission[];

    if (submissionsToMigrate.length === 0) {
      console.log('✅ No submissions need migration. All audio is already on R2!');
      return;
    }

    console.log(`Found ${submissionsToMigrate.length} submissions to migrate:\n`);

    // Step 2: Migrate each submission
    let successCount = 0;
    let errorCount = 0;

    for (const submission of submissionsToMigrate) {
      const audioSizeKB = Math.round(submission.audioData.length / 1024);
      console.log(`📤 Migrating submission ${submission.id} (User ${submission.userId}, ${audioSizeKB}KB)...`);

      try {
        // Upload to R2 using static method
        const audioUrl = await R2AudioStorage.uploadAudio(
          submission.audioData, 
          submission.userId, 
          submission.homeworkId, 
          1 // attempt number default
        );
        
        // Update database with R2 URL
        await prisma.homeworkSubmission.update({
          where: { id: submission.id },
          data: { audioUrl }
        });

        console.log(`   ✅ Success! Uploaded to: ${audioUrl.substring(0, 80)}...`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
      }
    }

    // Step 3: Summary
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📝 Total: ${submissionsToMigrate.length}`);

    if (successCount > 0) {
      console.log('\n🎉 Migration completed! Now you can safely run the cleanup script to remove audio_data.');
    }

    if (errorCount > 0) {
      console.log('\n⚠️  Some migrations failed. Check errors above and retry if needed.');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateAudioToR2().catch(console.error);
