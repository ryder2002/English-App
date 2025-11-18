/**
 * Check speaking submission statuses
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking speaking submission statuses...\n');

  const submissions = await prisma.speakingSubmission.findMany({
    select: {
      id: true,
      status: true,
      submittedAt: true,
      homework: {
        select: {
          id: true,
          title: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  console.log(`Found ${submissions.length} speaking submissions:\n`);

  submissions.forEach((sub) => {
    console.log(`📋 Submission #${sub.id}:`);
    console.log(`   Homework: ${sub.homework.title}`);
    console.log(`   User: ${sub.user.email}`);
    console.log(`   Status: "${sub.status}" (type: ${typeof sub.status})`);
    console.log(`   Submitted: ${sub.submittedAt}`);
    console.log('');
  });

  // Group by status
  const grouped = await prisma.speakingSubmission.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('\n📊 Status summary:');
  grouped.forEach((g) => {
    console.log(`   "${g.status}": ${g._count} submissions`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
