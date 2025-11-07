import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAudioData() {
  console.log('🧹 Starting audio data cleanup and database optimization...\n');
  
  try {
    // 1. Check current audio data
    console.log('📊 Step 1: Analyzing current audio storage...');
    
    const audioStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(audio_data) as with_audio_data,
        COUNT(audio_url) as with_audio_url,
        pg_size_pretty(SUM(CASE WHEN audio_data IS NOT NULL THEN length(audio_data) ELSE 0 END)) as total_audio_size
      FROM homework_submissions;
    `;
    
    const stats = audioStats[0];
    console.log(`📋 Current state:`);
    console.log(`  - Total submissions: ${stats.total_submissions}`);
    console.log(`  - With audio_data (legacy): ${stats.with_audio_data}`);
    console.log(`  - With audioUrl (R2): ${stats.with_audio_url}`);
    console.log(`  - Total audio data size: ${stats.total_audio_size || '0 bytes'}`);
    
    // 2. Backup submissions with audio_data but no audioUrl
    console.log('\n📤 Step 2: Finding submissions that need migration...');
    
    const needMigration = await prisma.$queryRaw<any[]>`
      SELECT id, user_id, homework_id, attempt_number, LENGTH(audio_data) as size
      FROM homework_submissions 
      WHERE audio_data IS NOT NULL AND (audio_url IS NULL OR audio_url = '');
    `;
    
    if (needMigration.length > 0) {
      console.log(`⚠️  Found ${needMigration.length} submissions with audio_data but no R2 URL`);
      console.log('These submissions would lose audio if we delete audio_data now.');
      console.log('Recommend migrating to R2 first, or skip cleanup for now.');
      
      // Show first few examples
      needMigration.slice(0, 3).forEach((sub, i) => {
        console.log(`  ${i + 1}. Submission ${sub.id} - User ${sub.user_id} - ${Math.round(sub.size / 1024)}KB`);
      });
      
      console.log('\n🤔 Options:');
      console.log('A) Migrate these to R2 first (recommended)');
      console.log('B) Delete audio_data anyway (lose audio for these submissions)');
      console.log('C) Skip cleanup for now');
      
      return false;
    }
    
    // 3. Clean up audio_data column
    console.log('\n🗑️  Step 3: Removing audio_data from database...');
    
    const updateResult = await prisma.$executeRaw`
      UPDATE homework_submissions 
      SET audio_data = NULL 
      WHERE audio_data IS NOT NULL;
    `;
    
    console.log(`✅ Cleared audio_data from ${updateResult} submissions`);
    
    // 4. Vacuum and optimize database
    console.log('\n🔧 Step 4: Optimizing database...');
    
    // Vacuum to reclaim space
    await prisma.$executeRaw`VACUUM FULL homework_submissions;`;
    console.log('✅ Vacuumed homework_submissions table');
    
    // Update statistics
    await prisma.$executeRaw`ANALYZE homework_submissions;`;
    console.log('✅ Updated table statistics');
    
    // 5. Final statistics
    console.log('\n📊 Step 5: Final results...');
    
    const finalStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(audio_data) as with_audio_data,
        COUNT(audio_url) as with_audio_url,
        pg_size_pretty(pg_total_relation_size('homework_submissions')) as table_size
      FROM homework_submissions;
    `;
    
    const final = finalStats[0];
    console.log(`📋 After cleanup:`);
    console.log(`  - Total submissions: ${final.total_submissions}`);
    console.log(`  - With audio_data (legacy): ${final.with_audio_data}`);
    console.log(`  - With audioUrl (R2): ${final.with_audio_url}`);
    console.log(`  - Table size: ${final.table_size}`);
    
    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('💾 Space reclaimed from removing binary audio data');
    console.log('⚡ Database performance should be improved');
    
    return true;
    
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAudioData();
