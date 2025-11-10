const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestAudioSubmission() {
  try {
    console.log('🔧 Creating test audio submission...\n');
    
    // Find a speaking homework
    const speakingHomework = await prisma.homework.findFirst({
      where: { type: 'speaking' },
      include: {
        clazz: { select: { name: true, teacherId: true } }
      }
    });
    
    if (!speakingHomework) {
      console.log('❌ No speaking homework found. Creating one...');
      
      // Find a class
      let testClass = await prisma.clazz.findFirst();
      
      if (!testClass) {
        console.log('❌ No class found. Please create a class first.');
        return;
      }
      
      // Create speaking homework
      const newHomework = await prisma.homework.create({
        data: {
          title: 'Test Speaking Homework',
          description: 'Test homework for audio debugging',
          type: 'speaking',
          speakingText: 'Hello, this is a test sentence for speaking practice.',
          clazzId: testClass.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        }
      });
      
      console.log(`✅ Created test speaking homework: ${newHomework.title} (ID: ${newHomework.id})`);
      speakingHomework = newHomework;
    }
    
    console.log(`📚 Using homework: ${speakingHomework.title} (ID: ${speakingHomework.id})`);
    
    // Find a user to create submission for
    const testUser = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'user' },
          { role: 'admin' }
        ]
      }
    });
    
    if (!testUser) {
      console.log('❌ No test user found. Please create a user first.');
      return;
    }
    
    console.log(`👤 Using user: ${testUser.name || testUser.email} (ID: ${testUser.id})`);
    
    // Create fake audio data (a simple WAV header + some data)
    const fakeAudioData = Buffer.from([
      // WAV header (44 bytes)
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x08, 0x00, 0x00, // file size - 8
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6d, 0x74, 0x20, // "fmt "
      0x10, 0x00, 0x00, 0x00, // fmt chunk size
      0x01, 0x00,             // audio format (PCM)
      0x02, 0x00,             // number of channels
      0x44, 0xac, 0x00, 0x00, // sample rate (44100)
      0x10, 0xb1, 0x02, 0x00, // byte rate
      0x04, 0x00,             // block align
      0x10, 0x00,             // bits per sample
      0x64, 0x61, 0x74, 0x61, // "data"
      0x00, 0x08, 0x00, 0x00, // data size
      // Some fake audio data (2048 bytes of zeros)
      ...new Array(2048).fill(0)
    ]);
    
    // Check if submission already exists
    const existingSubmission = await prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId: speakingHomework.id,
        userId: testUser.id
      }
    });
    
    if (existingSubmission) {
      // Update existing submission
      const updatedSubmission = await prisma.homeworkSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          audioData: fakeAudioData,
          transcribedText: 'Hello this is a test sentence for speaking practice',
          status: 'submitted',
          submittedAt: new Date(),
          score: 0.85
        }
      });
      
      console.log(`✅ Updated existing submission ID: ${updatedSubmission.id}`);
      console.log(`   Audio data size: ${fakeAudioData.length} bytes`);
      console.log(`   Status: ${updatedSubmission.status}`);
      
    } else {
      // Create new submission
      const newSubmission = await prisma.homeworkSubmission.create({
        data: {
          homeworkId: speakingHomework.id,
          userId: testUser.id,
          audioData: fakeAudioData,
          transcribedText: 'Hello this is a test sentence for speaking practice',
          status: 'submitted',
          submittedAt: new Date(),
          startedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          score: 0.85,
          timeSpentSeconds: 120
        }
      });
      
      console.log(`✅ Created new submission ID: ${newSubmission.id}`);
      console.log(`   Audio data size: ${fakeAudioData.length} bytes`);
      console.log(`   Status: ${newSubmission.status}`);
    }
    
    console.log('\n🎯 Test submission created! You can now test with this submission ID.');
    
  } catch (error) {
    console.error('💥 Error creating test submission:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAudioSubmission();
