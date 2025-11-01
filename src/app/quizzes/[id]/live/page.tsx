"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { QuizPlayerForClass } from '@/components/quiz-player-for-class';
import type { VocabularyItem } from '@/lib/types';
import type { QuizDirection } from '@/lib/types';
import { VocabularyContext } from '@/contexts/vocabulary-context';
import { useAuth } from '@/contexts/auth-context';
import { 
  Trophy, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface QuizLiveData {
  quiz: {
    id: number;
    title: string;
    description?: string;
    quizCode: string;
    status: string;
    direction?: string;
  };
  vocabulary?: VocabularyItem[];
  resultId?: number | null;
  userResult?: any;
  // Admin only
  results?: any[];
  leaderboard?: Array<{
    userId: number;
    userName: string;
    score: number;
    maxScore: number;
    correctCount: number;
    incorrectCount: number;
    percentage: number;
    endedAt?: string;
  }>;
  totalMembers?: number;
  completedCount?: number;
  inProgressCount?: number;
  notStartedCount?: number;
}

export default function QuizLivePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth() || {};
  const quizId = params?.id as string;

  const [liveData, setLiveData] = useState<QuizLiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!quizId) {
      router.push('/quizzes/enter');
      return;
    }

    // Wait for auth to load before fetching
    if (!user) {
      return;
    }

    fetchLiveData();
    
    // Poll every 2 seconds for real-time updates
    const interval = setInterval(() => {
      fetchLiveData();
    }, 2000);

    return () => clearInterval(interval);
  }, [quizId, router, user]);

  const fetchLiveData = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/live`, {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 404) {
          router.push('/quizzes/enter');
          return;
        }
        throw new Error('Failed to load quiz data');
      }

      const data = await res.json();
      setLiveData(data);

      // For users: check if finished
      if (!isAdmin && data.userResult) {
        setIsFinished(data.userResult.status === 'submitted' || data.userResult.status === 'completed');
        setScore(data.userResult.score || 0);
        setMaxScore(data.userResult.maxScore || 0);
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải dữ liệu',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = async (answers: any[]) => {
    if (isFinished || !liveData?.resultId) return;
    
    setIsFinished(true);
    
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
          resultId: Number(liveData.resultId),
          score: correctCount,
          maxScore: totalQuestions,
          answers: answers,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit quiz');
      }

      toast({
        title: 'Hoàn thành!',
        description: `Bạn đã hoàn thành bài kiểm tra với điểm số ${correctCount}/${totalQuestions}`,
      });

      // Refresh data
      fetchLiveData();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể nộp bài',
        variant: 'destructive',
      });
    }
  };

  const viewUserDetails = (userId: number) => {
    const userResult = liveData?.results?.find(r => r.userId === userId);
    if (userResult) {
      setSelectedUserId(userId);
      setSelectedUserDetails(userResult);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!liveData) {
    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Không tìm thấy bài kiểm tra</p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Admin View: Real-time Monitoring with Leaderboard
  if (isAdmin) {
    const quizStatus = liveData.quiz.status || 'pending';
    const isActive = quizStatus === 'active';

    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{liveData.quiz.title}</h1>
            <p className="text-muted-foreground">{liveData.quiz.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Đang diễn ra' : 'Đã kết thúc'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Mã đề: <span className="font-mono">{liveData.quiz.quizCode}</span>
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng học viên</p>
                    <p className="text-2xl font-bold">{liveData.totalMembers || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Đã hoàn thành</p>
                    <p className="text-2xl font-bold text-green-600">{liveData.completedCount || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Đang làm</p>
                    <p className="text-2xl font-bold text-yellow-600">{liveData.inProgressCount || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Chưa bắt đầu</p>
                    <p className="text-2xl font-bold text-gray-600">{liveData.notStartedCount || 0}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          {liveData.leaderboard && liveData.leaderboard.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Bảng xếp hạng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Học viên</TableHead>
                      <TableHead className="text-center">Điểm số</TableHead>
                      <TableHead className="text-center">Đúng/Sai</TableHead>
                      <TableHead className="text-center">Tỷ lệ</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveData.leaderboard.map((entry, index) => (
                      <TableRow key={entry.userId}>
                        <TableCell>
                          {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                          {index === 1 && <Trophy className="h-5 w-5 text-gray-400" />}
                          {index === 2 && <Trophy className="h-5 w-5 text-orange-500" />}
                          {index > 2 && <span className="text-muted-foreground">{index + 1}</span>}
                        </TableCell>
                        <TableCell className="font-medium">{entry.userName}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold">{entry.score}/{entry.maxScore}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-600">{entry.correctCount}</span> /{' '}
                          <span className="text-red-600">{entry.incorrectCount}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={entry.percentage >= 80 ? 'default' : entry.percentage >= 60 ? 'secondary' : 'destructive'}>
                            {entry.percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewUserDetails(entry.userId)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Xem chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Real-time Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Tiến độ Real-time</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-center">Câu hiện tại</TableHead>
                    <TableHead className="text-center">Đúng/Sai</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveData.results?.map((result: any) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">
                        {result.user.name || result.user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            result.status === 'submitted' || result.status === 'completed'
                              ? 'default'
                              : result.status === 'in_progress'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {result.status === 'submitted' || result.status === 'completed'
                            ? 'Đã nộp'
                            : result.status === 'in_progress'
                            ? 'Đang làm'
                            : 'Chưa bắt đầu'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {result.status === 'in_progress' ? (
                          <span className="text-sm">{result.currentQuestion || 0} / {result.maxQuestions || result.maxScore || 0}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {result.status === 'submitted' || result.status === 'completed' ? (
                          <>
                            <span className="text-green-600">{result.correctCount || 0}</span> /{' '}
                            <span className="text-red-600">{result.incorrectCount || 0}</span>
                          </>
                        ) : result.status === 'in_progress' ? (
                          <span className="text-yellow-600">Đang làm...</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {(result.status === 'submitted' || result.status === 'completed' || result.status === 'in_progress') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewUserDetails(result.userId)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Xem
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* User Details Dialog */}
          {selectedUserDetails && (
            <Dialog open={selectedUserId !== null} onOpenChange={() => setSelectedUserId(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Chi tiết bài làm của {selectedUserDetails.user.name || selectedUserDetails.user.email}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {selectedUserDetails.score || 0}/{selectedUserDetails.maxScore || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Điểm số</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedUserDetails.correctCount || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Câu đúng</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {selectedUserDetails.incorrectCount || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Câu sai</div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="space-y-3">
                    {(selectedUserDetails.answerDetails || []).map((answer: any, index: number) => (
                      <Card
                        key={answer.id || index}
                        className={answer.isCorrect ? "bg-green-50 dark:bg-green-950/20 border-green-200" : "bg-red-50 dark:bg-red-950/20 border-red-200"}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {answer.isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold mb-2">
                                Câu {index + 1}: {answer.questionText}
                              </div>
                              <div className="text-sm space-y-1">
                                <div>
                                  <span className="text-muted-foreground">Đáp án của học viên: </span>
                                  <span className={answer.isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                    {answer.selectedAnswer}
                                  </span>
                                </div>
                                {!answer.isCorrect && (
                                  <div>
                                    <span className="text-muted-foreground">Đáp án đúng: </span>
                                    <span className="text-green-600 font-medium">
                                      {answer.correctAnswer}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </AppShell>
    );
  }

  // User View: Quiz Player
  const quizStatus = liveData.quiz.status || 'pending';
  const isPending = quizStatus === 'pending';
  const mockVocabularyContext = {
    vocabulary: [],
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

  if (isPending) {
    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <Clock className="h-12 w-12 text-yellow-600 mx-auto" />
              <h2 className="text-xl font-bold">Chờ bắt đầu bài kiểm tra</h2>
              <p className="text-muted-foreground">
                Giáo viên chưa bắt đầu bài kiểm tra này. Vui lòng chờ...
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (isFinished) {
    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
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
        </div>
      </AppShell>
    );
  }

  if (!liveData.vocabulary || liveData.vocabulary.length === 0) {
    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Không có từ vựng trong bài kiểm tra này</p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <VocabularyContext.Provider value={mockVocabularyContext}>
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{liveData.quiz.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{liveData.quiz.description}</p>
            </CardContent>
          </Card>

          {liveData.vocabulary && Array.isArray(liveData.vocabulary) && liveData.vocabulary.length > 0 ? (
            <QuizPlayerForClass
              vocabulary={liveData.vocabulary}
              quizDirection={(liveData.quiz.direction as QuizDirection) || 'en-vi'}
              onComplete={handleQuizComplete}
              resultId={Number(liveData.resultId || 0)}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Không có từ vựng để làm bài</p>
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    </VocabularyContext.Provider>
  );
}

