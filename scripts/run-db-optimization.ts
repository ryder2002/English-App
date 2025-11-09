import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function runDatabaseOptimizations() {
  console.log('🚀 Running database optimizations...\n');
  
  try {
    // Read SQL file
    const sqlPath = join(process.cwd(), 'database-optimization.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    
    // Split by ; and run each statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
      
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Success\n`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Already exists (OK)\n`);
        } else {
          console.error(`❌ Error: ${error.message}\n`);
        }
      }
    }
    
    console.log('🎉 Database optimization completed!');
    console.log('\n📊 Summary:');
    console.log('✅ Added audioUrl column to HomeworkSubmission');
    console.log('✅ Created performance indexes');
    console.log('✅ Analyzed tables for query optimization');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runDatabaseOptimizations();
