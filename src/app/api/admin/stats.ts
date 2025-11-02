import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

function ensureAdminOrThrow(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '') || req.cookies.get('token')?.value;
  if (!token) throw new Error('Unauthorized');
  return token;
}

export async function GET(request: NextRequest) {
  try {
    const token = ensureAdminOrThrow(request);
    const user = await AuthService.verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only count data for this admin's classes
    const adminClasses = await prisma.clazz.findMany({
      where: { teacherId: user.id },
      select: { id: true },
    });
    const classIds = adminClasses.map(c => c.id);

    // Count students in admin's classes
    const studentCount = classIds.length > 0
      ? await prisma.classMember.count({
          where: { clazzId: { in: classIds } },
        })
      : 0;

    // Count classes owned by this admin
    const classCount = adminClasses.length;

    // Count vocabulary owned by admin (directly by userId)
    const vocabCount = await prisma.vocabulary.count({
      where: {
        userId: user.id,
      },
    });

    // Count quizzes in admin's classes
    const quizCount = classIds.length > 0
      ? await prisma.quiz.count({
          where: { clazzId: { in: classIds } },
        })
      : 0;

    // Count folders owned by admin
    const folderCount = await prisma.folder.count({
      where: {
        userId: user.id,
      },
    });

    // Get recent activities for this admin only
    const [recentClazzes, recentQuizzes] = await Promise.all([
      prisma.clazz.findMany({
        where: { teacherId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: { name: true, createdAt: true },
      }),
      prisma.quiz.findMany({
        where: { clazzId: { in: classIds } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { title: true, createdAt: true },
      }),
    ]);

    // Get recent students who joined admin's classes
    const recentMembers = await prisma.classMember.findMany({
      where: { clazzId: { in: classIds } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { joinedAt: 'desc' },
      take: 2,
    });

    // Gộp và sắp xếp lại theo thời gian
    const recentActivities = [
      ...recentMembers.map((m: any) => ({ 
        type: 'user', 
        text: `Học viên tham gia: ${m.user.name || m.user.email}`, 
        createdAt: m.joinedAt 
      })),
      ...recentClazzes.map((c: any) => ({ 
        type: 'clazz', 
        text: `Lớp học mới: ${c.name}`, 
        createdAt: c.createdAt 
      })),
      ...recentQuizzes.map((t: any) => ({ 
        type: 'quiz', 
        text: `Bài kiểm tra mới: ${t.title}`, 
        createdAt: t.createdAt 
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    return NextResponse.json({
      studentCount,
      classCount,
      vocabCount,
      quizCount,
      folderCount,
      recentActivities,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error' }, { status: 401 });
  }
}
