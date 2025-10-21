const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const classes = await prisma.clazz.findMany({ take: 20 });
    const folders = await prisma.folder.findMany({ take: 20 });
    const vocabularies = await prisma.vocabulary.findMany({ take: 20 });
    const quizzes = await prisma.quiz.findMany({ take: 20 });

    console.log('Classes (up to 20):', classes);
    console.log('Folders (up to 20):', folders);
    console.log('Vocabularies (up to 20):', vocabularies);
    console.log('Quizzes (up to 20):', quizzes);

    const classCount = await prisma.clazz.count();
    const folderCount = await prisma.folder.count();
    const vocabCount = await prisma.vocabulary.count();
    const quizCount = await prisma.quiz.count();

    console.log('\nCounts:');
    console.log({ classCount, folderCount, vocabCount, quizCount });
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
