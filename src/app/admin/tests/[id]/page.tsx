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
    // Poll for real-time updates every 3 seconds
    const interval = setInterval(() => {
      const currentStatus = (quiz as any)?.status || 'pending';
      if (currentStatus === 'active') {
        fetchMonitorData();
      }
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

  if (isLoading) return <div>Đang tải...</div>;
  if (!quiz) {
    notFound();
  }

  const quizStatus = (quiz as any).status || 'pending';
  const isPending = quizStatus === 'pending';
  const isActive = quizStatus === 'active';
  const isEnded = quizStatus === 'ended';

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
    // Only run this effect when quiz first loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isLoading]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className='flex-1'>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">{quiz.description || 'Không có mô tả'}</p>
        </div>
        {isActive && (
          <Button
            variant="default"
            onClick={() => router.push(`/quizzes/${id}/live`)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Eye className="mr-2 h-4 w-4" />
            Xem Live
          </Button>
        )}
        {isPending && (
          <Button
            variant="default"
            onClick={() => router.push(`/quizzes/${id}/lobby`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Users className="mr-2 h-4 w-4" />
            Vào phòng chờ
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/tests/${id}/edit`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Sửa bài kiểm tra
        </Button>
        {isPending && (
          <Button 
            onClick={handleStartQuiz} 
            disabled={isStarting}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="mr-2 h-4 w-4" />
            {isStarting ? 'Đang bắt đầu...' : 'Bắt đầu bài kiểm tra'}
          </Button>
        )}
        {isActive && (
          <Button 
            onClick={handleEndQuiz} 
            disabled={isEnding}
            variant="destructive"
          >
            <Power className="mr-2 h-4 w-4" />
            {isEnding ? 'Đang kết thúc...' : 'Kết thúc bài kiểm tra'}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Thông tin bài kiểm tra
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  {quiz.createdAt ? new Date((quiz as any).createdAt).toLocaleString('vi-VN') : '-'}
                </div>
              </div>
              {(quiz as any).endedAt && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Power className="h-4 w-4" />
                    Ngày kết thúc
                  </div>
                  <div className="text-sm">
                    {new Date((quiz as any).endedAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {monitorData && (isActive || isEnded) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Theo dõi Real-time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
        <Card>
          <CardHeader>
            <CardTitle>Kết quả của học sinh</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
