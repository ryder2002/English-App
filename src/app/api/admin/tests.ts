import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const quizzes = await prisma.quiz.findMany({
    include: {
      clazz: { select: { id: true, name: true } },
      folder: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(quizzes);
}
