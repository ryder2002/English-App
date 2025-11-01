"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Power,
  BookOpen,
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
import { cn } from '@/lib/utils';

interface QuizLiveData {
  quiz: {
    id: number;
    title: string;
    description?: string;
    quizCode: string;
    status: string;
    direction?: string;
    timePerQuestion?: number;
    isPaused?: boolean;
  };
  vocabulary?: VocabularyItem[];
  resultId?: number | null;
  userResult?: any;
  // Admin only
  results?: Array<{
    id: number;
    userId: number;
    user: {
      id: number;
      email: string;
      name?: string;
    };
    score: number;
    maxScore: number;
    status: string;
    correctCount?: number;
    incorrectCount?: number;
    currentStreak?: number;
    answerDetails?: Array<{
      id: number;
      isCorrect: boolean;
      questionText: string;
      questionType?: string;
      selectedAnswer?: string;
      correctAnswer?: string;
      answeredAt?: string;
    }>;
    currentQuestion?: number;
    maxQuestions?: number;
  }>;
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
  const [isEnding, setIsEnding] = useState(false);

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
    
    // All answers should already be submitted individually via /api/quizzes/[id]/answer
    // This is just final submission to mark as completed
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (!liveData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Không tìm thấy bài kiểm tra</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Admin View: Real-time Monitoring with Leaderboard
  if (isAdmin) {
    const quizStatus = liveData.quiz.status || 'pending';
    const isActive = quizStatus === 'active';

    const handlePauseResume = async () => {
      try {
        const res = await fetch(`/api/admin/quizzes/${quizId}/pause`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isPaused: !liveData.quiz.isPaused }),
        });

        if (!res.ok) {
          throw new Error('Failed to pause/resume quiz');
        }

        fetchLiveData(); // Refresh data
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.message || 'Không thể tạm dừng/tiếp tục bài kiểm tra',
          variant: 'destructive',
        });
      }
    };

    const handleEndQuiz = async () => {
      if (!confirm('Bạn có chắc muốn kết thúc bài kiểm tra này? Tất cả học sinh đang làm bài sẽ bị nộp tự động.')) {
        return;
      }

      setIsEnding(true);
      try {
        const res = await fetch(`/api/admin/quizzes/${quizId}/end`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Failed to end quiz');
        }

        toast({
          title: 'Thành công',
          description: 'Đã kết thúc bài kiểm tra',
        });

        // Refresh data to get updated status
        fetchLiveData();
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.message || 'Không thể kết thúc bài kiểm tra',
          variant: 'destructive',
        });
      } finally {
        setIsEnding(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {/* Header với gradient và animation */}
          <div className="mb-8 flex items-start justify-between rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-glow animate-pulse-slow">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {liveData.quiz.title}
                  </h1>
                </div>
              </div>
              {liveData.quiz.description && (
                <p className="text-muted-foreground ml-15 text-lg">{liveData.quiz.description}</p>
              )}
              <div className="flex items-center gap-3 mt-4">
                <Badge 
                  variant={isActive ? 'default' : 'secondary'}
                  className={cn(
                    "px-3 py-1 text-sm font-semibold",
                    isActive && "bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse-slow shadow-glow-green"
                  )}
                >
                  {isActive ? '✨ Đang diễn ra' : '✅ Đã kết thúc'}
                </Badge>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-800">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Mã đề:</span>
                  <span className="font-mono font-bold text-purple-900 dark:text-purple-100">{liveData.quiz.quizCode}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isActive && (
                <>
                  <Button
                    onClick={handlePauseResume}
                    variant={liveData.quiz.isPaused ? 'default' : 'outline'}
                    className={cn(
                      "transition-all duration-300 hover:scale-105 shadow-md",
                      liveData.quiz.isPaused 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-glow-green' 
                        : 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                    )}
                  >
                    {liveData.quiz.isPaused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng'}
                  </Button>
                  <Button
                    onClick={handleEndQuiz}
                    disabled={isEnding}
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <Power className="mr-2 h-4 w-4" />
                    {isEnding ? '⏳ Đang kết thúc...' : '🛑 Kết thúc bài kiểm tra'}
                  </Button>
                </>
              )}
              {!isActive && (
                <Button
                  onClick={() => router.push('/admin/tests')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  🏠 Quay về trang quản lý
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards với gradients và animations */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-0 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">👥 Tổng học viên</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{liveData.totalMembers || 0}</p>
                  </div>
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">✅ Đã hoàn thành</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100 animate-pulse-slow">{liveData.completedCount || 0}</p>
                  </div>
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md shadow-glow-green">
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">⏰ Đang làm</p>
                    <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{liveData.inProgressCount || 0}</p>
                  </div>
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-md animate-pulse">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/20 dark:to-slate-800/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">⏸️ Chưa bắt đầu</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{liveData.notStartedCount || 0}</p>
                  </div>
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-gray-400 to-slate-500 flex items-center justify-center shadow-md">
                    <AlertCircle className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard với gradient và animations */}
          {liveData.leaderboard && liveData.leaderboard.length > 0 && (
            <Card className="mb-6 border-0 shadow-soft bg-gradient-to-br from-yellow-50/50 via-orange-50/50 to-pink-50/50 dark:from-yellow-900/10 dark:via-orange-900/10 dark:to-pink-900/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-md animate-bounce-slow">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent font-bold">
                    🏆 Bảng xếp hạng
                  </span>
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
                      <TableRow 
                        key={entry.userId}
                        className={cn(
                          "hover:bg-gradient-to-r hover:from-yellow-50/50 hover:to-orange-50/50 dark:hover:from-yellow-900/10 dark:hover:to-orange-900/10 transition-all duration-200",
                          index === 0 && "bg-gradient-to-r from-yellow-100/50 to-orange-100/50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-500"
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md animate-pulse">
                                <Trophy className="h-5 w-5 text-white" />
                              </div>
                            )}
                            {index === 1 && (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-md">
                                <Trophy className="h-5 w-5 text-white" />
                              </div>
                            )}
                            {index === 2 && (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md">
                                <Trophy className="h-5 w-5 text-white" />
                              </div>
                            )}
                            {index > 2 && (
                              <span className="text-lg font-semibold text-muted-foreground ml-3">{index + 1}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-lg">{entry.userName}</TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">{entry.score}</span>
                            <span className="text-sm text-muted-foreground">/</span>
                            <span className="text-lg text-muted-foreground">{entry.maxScore}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Badge className="bg-green-500 text-white px-2 py-1">
                              ✅ {entry.correctCount}
                            </Badge>
                            <Badge className="bg-red-500 text-white px-2 py-1">
                              ❌ {entry.incorrectCount}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            className={cn(
                              "text-lg font-bold px-3 py-1",
                              entry.percentage >= 80 && "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-glow-green",
                              entry.percentage >= 60 && entry.percentage < 80 && "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
                              entry.percentage < 60 && "bg-gradient-to-r from-red-500 to-rose-500 text-white"
                            )}
                          >
                            {entry.percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewUserDetails(entry.userId)}
                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            👁️ Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Real-time Progress with Visual Feedback */}
          <Card className="border-0 shadow-soft bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md animate-pulse">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                  📊 Tiến độ Real-time
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead className="text-center">Điểm số</TableHead>
                    <TableHead className="text-center">Tiến độ</TableHead>
                    <TableHead className="text-center">Streak</TableHead>
                    <TableHead className="text-center">Đúng/Sai</TableHead>
                    <TableHead>Chi tiết</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveData.results?.map((result: any) => {
                    const answerDetails = result.answerDetails || [];
                    const totalAnswers = answerDetails.length;
                    const maxQuestions = result.maxQuestions || result.maxScore || 0;
                    const progressPercentage = maxQuestions > 0 ? (totalAnswers / maxQuestions) * 100 : 0;
                    const currentStreak = result.currentStreak || 0;
                    const isInProgress = result.status === 'in_progress';
                    
                    return (
                      <TableRow 
                        key={result.id}
                        className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 dark:hover:from-purple-900/10 dark:hover:to-pink-900/10 transition-all duration-200"
                      >
                        <TableCell className="font-semibold text-base">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                              {(result.user.name || result.user.email)[0].toUpperCase()}
                            </div>
                            <span>{result.user.name || result.user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800 shadow-sm">
                            <span className="text-3xl font-bold text-blue-900 dark:text-blue-100">{result.score || 0}</span>
                            <span className="text-xs text-muted-foreground font-medium">/ {maxQuestions}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Progress 
                              value={progressPercentage} 
                              className={cn(
                                "h-3 rounded-full",
                                isInProgress && "animate-pulse"
                              )} 
                            />
                            <div className="flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
                              <span>{totalAnswers}/{maxQuestions} câu</span>
                            </div>
                            {/* Visual feedback bar với animation */}
                            {answerDetails.length > 0 && (
                              <div className="flex gap-1 h-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 p-0.5">
                                {answerDetails.map((answer: any, idx: number) => (
                                  <div
                                    key={answer.id || idx}
                                    className={cn(
                                      "flex-1 min-w-[4px] rounded transition-all duration-300 hover:scale-110",
                                      answer.isCorrect 
                                        ? "bg-gradient-to-b from-green-400 to-green-600 shadow-sm shadow-green-500/50" 
                                        : "bg-gradient-to-b from-red-400 to-red-600 shadow-sm shadow-red-500/50"
                                    )}
                                    title={`Câu ${idx + 1}: ${answer.isCorrect ? '✅ Đúng' : '❌ Sai'}`}
                                  />
                                ))}
                                {/* Fill remaining with gray */}
                                {Array.from({ length: Math.max(0, maxQuestions - answerDetails.length) }).map((_, idx) => (
                                  <div
                                    key={`empty-${idx}`}
                                    className="flex-1 min-w-[4px] bg-gray-200 dark:bg-gray-700 rounded"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Badge 
                              className={cn(
                                "text-xl font-bold px-4 py-2 min-w-[4rem] transition-all duration-300",
                                currentStreak > 0 
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-glow-green animate-pulse" 
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              )}
                            >
                              🔥 {currentStreak}
                            </Badge>
                            <div className="text-xs text-muted-foreground font-medium">
                              câu đúng liên tục
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2">
                              <Badge className="bg-green-500 text-white px-3 py-1.5 text-base font-semibold shadow-sm">
                                ✅ {result.correctCount || 0}
                              </Badge>
                              <Badge className="bg-red-500 text-white px-3 py-1.5 text-base font-semibold shadow-sm">
                                ❌ {result.incorrectCount || 0}
                              </Badge>
                            </div>
                            {result.status === 'in_progress' && totalAnswers === 0 && (
                              <span className="text-xs text-muted-foreground">⏳ Chưa làm</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {answerDetails.length > 0 ? (
                            <div className="flex items-center gap-1">
                              {answerDetails.slice(-5).map((answer: any, idx: number) => (
                                <div
                                  key={answer.id || idx}
                                  className={cn(
                                    "w-4 h-4 rounded-full transition-all duration-300 hover:scale-125 shadow-sm",
                                    answer.isCorrect 
                                      ? "bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/50" 
                                      : "bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/50"
                                  )}
                                  title={`Câu ${totalAnswers - 5 + idx + 1}: ${answer.isCorrect ? '✅ Đúng' : '❌ Sai'}`}
                                />
                              ))}
                              {answerDetails.length > 5 && (
                                <span className="text-xs text-muted-foreground ml-1 font-medium">
                                  +{answerDetails.length - 5}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                        {(result.status === 'submitted' || result.status === 'completed' || result.status === 'in_progress') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewUserDetails(result.userId)}
                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105 shadow-sm"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            👁️ Xem
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                  })}
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
      </div>
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
      <div className="min-h-screen bg-background">
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
      </div>
    );
  }

  if (isFinished) {
    const accuracy = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const isExcellent = accuracy >= 80;
    const isGood = accuracy >= 60;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center p-4">
        <Card className={cn(
          "max-w-2xl w-full border-2 shadow-soft animate-in fade-in-0 zoom-in-95 duration-500",
          isExcellent && "border-green-400 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20",
          !isExcellent && isGood && "border-yellow-400 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-amber-900/20",
          !isGood && "border-red-400 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-pink-900/20"
        )}>
          <CardContent className="p-12 text-center space-y-6">
            <div className="text-7xl mb-4 animate-bounce-slow">
              {isExcellent ? '🎉' : isGood ? '👍' : '💪'}
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Bạn đã hoàn thành bài kiểm tra!
            </h2>
            <div className="inline-flex flex-col items-center gap-2 px-8 py-6 rounded-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
              <div className={cn(
                "text-6xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                isExcellent && "from-green-600 to-emerald-600",
                !isExcellent && isGood && "from-yellow-600 to-orange-600",
                !isGood && "from-red-600 to-rose-600"
              )}>
                {score}/{maxScore}
              </div>
              <div className="text-xl font-semibold text-muted-foreground">
                Tỷ lệ đúng: <span className={cn(
                  "font-bold",
                  isExcellent && "text-green-600",
                  !isExcellent && isGood && "text-yellow-600",
                  !isGood && "text-red-600"
                )}>{accuracy}%</span>
              </div>
            </div>
            <Button 
              onClick={() => router.push(isAdmin ? '/admin' : '/')} 
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg px-8 py-6 rounded-xl"
            >
              🏠 Quay về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!liveData.vocabulary || liveData.vocabulary.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Không có từ vựng trong bài kiểm tra này</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <VocabularyContext.Provider value={mockVocabularyContext}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-5xl">
          {/* Quiz Header với gradient */}
          <Card className="mb-8 border-0 shadow-soft bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {liveData.quiz.title}
                  </CardTitle>
                  {liveData.quiz.description && (
                    <p className="text-muted-foreground mt-2 text-lg">{liveData.quiz.description}</p>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {liveData.vocabulary && Array.isArray(liveData.vocabulary) && liveData.vocabulary.length > 0 ? (
            <QuizPlayerForClass
              vocabulary={liveData.vocabulary}
              quizDirection={(liveData.quiz.direction as QuizDirection) || 'en-vi'}
              onComplete={handleQuizComplete}
              resultId={Number(liveData.resultId || 0)}
              quizId={Number(quizId)}
              timePerQuestion={liveData.quiz.timePerQuestion}
              isPaused={liveData.quiz.isPaused}
              onHome={() => router.push(isAdmin ? '/admin' : '/')}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Không có từ vựng để làm bài</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </VocabularyContext.Provider>
  );
}

