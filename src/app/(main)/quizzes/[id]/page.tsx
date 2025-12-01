'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { QuizPlayerForClass } from '@/components/quiz-player-for-class';
import { VocabularyContext } from '@/contexts/vocabulary-context';
import { Loader2 } from 'lucide-react';

export default function QuizTakingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [quizData, setQuizData] = useState<any>(null);
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [resultId, setResultId] = useState<number | null>(null);
  const [showResultDetail, setShowResultDetail] = useState(false);
  const [resultDetail, setResultDetail] = useState<any>(null);
  const [quizDirection, setQuizDirection] = useState<'en-vi' | 'vi-en' | 'random'>('random');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`/api/quizzes/${params.id}/take`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load quiz');
        }

        if (data.isFinished) {
          setIsFinished(true);
          setScore(data.result.score);
          setMaxScore(data.result.maxScore);
          setResultId(data.result.id);

          // Fetch result detail
          const detailRes = await fetch(`/api/quizzes/results/${data.result.id}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            setResultDetail(detailData);
            setShowResultDetail(true);
          }
        } else {
          setQuizData(data);
          setVocabulary(data.vocabulary);
          setQuizDirection(data.quiz.direction || 'mixed');
        }
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.message,
          variant: 'destructive',
        });
        router.push('/classes');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchQuiz();
    }
  }, [params.id, router, toast]);

  const handleQuizComplete = async (result: any) => {
    try {
      const res = await fetch(`/api/quizzes/${params.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quiz');
      }

      setIsFinished(true);
      setScore(data.score);
      setMaxScore(data.maxScore);
      setResultId(data.id);

      // Fetch result detail
      const detailRes = await fetch(`/api/quizzes/results/${data.id}`);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        setResultDetail(detailData);
        setShowResultDetail(true);
      }

      toast({
        title: 'Hoàn thành!',
        description: `Bạn đã đạt ${data.score}/${data.maxScore} điểm`,
      });
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quizData && !isFinished) {
    return (
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
    );
  }

  // Create a mock vocabulary context for the quiz
  const mockVocabularyContext = {
    vocabulary: vocabulary || [],
    folderObjects: [],
    isLoadingInitialData: false,
    addVocabularyItem: async () => null,
    removeVocabularyItem: async () => { },
    updateVocabularyItem: async () => { },
    addFolder: async () => null,
    removeFolder: async () => { },
    updateFolder: async () => { },
    buildFolderTree: () => [],
    refreshData: async () => { },
  };

  return (
    <VocabularyContext.Provider value={mockVocabularyContext}>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {quizData && (
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
        )}

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
                  {resultDetail.answers.map((answer: any, index: number) => (
                    <Card
                      key={answer.id}
                      className={`p-5 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] shadow-sm ${answer.isCorrect
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700 hover:shadow-glow-green"
                        : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-300 dark:border-red-700 hover:shadow-glow-red"
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${answer.isCorrect
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
                              <span className={`px-3 py-1 rounded-lg font-semibold text-sm ${answer.isCorrect
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
    </VocabularyContext.Provider>
  );
}
