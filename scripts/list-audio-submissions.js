const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listSubmissionsWithAudio() {
  try {
    console.log('🔍 Finding submissions with audio data...\n');
    
    // Get submissions with audio
    const submissions = await prisma.homeworkSubmission.findMany({
      where: {
        OR: [
          { audioData: { not: null } },
          { audioUrl: { not: null } }
        ]
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        homework: { 
          select: { 
            id: true,
            title: true,
            type: true,
            clazz: { 
              select: {
                id: true,
                name: true,
                teacherId: true
              }
            }
          } 
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    if (submissions.length === 0) {
      console.log('❌ No submissions with audio found.');
      
      // Check if there are any speaking homeworks at all
      const speakingHomeworks = await prisma.homework.findMany({
        where: { type: 'speaking' },
        include: {
          clazz: { select: { name: true } },
          submissions: { select: { id: true, userId: true, status: true } }
        },
        take: 10
      });
      
      console.log(`\n📚 Found ${speakingHomeworks.length} speaking homeworks:`);
      speakingHomeworks.forEach(hw => {
        console.log(`- ${hw.title} (Class: ${hw.clazz?.name}) - ${hw.submissions.length} submissions`);
      });
      
      return;
    }
    
    console.log(`✅ Found ${submissions.length} submissions with audio:\n`);
    
    submissions.forEach((sub, index) => {
      console.log(`${index + 1}. Submission ID: ${sub.id}`);
      console.log(`   User: ${sub.user.name || sub.user.email} (ID: ${sub.user.id}, Role: ${sub.user.role})`);
      console.log(`   Homework: ${sub.homework?.title} (${sub.homework?.type})`);
      console.log(`   Class: ${sub.homework?.clazz?.name} (Teacher ID: ${sub.homework?.clazz?.teacherId})`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Audio URL: ${sub.audioUrl ? 'Yes (' + sub.audioUrl.substring(0, 50) + '...)' : 'No'}`);
      console.log(`   Audio Data: ${sub.audioData ? 'Yes (' + sub.audioData.length + ' bytes)' : 'No'}`);
      console.log(`   Created: ${sub.createdAt.toLocaleString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listSubmissionsWithAudio();
