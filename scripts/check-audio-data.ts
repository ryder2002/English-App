// Simple Node.js script to check audio data
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAudioData() {
  try {
    console.log('🔍 Checking audio data in database...');
    
    // Get latest submissions with audio
    const submissions = await prisma.homeworkSubmission.findMany({
      where: {
        OR: [
          { audioData: { not: null } },
          { audioUrl: { not: null } }
        ]
      },
      include: {
        user: { select: { name: true, email: true } },
        homework: { 
          select: { 
            title: true,
            clazz: { select: { name: true } }
          } 
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`📊 Found ${submissions.length} submissions with audio data`);
    
    for (const submission of submissions) {
      console.log('\n📝 Submission:', {
        id: submission.id,
        user: submission.user.name || submission.user.email,
        homework: submission.homework.title,
        class: submission.homework.clazz?.name,
        hasAudioData: !!submission.audioData,
        hasAudioUrl: !!submission.audioUrl,
        audioDataSize: submission.audioData ? submission.audioData.length : 0,
        audioUrl: submission.audioUrl ? submission.audioUrl.substring(0, 100) + '...' : null,
        createdAt: submission.createdAt
      });
    }
    
    if (submissions.length === 0) {
      console.log('❌ No submissions with audio data found');
      
      // Check recent submissions without audio
      const recentSubmissions = await prisma.homeworkSubmission.findMany({
        include: {
          user: { select: { name: true, email: true } },
          homework: { 
            select: { 
              title: true,
              clazz: { select: { name: true } }
            } 
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      console.log('\n📋 Recent submissions (no audio filter):');
      for (const sub of recentSubmissions) {
        console.log('- ID:', sub.id, 'User:', sub.user.name || sub.user.email, 'Has Audio:', !!sub.audioData || !!sub.audioUrl);
      }
    }
    
  } catch (error) {
    console.error('💥 Error checking audio data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAudioData();
