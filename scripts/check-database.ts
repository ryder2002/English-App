import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database schema...\n');
  
  try {
    // List all tables
    const tables = await prisma.$queryRaw<any[]>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `;
    
    console.log('📋 Available tables:');
    tables.forEach(table => {
      console.log(`  - ${table.tablename}`);
    });
    
    // Find submission-related table
    const submissionTable = tables.find(t => 
      t.tablename.toLowerCase().includes('submission') || 
      t.tablename.toLowerCase().includes('homework')
    );
    
    if (submissionTable) {
      console.log(`\n📝 Found submission table: ${submissionTable.tablename}`);
      
      // Check columns
      const columns = await prisma.$queryRaw<any[]>`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = '${submissionTable.tablename}';
      `;
      
      console.log(`\n🔍 Columns in ${submissionTable.tablename}:`);
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check if audioUrl exists
      const hasAudioUrl = columns.find(col => col.column_name === 'audioUrl');
      const hasAudioData = columns.find(col => col.column_name === 'audioData');
      
      console.log('\n📊 Audio storage status:');
      console.log(`  - audioData (legacy): ${hasAudioData ? '✅ EXISTS' : '❌ NOT FOUND'}`);
      console.log(`  - audioUrl (R2): ${hasAudioUrl ? '✅ EXISTS' : '❌ NOT FOUND'}`);
      
      if (!hasAudioUrl && submissionTable.tablename) {
        console.log(`\n🔧 Adding audioUrl column to ${submissionTable.tablename}...`);
        
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${submissionTable.tablename}" 
          ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
        `);
        
        console.log('✅ audioUrl column added successfully!');
      }
      
    } else {
      console.log('❌ No submission table found');
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
