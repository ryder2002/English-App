"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { QuizPlayerForClass } from '@/components/quiz-player-for-class';
import type { VocabularyItem } from '@/lib/types';
import type { QuizDirection } from '@/lib/types';
import { VocabularyContext } from '@/contexts/vocabulary-context';

interface QuizData {
  quiz: {
    id: number;
    title: string;
    description?: string;
    quizCode: string;
    vocabularyCount: number;
  };
  resultId: number;
  startedAt: string;
}

export default function QuizTakingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const quizId = params?.id as string;
  const resultId = searchParams?.get('resultId') || null;

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [quizDirection, setQuizDirection] = useState<QuizDirection>('en-vi');

  useEffect(() => {
    if (!quizId || !resultId) {
      router.push('/quizzes/enter');
      return;
    }

    fetchQuizData();
  }, [quizId, resultId, router]);

  const fetchQuizData = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/vocabulary`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load quiz data');
      }

      const data = await res.json();
      setQuizData({
        quiz: data.quiz,
        resultId: Number(resultId),
        startedAt: new Date().toISOString(),
      });
      setVocabulary(data.vocabulary || []);
      setMaxScore(data.vocabulary?.length || 0);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải bài kiểm tra',
        variant: 'destructive',
      });
      router.push('/quizzes/enter');
    } finally {
      setIsLoading(false);
    }
  };

  // Track score from quiz player
  useEffect(() => {
    // We'll update score when quiz finishes
  }, []);

  interface QuizAnswer {
    vocabularyId: number | null;
    questionText: string;
    questionType: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }

  const handleQuizComplete = async (answers: QuizAnswer[]) => {
    if (isFinished) return;
    
    setIsFinished(true);
    
    // Calculate score
    const correctCount = answers.filter(a => a.isCorrect).length;
    const totalQuestions = answers.length;
    setScore(correctCount);
    setMaxScore(totalQuestions);

    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          resultId: Number(resultId),
          score: correctCount,
          maxScore: totalQuestions,
          answers: answers,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit quiz');
      }

      const result = await res.json();
      
      toast({
        title: 'Hoàn thành!',
        description: `Bạn đã hoàn thành bài kiểm tra với điểm số ${correctCount}/${totalQuestions}`,
      });
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể nộp bài',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="text-center">Đang tải bài kiểm tra...</div>
        </div>
      </AppShell>
    );
  }

  if (!quizData || vocabulary.length === 0) {
    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Không tìm thấy bài kiểm tra hoặc bài kiểm tra đã kết thúc.</p>
              <Button onClick={() => router.push('/quizzes/enter')} className="mt-4">
                Quay lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Create a mock vocabulary context for the quiz
  const mockVocabularyContext = {
    vocabulary,
    folderObjects: [],
    isLoadingInitialData: false,
    addVocabularyItem: async () => null,
    removeVocabularyItem: async () => {},
    updateVocabularyItem: async () => {},
    addFolder: async () => null,
    removeFolder: async () => {},
    updateFolder: async () => {},
    buildFolderTree: () => [],
    refreshData: async () => {},
  };

  return (
    <VocabularyContext.Provider value={mockVocabularyContext}>
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{quizData.quiz.title}</h1>
                  {quizData.quiz.description && (
                    <p className="text-muted-foreground mt-1">{quizData.quiz.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Mã đề: <span className="font-mono">{quizData.quiz.quizCode}</span>
                  </p>
                </div>
                {isFinished && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {score}/{maxScore}
                    </div>
                    <div className="text-sm text-muted-foreground">Điểm số</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {!isFinished && vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0 ? (
            <QuizPlayerForClass
              vocabulary={vocabulary}
              quizDirection={quizDirection}
              onComplete={handleQuizComplete}
              resultId={Number(resultId)}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <h2 className="text-xl font-bold">Bạn đã hoàn thành bài kiểm tra!</h2>
                <div className="text-4xl font-bold text-primary">
                  {score}/{maxScore}
                </div>
                <div className="text-muted-foreground">
                  Tỷ lệ đúng: {maxScore > 0 ? Math.round((score / maxScore) * 100) : 0}%
                </div>
                <Button onClick={() => router.push('/classes')}>
                  Quay về lớp học
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    </VocabularyContext.Provider>
  );
}


