/**
 * Fix speaking submission status
 * Update all 'in_progress' status to 'submitted'
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing speaking submission status...');

  const result = await prisma.speakingSubmission.updateMany({
    where: {
      status: 'in_progress',
    },
    data: {
      status: 'submitted',
    },
  });

  console.log(`✅ Updated ${result.count} speaking submissions from 'in_progress' to 'submitted'`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
