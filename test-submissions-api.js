// Simple test to verify the submissions API endpoint compiles
const { prisma } = require('./src/lib/prisma');

async function testSubmissionsQuery() {
  try {
    // Test the query structure used in the API
    const where = {
      homework: {
        type: 'speaking'
      }
    };

    console.log('Testing submissions query...');
    
    // This should work with the existing HomeworkSubmission model
    const submissions = await prisma.homeworkSubmission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        homework: {
          select: {
            id: true,
            title: true,
            speakingText: true,
            type: true
          }
        }
      },
      take: 5
    });

    console.log(`✅ Query successful! Found ${submissions.length} submissions`);
    return submissions;
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run test if called directly
if (require.main === module) {
  testSubmissionsQuery()
    .then(() => console.log('✅ API test completed'))
    .catch(() => process.exit(1));
}

module.exports = { testSubmissionsQuery };
