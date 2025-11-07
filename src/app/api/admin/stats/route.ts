import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

function getTokenFromRequest(request: NextRequest) {
  // Try cookie first (preferred for browser requests)
  const cookie = request.cookies.get('token')?.value;
  if (cookie) return cookie;
  
  // Fallback to authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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

    const homeworkCount = classIds.length > 0
      ? await prisma.homework.count({
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
    let recentActivities: any[] = [];
    
    try {
      const [recentClazzes, recentQuizzes] = await Promise.all([
        prisma.clazz.findMany({
          where: { teacherId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 2,
          select: { name: true, createdAt: true },
        }),
        classIds.length > 0 ? prisma.quiz.findMany({
          where: { clazzId: { in: classIds } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { title: true, createdAt: true },
        }) : [],
      ]);

      // Get recent students who joined admin's classes
      const recentMembers = classIds.length > 0 ? await prisma.classMember.findMany({
        where: { clazzId: { in: classIds } },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { joinedAt: 'desc' },
        take: 2,
      }) : [];

      // Gộp và sắp xếp lại theo thời gian
      recentActivities = [
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
    } catch (activityError) {
      console.error('Error fetching recent activities:', activityError);
      // Continue with empty activities array instead of failing the entire request
      recentActivities = [];
    }

    return NextResponse.json({
      studentCount,
      classCount,
      vocabCount,
      quizCount,
      homeworkCount,
      folderCount,
      recentActivities,
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    const status = error.message === 'Unauthorized' || error.message === 'Forbidden' 
      ? (error.message === 'Unauthorized' ? 401 : 403)
      : 500;
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status });
  }
}

