"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, CheckCircle, Clock, AlertCircle, Power, Play, Eye, Edit, Calendar, BookOpen, Folder } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface QuizDetail {
  id: number;
  title: string;
  description: string;
  quizCode: string;
  status: string;
  createdAt?: string;
  endedAt?: string;
  clazz: { name: string; };
  folder: { name: string; };
}

interface AnswerDetail {
  id: number;
  questionText: string;
  questionType: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface MonitorData {
  quiz: {
    id: number;
    title: string;
    quizCode: string;
    status: string;
    createdAt: string;
  };
  results: Array<{
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
    startedAt: string;
    endedAt?: string;
    answerDetails?: AnswerDetail[];
    correctCount?: number;
    incorrectCount?: number;
  }>;
  totalMembers: number;
  completedCount: number;
  inProgressCount: number;
}

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params?.id as string | undefined;
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);
  const [resultDetails, setResultDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    fetchData();
  }, [id]);

  // Poll for real-time updates every 3 seconds (only when quiz is active)
  useEffect(() => {
    if (!id || !quiz) return;
    
    const currentStatus = (quiz as any)?.status || 'pending';
    if (currentStatus !== 'active') return;

    fetchMonitorData();
    const interval = setInterval(() => {
      fetchMonitorData();
    }, 3000);

    return () => clearInterval(interval);
  }, [id, quiz?.status]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/tests/${id}`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) {
          toast({
            title: 'Lỗi',
            description: 'Không tìm thấy bài kiểm tra',
            variant: 'destructive',
          });
          router.push('/admin/tests');
          return;
        }
        throw new Error('Failed to fetch test');
      }
      const data = await res.json();
      
      // Verify admin owns this quiz
      if (data.clazz && data.clazz.teacherId) {
        setQuiz(data);
        const status = data.status || 'pending';
        if (status === 'active') {
          fetchMonitorData();
        }
      } else {
        toast({
          title: 'Lỗi',
          description: 'Bạn không có quyền xem bài kiểm tra này',
          variant: 'destructive',
        });
        router.push('/admin/tests');
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Lỗi',
        description: err.message || 'Không thể tải bài kiểm tra',
        variant: 'destructive',
      });
      router.push('/admin/tests');
    } finally { setIsLoading(false); }
  };

  const fetchMonitorData = async () => {
    try {
      const res = await fetch(`/api/admin/quizzes/${id}/monitor`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setMonitorData(data);
    } catch (err) {
      console.error('Monitor fetch error', err);
    }
  };

  const handleStartQuiz = async () => {
    if (!confirm('Bạn có chắc muốn bắt đầu bài kiểm tra này? Học sinh sẽ có thể làm bài ngay lập tức.')) {
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${id}/start`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to start quiz');
      }

      toast({
        title: 'Thành công',
        description: 'Đã bắt đầu bài kiểm tra. Học sinh có thể làm bài ngay.',
      });

      // Redirect to live page (quiz is now active)
      router.push(`/quizzes/${id}/live`);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể bắt đầu bài kiểm tra',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  const loadResultDetails = async (resultId: number) => {
    if (!id) return;
    
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${id}/results/${resultId}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to load result details');
      }
      
      const data = await res.json();
      setResultDetails(data.result);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải chi tiết',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEndQuiz = async () => {
    if (!confirm('Bạn có chắc muốn kết thúc bài kiểm tra này? Tất cả học sinh đang làm bài sẽ bị nộp tự động.')) {
      return;
    }

    setIsEnding(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${id}/end`, {
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

      // Refresh data
      fetchData();
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

  // Auto-redirect based on quiz status - only run once when quiz is loaded
  useEffect(() => {
    if (!id || !quiz || isLoading) return;
    
    const status = (quiz as any).status || 'pending';
    if (status === 'active') {
      // Quiz is active, go to live page
      router.push(`/quizzes/${id}/live`);
    } else if (status === 'pending') {
      // Quiz is pending, go to lobby page
      router.push(`/quizzes/${id}/lobby`);
    }
  }, [id, quiz, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm text-muted-foreground">Đang tải...</div>
        </div>
      </div>
    );
  }
  if (!quiz) {
    notFound();
  }

  const quizStatus = (quiz as any).status || 'pending';
  const isPending = quizStatus === 'pending';
  const isActive = quizStatus === 'active';
  const isEnded = quizStatus === 'ended';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 -m-4 md:m-0 p-4 md:p-0">
      {/* Header */}
      <div className="mb-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 md:gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className='flex-1 min-w-0'>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent break-words">
                {quiz.title}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">{quiz.description || 'Không có mô tả'}</p>
            </div>
          </div>
          
          {/* Action Buttons - Responsive */}
          <div className="flex flex-wrap gap-2">
            {isActive && (
              <Button
                variant="default"
                onClick={() => router.push(`/quizzes/${id}/live`)}
                className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none text-sm"
              >
                <Eye className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Xem Live</span>
                <span className="sm:hidden">Live</span>
              </Button>
            )}
            {isPending && (
              <Button
                variant="default"
                onClick={() => router.push(`/quizzes/${id}/lobby`)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1 md:flex-none text-sm"
              >
                <Users className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Vào phòng chờ</span>
                <span className="sm:hidden">Phòng chờ</span>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/tests/${id}/edit`)}
              className="flex-1 md:flex-none text-sm"
            >
              <Edit className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Sửa bài kiểm tra</span>
              <span className="sm:hidden">Sửa</span>
            </Button>
            {isPending && (
              <Button 
                onClick={handleStartQuiz} 
                disabled={isStarting}
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none text-sm"
              >
                <Play className="mr-2 h-4 w-4" />
                {isStarting ? 'Đang bắt đầu...' : (
                  <>
                    <span className="hidden sm:inline">Bắt đầu bài kiểm tra</span>
                    <span className="sm:hidden">Bắt đầu</span>
                  </>
                )}
              </Button>
            )}
            {isActive && (
              <Button 
                onClick={handleEndQuiz} 
                disabled={isEnding}
                variant="destructive"
                className="flex-1 md:flex-none text-sm"
              >
                <Power className="mr-2 h-4 w-4" />
                {isEnding ? 'Đang kết thúc...' : (
                  <>
                    <span className="hidden sm:inline">Kết thúc bài kiểm tra</span>
                    <span className="sm:hidden">Kết thúc</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <BookOpen className="h-5 w-5" />
              Thông tin bài kiểm tra
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <span>Mã đề</span>
                </div>
                <div className="font-mono text-lg font-semibold bg-muted px-3 py-2 rounded-md">{quiz.quizCode}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Trạng thái</div>
                <div className={
                  isPending ? 'text-yellow-600 font-semibold flex items-center gap-2' :
                  isActive ? 'text-green-600 font-semibold flex items-center gap-2' : 
                  'text-gray-600 flex items-center gap-2'
                }>
                  {isPending ? (
                    <>
                      <Clock className="h-4 w-4" />
                      <span>Chờ bắt đầu</span>
                    </>
                  ) : isActive ? (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Đang diễn ra</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Đã kết thúc</span>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  Lớp học
                </div>
                <div className="font-medium">{quiz.clazz?.name || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Folder className="h-4 w-4" />
                  Thư mục từ vựng
                </div>
                <div className="font-medium">{quiz.folder?.name || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Ngày tạo
                </div>
                <div className="text-sm">
                  {quiz.createdAt ? new Date(quiz.createdAt).toLocaleString('vi-VN') : '-'}
                </div>
              </div>
              {quiz.endedAt && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Power className="h-4 w-4" />
                    Ngày kết thúc
                  </div>
                  <div className="text-sm">
                    {new Date(quiz.endedAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {monitorData && (isActive || isEnded) && (
          <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Users className="h-5 w-5" />
                Theo dõi Real-time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <div className="text-2xl font-bold">{monitorData.totalMembers}</div>
                  <div className="text-sm text-muted-foreground">Tổng thành viên</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{monitorData.completedCount}</div>
                  <div className="text-sm text-muted-foreground">Đã hoàn thành</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{monitorData.inProgressCount}</div>
                  <div className="text-sm text-muted-foreground">Đang làm bài</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {monitorData.totalMembers - monitorData.completedCount - monitorData.inProgressCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Chưa bắt đầu</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {monitorData && (isActive || isEnded) && monitorData.results.length > 0 && (
        <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">📊 Kết quả của học sinh</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Điểm số</TableHead>
                  <TableHead>Đúng/Sai</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitorData.results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>{result.user.name || '-'}</TableCell>
                    <TableCell>{result.user.email}</TableCell>
                    <TableCell>
                      {result.status === 'submitted' || result.status === 'completed' ? (
                        <span className="font-semibold">
                          {result.score}/{result.maxScore}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.status === 'submitted' || result.status === 'completed' ? (
                        result.correctCount !== undefined && result.incorrectCount !== undefined ? (
                          <div className="text-sm">
                            <span className="text-green-600 font-medium">{result.correctCount} đúng</span>
                            {' / '}
                            <span className="text-red-600 font-medium">{result.incorrectCount} sai</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.status === 'submitted' || result.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Đã nộp
                        </span>
                      ) : result.status === 'in_progress' ? (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Clock className="h-4 w-4" />
                          Đang làm
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-600">
                          <AlertCircle className="h-4 w-4" />
                          Chưa bắt đầu
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {result.startedAt && new Date(result.startedAt).toLocaleString('vi-VN')}
                      {result.endedAt && ` → ${new Date(result.endedAt).toLocaleTimeString('vi-VN')}`}
                    </TableCell>
                    <TableCell>
                      {(result.status === 'submitted' || result.status === 'completed') ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedResultId(result.id);
                                // Use answerDetails from monitorData if available, otherwise load from API
                                if (result.answerDetails && result.answerDetails.length > 0) {
                                  setResultDetails({
                                    answers: result.answerDetails,
                                    score: result.score,
                                    maxScore: result.maxScore,
                                    correctCount: result.correctCount,
                                    incorrectCount: result.incorrectCount,
                                    user: result.user,
                                  });
                                } else {
                                  loadResultDetails(result.id);
                                }
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Xem chi tiết
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Chi tiết bài làm của {result.user.name || result.user.email}
                              </DialogTitle>
                            </DialogHeader>
                            {isLoadingDetails ? (
                              <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                              </div>
                            ) : resultDetails ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-primary">
                                        {resultDetails.score || result.score}/{resultDetails.maxScore || result.maxScore}
                                      </div>
                                      <div className="text-sm text-muted-foreground">Điểm số</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-green-600">
                                        {resultDetails.correctCount || result.correctCount || 0}
                                      </div>
                                      <div className="text-sm text-muted-foreground">Câu đúng</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-red-600">
                                        {resultDetails.incorrectCount || result.incorrectCount || 0}
                                      </div>
                                      <div className="text-sm text-muted-foreground">Câu sai</div>
                                    </CardContent>
                                  </Card>
                                </div>
                                <div className="space-y-3">
                                  {(resultDetails.answers || result.answerDetails || []).map((answer: AnswerDetail, index: number) => (
                                    <Card 
                                      key={answer.id || index}
                                      className={answer.isCorrect ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"}
                                    >
                                      <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                          <div className="mt-1">
                                            {answer.isCorrect ? (
                                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            ) : (
                                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <div className="font-semibold mb-2">
                                              Câu {index + 1}: {answer.questionText}
                                              <span className="ml-2 text-xs text-muted-foreground">
                                                ({answer.questionType === 'word_to_meaning' ? 'Từ → Nghĩa' : 'Nghĩa → Từ'})
                                              </span>
                                            </div>
                                            <div className="text-sm space-y-1">
                                              <div>
                                                <span className="text-muted-foreground">Đáp án của học viên: </span>
                                                <span className={answer.isCorrect ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                                                  {answer.selectedAnswer}
                                                </span>
                                              </div>
                                              {!answer.isCorrect && (
                                                <div>
                                                  <span className="text-muted-foreground">Đáp án đúng: </span>
                                                  <span className="text-green-600 dark:text-green-400 font-medium">
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
                            ) : (
                              <div className="text-center p-8 text-muted-foreground">
                                Chưa có dữ liệu chi tiết
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {monitorData.results.map((result) => (
                <Card key={result.id} className="border-2 border-purple-200 dark:border-purple-800 bg-white/90 dark:bg-gray-800/90">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-base mb-1">
                        {result.user.name || result.user.email}
                      </h3>
                      <p className="text-xs text-muted-foreground">{result.user.email}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Điểm số</div>
                        <div className="font-bold">
                          {result.status === 'submitted' || result.status === 'completed' ? (
                            <span>{result.score}/{result.maxScore}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Trạng thái</div>
                        <div>
                          {result.status === 'submitted' || result.status === 'completed' ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs">
                              <CheckCircle className="h-3 w-3" />
                              Đã nộp
                            </span>
                          ) : result.status === 'in_progress' ? (
                            <span className="flex items-center gap-1 text-yellow-600 text-xs">
                              <Clock className="h-3 w-3" />
                              Đang làm
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-600 text-xs">
                              <AlertCircle className="h-3 w-3" />
                              Chưa bắt đầu
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {result.status === 'submitted' || result.status === 'completed' ? (
                      result.correctCount !== undefined && result.incorrectCount !== undefined && (
                        <div className="flex gap-4 text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div>
                            <span className="text-green-600 font-medium">{result.correctCount} đúng</span>
                          </div>
                          <div>
                            <span className="text-red-600 font-medium">{result.incorrectCount} sai</span>
                          </div>
                        </div>
                      )
                    ) : null}
                    <div className="text-xs text-muted-foreground pt-2 border-t border-gray-200 dark:border-gray-700">
                      {result.startedAt && new Date(result.startedAt).toLocaleString('vi-VN')}
                      {result.endedAt && ` → ${new Date(result.endedAt).toLocaleTimeString('vi-VN')}`}
                    </div>
                    {(result.status === 'submitted' || result.status === 'completed') && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => {
                              setSelectedResultId(result.id);
                              if (result.answerDetails && result.answerDetails.length > 0) {
                                setResultDetails({
                                  answers: result.answerDetails,
                                  score: result.score,
                                  maxScore: result.maxScore,
                                  correctCount: result.correctCount,
                                  incorrectCount: result.incorrectCount,
                                  user: result.user,
                                });
                              } else {
                                loadResultDetails(result.id);
                              }
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Xem chi tiết
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-base md:text-lg">
                              Chi tiết bài làm của {result.user.name || result.user.email}
                            </DialogTitle>
                          </DialogHeader>
                          {isLoadingDetails ? (
                            <div className="flex items-center justify-center p-8">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                          ) : resultDetails ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
                                <Card className="border-2 border-blue-200 dark:border-blue-800">
                                  <CardContent className="p-3 md:p-4 text-center">
                                    <div className="text-xl md:text-2xl font-bold text-primary">
                                      {resultDetails.score || result.score}/{resultDetails.maxScore || result.maxScore}
                                    </div>
                                    <div className="text-xs md:text-sm text-muted-foreground">Điểm số</div>
                                  </CardContent>
                                </Card>
                                <Card className="border-2 border-green-200 dark:border-green-800">
                                  <CardContent className="p-3 md:p-4 text-center">
                                    <div className="text-xl md:text-2xl font-bold text-green-600">
                                      {resultDetails.correctCount || result.correctCount || 0}
                                    </div>
                                    <div className="text-xs md:text-sm text-muted-foreground">Câu đúng</div>
                                  </CardContent>
                                </Card>
                                <Card className="border-2 border-red-200 dark:border-red-800">
                                  <CardContent className="p-3 md:p-4 text-center">
                                    <div className="text-xl md:text-2xl font-bold text-red-600">
                                      {resultDetails.incorrectCount || result.incorrectCount || 0}
                                    </div>
                                    <div className="text-xs md:text-sm text-muted-foreground">Câu sai</div>
                                  </CardContent>
                                </Card>
                              </div>
                              <div className="space-y-2 md:space-y-3">
                                {(resultDetails.answers || result.answerDetails || []).map((answer: AnswerDetail, index: number) => (
                                  <Card 
                                    key={answer.id || index}
                                    className={answer.isCorrect ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"}
                                  >
                                    <CardContent className="p-3 md:p-4">
                                      <div className="flex items-start gap-2 md:gap-3">
                                        <div className="mt-1">
                                          {answer.isCorrect ? (
                                            <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                                          ) : (
                                            <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-semibold mb-1 md:mb-2 text-sm md:text-base">
                                            Câu {index + 1}: {answer.questionText}
                                            <span className="ml-1 md:ml-2 text-xs text-muted-foreground">
                                              ({answer.questionType === 'word_to_meaning' ? 'Từ → Nghĩa' : 'Nghĩa → Từ'})
                                            </span>
                                          </div>
                                          <div className="text-xs md:text-sm space-y-1">
                                            <div>
                                              <span className="text-muted-foreground">Đáp án của học viên: </span>
                                              <span className={answer.isCorrect ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                                                {answer.selectedAnswer}
                                              </span>
                                            </div>
                                            {!answer.isCorrect && (
                                              <div>
                                                <span className="text-muted-foreground">Đáp án đúng: </span>
                                                <span className="text-green-600 dark:text-green-400 font-medium">
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
                          ) : (
                            <div className="text-center p-8 text-muted-foreground">
                              Chưa có dữ liệu chi tiết
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
