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
    direction?: string;
  };
  resultId: number;
  startedAt: string;
}

interface QuizResultDetail {
  result: {
    id: number;
    score: number;
    maxScore: number;
    startedAt: string;
    endedAt?: string;
    status: string;
  };
  answers: Array<{
    id: number;
    questionText: string;
    questionType: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
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
  const [resultDetail, setResultDetail] = useState<QuizResultDetail | null>(null);
  const [showResultDetail, setShowResultDetail] = useState(false);

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
      const quizDirectionFromQuiz = data.quiz?.direction || 'en_vi';
      // Convert en_vi -> en-vi, vi_en -> vi-en, random -> random
      const directionMap: Record<string, QuizDirection> = {
        'en_vi': 'en-vi',
        'vi_en': 'vi-en',
        'random': 'random'
      };
      setQuizDirection(directionMap[quizDirectionFromQuiz] || 'en-vi');
      
      setQuizData({
        quiz: data.quiz,
        resultId: Number(resultId),
        startedAt: new Date().toISOString(),
      });
      setVocabulary(data.vocabulary || []);
      setMaxScore(data.vocabulary?.length || 0);

      // Check if quiz is already completed - fetch result detail
      checkQuizResult();
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

  const checkQuizResult = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/result/${resultId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result && (data.result.status === 'completed' || data.result.status === 'submitted')) {
          setResultDetail(data);
          setScore(data.result.score);
          setMaxScore(data.result.maxScore);
          setIsFinished(true);
          setShowResultDetail(true);
        }
      }
    } catch (error) {
      // Quiz not completed yet or result not found
      console.log('Quiz result not found or not completed yet');
    }
  };

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
      
      // Fetch result detail to show answers
      await checkQuizResult();
      
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
          ) : showResultDetail && resultDetail ? (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-0 zoom-in-95 duration-500">
              <Card className="border-2 shadow-soft bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Kết quả bài kiểm tra
                    </h2>
                    <div className="inline-flex flex-col items-center gap-2 px-8 py-6 rounded-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                      <div className="text-6xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {resultDetail.result.score} / {resultDetail.result.maxScore}
                      </div>
                      <div className="text-2xl font-semibold text-muted-foreground">
                        Tỷ lệ chính xác: <span className="font-bold text-green-600">
                          {resultDetail.result.maxScore > 0 ? Math.round((resultDetail.result.score / resultDetail.result.maxScore) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {resultDetail.answers.map((answer, index) => (
                      <Card 
                        key={answer.id}
                        className={`p-5 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] shadow-sm ${
                          answer.isCorrect 
                            ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700 hover:shadow-glow-green" 
                            : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-300 dark:border-red-700 hover:shadow-glow-red"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                            answer.isCorrect 
                              ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                              : "bg-gradient-to-br from-red-500 to-rose-600"
                          }`}>
                            {answer.isCorrect ? (
                              <span className="text-white font-bold">✓</span>
                            ) : (
                              <span className="text-white font-bold">✗</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-lg mb-2">
                              <span className="text-muted-foreground">Câu {index + 1}:</span>{' '}
                              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {answer.questionText}
                              </span>
                              <span className="ml-2 text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                {answer.questionType === 'word_to_meaning' ? '📝 Từ → Nghĩa' : '📚 Nghĩa → Từ'}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground font-medium">Đáp án của bạn:</span>
                                <span className={`px-3 py-1 rounded-lg font-semibold text-sm ${
                                  answer.isCorrect 
                                    ? "bg-green-500 text-white" 
                                    : "bg-red-500 text-white"
                                }`}>
                                  {answer.selectedAnswer || '(Chưa trả lời)'}
                                </span>
                              </div>
                              {!answer.isCorrect && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground font-medium">Đáp án đúng:</span>
                                  <span className="px-3 py-1 rounded-lg bg-green-500 text-white font-semibold text-sm">
                                    {answer.correctAnswer}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-center gap-4 pt-4">
                    <Button 
                      onClick={() => router.push('/classes')}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg px-8 py-6 rounded-xl"
                    >
                      🏠 Quay về lớp học
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
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


