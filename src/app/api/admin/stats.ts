import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [studentCount, classCount, vocabCount, quizCount] = await Promise.all([
    prisma.user.count({ where: { role: 'user' as any } }),
    prisma.clazz.count(),
    prisma.vocabulary.count(),
    prisma.quiz.count(),
  ]);

  // Lấy 5 hoạt động gần đây nhất từ các bảng chính
  const [recentUsers, recentClazzes, recentQuizzes] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'user' as any },
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: { name: true, email: true, createdAt: true },
    }),
    prisma.clazz.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: { name: true, createdAt: true },
    }),
    prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: { title: true, createdAt: true },
    }),
  ]);

  // Gộp và sắp xếp lại theo thời gian
  const recentActivities = [
    ...recentUsers.map((u: any) => ({ type: 'user', text: `Học viên mới: ${u.name || u.email}`, createdAt: u.createdAt })),
    ...recentClazzes.map((c: any) => ({ type: 'clazz', text: `Lớp học mới: ${c.name}`, createdAt: c.createdAt })),
    ...recentQuizzes.map((t: any) => ({ type: 'quiz', text: `Bài kiểm tra mới: ${t.title}`, createdAt: t.createdAt })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return NextResponse.json({
    studentCount,
    classCount,
    vocabCount,
    quizCount,
    recentActivities,
  });
}
