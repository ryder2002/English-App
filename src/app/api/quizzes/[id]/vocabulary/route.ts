import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quizId = Number(id);

    // Get quiz with folder
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        folder: true,
        clazz: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Check quiz status - only allow active quizzes
    const quizStatus = (quiz as any).status || 'pending';
    if (quizStatus === 'pending') {
      return NextResponse.json({ 
        error: 'Bài kiểm tra chưa được bắt đầu. Vui lòng chờ giáo viên bắt đầu bài kiểm tra.' 
      }, { status: 400 });
    }
    if (quizStatus === 'ended') {
      return NextResponse.json({ error: 'Bài kiểm tra đã kết thúc' }, { status: 400 });
    }

    // Check if user is member of the class
    if (quiz.clazz && quiz.clazz.members.length === 0) {
      return NextResponse.json({ error: 'You must be a member of this class' }, { status: 403 });
    }

    // Get vocabulary from folder
    const vocabulary = await prisma.vocabulary.findMany({
      where: {
        folder: quiz.folder.name,
        userId: quiz.folder.userId,
      },
    });

    // Format vocabulary for frontend
    const formattedVocabulary = vocabulary.map((v) => ({
      id: String(v.id),
      word: v.word,
      language: v.language,
      vietnameseTranslation: v.vietnameseTranslation,
      folder: v.folder,
      partOfSpeech: v.partOfSpeech || undefined,
      ipa: v.ipa || undefined,
      pinyin: v.pinyin || undefined,
      audioSrc: v.audioSrc || undefined,
      createdAt: v.createdAt.toISOString(),
    }));

    // Get direction from quiz
    const quizDirection = (quiz as any).direction || 'en_vi';

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        quizCode: quiz.quizCode,
        vocabularyCount: vocabulary.length,
        direction: quizDirection, // Return database format (en_vi, vi_en, random)
      },
      vocabulary: formattedVocabulary,
    });
  } catch (error: any) {
    console.error('Get quiz vocabulary error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get quiz vocabulary' }, { status: 400 });
  }
}

