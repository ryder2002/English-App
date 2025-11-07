"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Users, ClipboardCheck, Calendar, Plus, Eye, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Quiz {
  id: number;
  title: string;
  description?: string;
  quizCode: string;
  status?: string;
  createdAt: string;
  folder: {
    id: number;
    name: string;
  };
}

interface Homework {
  id: number;
  title: string;
  description?: string;
  type: 'listening' | 'reading';
  deadline: string;
  status: string;
  createdAt: string;
  submissions: Array<{
    id: number;
    status: string;
    submittedAt?: string;
  }>;
}

interface ClassDetail {
  id: number;
  name: string;
  description?: string;
  classCode: string;
  teacher: {
    id: number;
    email: string;
    name?: string;
  };
  quizzes: Quiz[];
  members: Array<{
    id: number;
    user: {
      id: number;
      email: string;
      name?: string;
    };
    joinedAt: string;
  }>;
  _count: {
    members: number;
    quizzes: number;
  };
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;

  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHomework, setIsLoadingHomework] = useState(true);

  useEffect(() => {
    if (!classId) {
      setIsLoading(false);
      return;
    }

    fetchClassDetail();
    fetchHomework();
  }, [classId]);

  const fetchClassDetail = async () => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load class details');
      }

      const data = await res.json();
      setClassDetail(data);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải thông tin lớp học',
        variant: 'destructive',
      });
      router.push('/classes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHomework = async () => {
    try {
      const res = await fetch(`/api/classes/${classId}/homework`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load homework');
      }

      const data = await res.json();
      setHomework(data);
    } catch (error: any) {
      console.error('Error loading homework:', error);
    } finally {
      setIsLoadingHomework(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="text-center">Đang tải...</div>
        </div>
      </AppShell>
    );
  }

  if (!classDetail) {
    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Không tìm thấy lớp học.</p>
              <Button onClick={() => router.push('/classes')} className="mt-4">
                Quay lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const pendingQuizzes = classDetail.quizzes.filter(q => q.status === 'pending');
  const activeQuizzes = classDetail.quizzes.filter(q => q.status === 'active');
  const endedQuizzes = classDetail.quizzes.filter(q => q.status === 'ended');

  const handleLeaveClass = async () => {
    if (!confirm('Bạn có chắc muốn rời lớp học này?')) return;
    
    try {
      const res = await fetch(`/api/classes/${classId}/leave`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Không thể rời lớp học');
      }

      toast({
        title: 'Thành công',
        description: 'Bạn đã rời lớp học thành công',
      });

      router.push('/classes');
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể rời lớp học',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:p-6 lg:p-8">
          {/* Header với gradient */}
          <div className="mb-4 sm:mb-6 md:mb-8 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-4 sm:p-5 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => router.back()}
                  className="rounded-lg sm:rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <div className="flex-1 flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-glow flex-shrink-0">
                    <span className="text-xl sm:text-2xl">🎓</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent line-clamp-2">
                      {classDetail.name}
                    </h1>
                    {classDetail.description && (
                      <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm md:text-base line-clamp-2">{classDetail.description}</p>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleLeaveClass}
                className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-xl font-semibold px-4 py-2.5 sm:px-6 sm:py-6 text-sm sm:text-base"
              >
                🚪 Rời lớp học
              </Button>
            </div>
          </div>

          {/* Class Info Cards với gradients */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 mb-6 sm:mb-8">
            <Card className="border-0 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md flex-shrink-0">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">{classDetail._count.members}</div>
                    <div className="text-xs sm:text-sm font-semibold text-muted-foreground">👥 Thành viên</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md flex-shrink-0">
                    <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100">{classDetail._count.quizzes}</div>
                    <div className="text-xs sm:text-sm font-semibold text-muted-foreground">📝 Bài kiểm tra</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-xs sm:text-sm font-semibold text-muted-foreground">🔑 Mã lớp</div>
                  <div className="font-mono text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent break-all">
                    {classDetail.classCode}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground pt-2 border-t border-gray-200 dark:border-gray-700 line-clamp-1">
                    👨‍🏫 Giáo viên: <span className="font-semibold">{classDetail.teacher.name || classDetail.teacher.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Pending Quizzes */}
        {pendingQuizzes.length > 0 && (
          <Card className="mb-4 sm:mb-6 border-0 shadow-soft bg-gradient-to-br from-yellow-50/50 via-orange-50/50 to-amber-50/50 dark:from-yellow-900/10 dark:via-orange-900/10 dark:to-amber-900/10">
            <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl md:text-2xl">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md animate-pulse flex-shrink-0">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-yellow-600 via-orange-600 to-amber-600 bg-clip-text text-transparent font-bold">
                  ⏳ Bài kiểm tra chờ bắt đầu ({pendingQuizzes.length})
                </span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
                Các bài kiểm tra đang chờ giáo viên bắt đầu
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {pendingQuizzes.map((quiz) => (
                  <Card 
                    key={quiz.id} 
                    className="border-2 border-yellow-300 dark:border-yellow-700 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 dark:from-yellow-900/20 dark:to-orange-900/20 hover:shadow-md transition-all duration-300"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 bg-gradient-to-r from-yellow-700 to-orange-700 bg-clip-text text-transparent line-clamp-2">
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">{quiz.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-white/60 dark:bg-gray-800/60 border border-yellow-200 dark:border-yellow-800">
                              <span className="text-muted-foreground">📁</span>
                              <span className="font-semibold truncate max-w-[120px] sm:max-w-none">{quiz.folder.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-white/60 dark:bg-gray-800/60 border border-yellow-200 dark:border-yellow-800">
                              <span className="text-muted-foreground">🔑</span>
                              <span className="font-mono font-bold">{quiz.quizCode}</span>
                            </div>
                          </div>
                          <div className="mt-2 sm:mt-3">
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold shadow-sm">
                              ⏳ Chờ bắt đầu
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Input
                            placeholder="Nhập mã bài kiểm tra"
                            value={quiz.quizCode}
                            readOnly
                            className="font-mono text-center font-bold text-xs sm:text-sm flex-1 sm:max-w-[140px]"
                          />
                          <Button 
                            onClick={() => router.push(`/quizzes/enter?code=${quiz.quizCode}`)}
                            className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-xl font-semibold px-4 py-2.5 sm:px-6 sm:py-6 text-sm sm:text-base"
                          >
                            🚪 <span className="hidden sm:inline">Vào phòng chờ</span><span className="sm:hidden">Vào phòng</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Quizzes */}
        {activeQuizzes.length > 0 && (
          <Card className="mb-4 sm:mb-6 border-0 shadow-soft bg-gradient-to-br from-green-50/50 via-emerald-50/50 to-teal-50/50 dark:from-green-900/10 dark:via-emerald-900/10 dark:to-teal-900/10">
            <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl md:text-2xl">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md shadow-glow-green animate-pulse flex-shrink-0">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">
                  ✨ Bài kiểm tra đang mở ({activeQuizzes.length})
                </span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
                Các bài kiểm tra bạn có thể làm ngay
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {activeQuizzes.map((quiz) => (
                  <Card 
                    key={quiz.id} 
                    className="border-2 border-green-300 dark:border-green-700 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 hover:shadow-md hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent line-clamp-2">
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">{quiz.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-white/60 dark:bg-gray-800/60 border border-green-200 dark:border-green-800">
                              <span className="text-muted-foreground">📁</span>
                              <span className="font-semibold truncate max-w-[120px] sm:max-w-none">{quiz.folder.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-white/60 dark:bg-gray-800/60 border border-green-200 dark:border-green-800">
                              <span className="text-muted-foreground">🔑</span>
                              <span className="font-mono font-bold">{quiz.quizCode}</span>
                            </div>
                          </div>
                        </div>
                        <Link href={
                          (quiz.status || 'pending') === 'active' 
                            ? `/quizzes/${quiz.id}/live`
                            : `/quizzes/${quiz.id}/lobby`
                        } className="w-full sm:w-auto">
                          <Button 
                            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-xl font-semibold px-4 py-2.5 sm:px-6 sm:py-6 text-sm sm:text-base"
                          >
                            {(quiz.status || 'pending') === 'active' ? '📝 Làm bài' : '🚪 Tham gia'}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ended Quizzes */}
        {endedQuizzes.length > 0 && (
          <Card className="mb-4 sm:mb-6 border-0 shadow-soft bg-gradient-to-br from-gray-50/50 via-slate-50/50 to-zinc-50/50 dark:from-gray-800/10 dark:via-slate-800/10 dark:to-zinc-800/10">
            <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl md:text-2xl">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-400 to-slate-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-gray-600 via-slate-600 to-zinc-600 bg-clip-text text-transparent font-bold">
                  ✅ Bài kiểm tra đã kết thúc ({endedQuizzes.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {endedQuizzes.map((quiz) => (
                  <Card 
                    key={quiz.id} 
                    className="border-2 border-gray-300 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-slate-50/80 dark:from-gray-800/20 dark:to-slate-800/20 opacity-75"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-muted-foreground line-clamp-2">
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">{quiz.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                              <span className="text-muted-foreground">📁</span>
                              <span className="font-semibold truncate max-w-[120px] sm:max-w-none">{quiz.folder.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                              <span className="text-muted-foreground">🔑</span>
                              <span className="font-mono font-bold">{quiz.quizCode}</span>
                            </div>
                          </div>
                          <div className="mt-2 sm:mt-3">
                            <Badge className="bg-gray-400 text-white px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold shadow-sm">
                              ✅ Đã kết thúc
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" disabled className="opacity-50 w-full sm:w-auto text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-6">
                          Đã kết thúc
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Quizzes */}
        {classDetail.quizzes.length === 0 && (
          <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8 md:p-12 text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 animate-bounce-slow">📝</div>
              <ClipboardCheck className="mx-auto h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-muted-foreground mb-4 sm:mb-6 opacity-50" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Chưa có bài kiểm tra
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2">
                Giáo viên chưa tạo bài kiểm tra nào cho lớp này. Hoặc nhập mã bài kiểm tra ở trên để tham gia.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Homework Section */}
        {!isLoadingHomework && (
          <>
            {homework.length > 0 && (
              <Card className="mb-4 sm:mb-6 border-0 shadow-soft bg-gradient-to-br from-orange-50/50 via-red-50/50 to-pink-50/50 dark:from-orange-900/10 dark:via-red-900/10 dark:to-pink-900/10">
                <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl md:text-2xl">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-xl sm:text-2xl">📚</span>
                    </div>
                    <span className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent font-bold">
                      📚 Bài tập về nhà ({homework.length})
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
                    Các bài tập giáo viên đã giao cho lớp
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    {homework.map((hw) => {
                      const now = new Date();
                      const deadline = new Date(hw.deadline);
                      const isExpired = deadline < now;
                      const isLocked = hw.status === 'locked' || isExpired;
                      const submission = hw.submissions?.[0];
                      const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded';

                      return (
                        <Card 
                          key={hw.id} 
                          className={`border-2 ${
                            isLocked 
                              ? 'border-gray-300 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/20 opacity-75' 
                              : 'border-orange-300 dark:border-orange-700 bg-gradient-to-r from-orange-50/80 to-red-50/80 dark:from-orange-900/20 dark:to-red-900/20 hover:shadow-md transition-all duration-300'
                          }`}
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-base sm:text-lg mb-1 sm:mb-2 ${
                                  isLocked 
                                    ? 'text-muted-foreground' 
                                    : 'bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent'
                                } line-clamp-2`}>
                                  {hw.title}
                                </h3>
                                {hw.description && (
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">{hw.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                                  <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg ${
                                    isLocked 
                                      ? 'bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700' 
                                      : 'bg-white/60 dark:bg-gray-800/60 border border-orange-200 dark:border-orange-800'
                                  }`}>
                                    <span className="text-muted-foreground">{hw.type === 'listening' ? '🎧' : '📖'}</span>
                                    <span className="font-semibold">{hw.type === 'listening' ? 'Nghe' : 'Đọc'}</span>
                                  </div>
                                  <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg ${
                                    isLocked 
                                      ? 'bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700' 
                                      : 'bg-white/60 dark:bg-gray-800/60 border border-orange-200 dark:border-orange-800'
                                  }`}>
                                    <span className="text-muted-foreground">⏰</span>
                                    <span className="font-semibold">{new Date(hw.deadline).toLocaleDateString('vi-VN')}</span>
                                  </div>
                                </div>
                                <div className="mt-2 sm:mt-3">
                                  <Badge className={`${
                                    isLocked 
                                      ? 'bg-gray-400' 
                                      : isSubmitted 
                                        ? 'bg-green-500' 
                                        : 'bg-orange-500'
                                  } text-white px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold shadow-sm`}>
                                    {isLocked ? '🔒 Đã khóa' : isSubmitted ? '✅ Đã nộp' : '📝 Chưa làm'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                {isLocked ? (
                                  <Button 
                                    variant="outline" 
                                    disabled
                                    className="w-full sm:w-auto opacity-50"
                                  >
                                    🔒 Đã khóa
                                  </Button>
                                ) : isSubmitted ? (
                                  <>
                                    <Button 
                                      onClick={() => {
                                        const submissionId = submission?.id;
                                        if (submissionId) {
                                          router.push(`/classes/${classId}/homework/${hw.id}/submissions/${submissionId}`);
                                        } else {
                                          router.push(`/classes/${classId}/homework/${hw.id}`);
                                        }
                                      }}
                                      className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-xl font-semibold px-4 py-2.5 sm:px-6 sm:py-6 text-sm sm:text-base"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Xem bài làm
                                    </Button>
                                    {!isExpired && (
                                      <Button 
                                        onClick={async () => {
                                          if (confirm('Bạn có chắc muốn làm lại bài tập này?')) {
                                            try {
                                              const res = await fetch(`/api/homework/${hw.id}/retry`, {
                                                method: 'POST',
                                                credentials: 'include',
                                              });
                                              const data = await res.json();
                                              if (!res.ok) throw new Error(data?.error || 'Retry failed');
                                              
                                              toast({
                                                title: 'Thành công',
                                                description: 'Bạn có thể làm lại bài tập',
                                              });
                                              
                                              // Refresh homework list
                                              fetchHomework();
                                              
                                              // Navigate to homework page
                                              router.push(`/classes/${classId}/homework/${hw.id}`);
                                            } catch (error: any) {
                                              toast({
                                                title: 'Lỗi',
                                                description: error.message || 'Không thể làm lại bài',
                                                variant: 'destructive',
                                              });
                                            }
                                          }
                                        }}
                                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-xl font-semibold px-4 py-2.5 sm:px-6 sm:py-6 text-sm sm:text-base border-none"
                                      >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Làm lại
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <Button 
                                    onClick={() => router.push(`/classes/${classId}/homework/${hw.id}`)}
                                    className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-xl font-semibold px-4 py-2.5 sm:px-6 sm:py-6 text-sm sm:text-base"
                                  >
                                    📝 Làm bài
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
        </div>
      </div>
    </AppShell>
  );
}

