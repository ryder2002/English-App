"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Users, ClipboardCheck, Calendar, Plus } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!classId) {
      setIsLoading(false);
      return;
    }

    fetchClassDetail();
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
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {/* Header với gradient */}
          <div className="mb-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.back()}
                className="rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-glow">
                  <span className="text-2xl">🎓</span>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {classDetail.name}
                  </h1>
                  {classDetail.description && (
                    <p className="text-muted-foreground mt-2 text-base">{classDetail.description}</p>
                  )}
                </div>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleLeaveClass}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl font-semibold px-6 py-6"
              >
                🚪 Rời lớp học
              </Button>
            </div>
          </div>

          {/* Class Info Cards với gradients */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="border-0 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{classDetail._count.members}</div>
                    <div className="text-sm font-semibold text-muted-foreground">👥 Thành viên</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                    <ClipboardCheck className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{classDetail._count.quizzes}</div>
                    <div className="text-sm font-semibold text-muted-foreground">📝 Bài kiểm tra</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-muted-foreground">🔑 Mã lớp</div>
                  <div className="font-mono text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {classDetail.classCode}
                  </div>
                  <div className="text-sm text-muted-foreground pt-2 border-t border-gray-200 dark:border-gray-700">
                    👨‍🏫 Giáo viên: <span className="font-semibold">{classDetail.teacher.name || classDetail.teacher.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Pending Quizzes */}
        {pendingQuizzes.length > 0 && (
          <Card className="mb-6 border-0 shadow-soft bg-gradient-to-br from-yellow-50/50 via-orange-50/50 to-amber-50/50 dark:from-yellow-900/10 dark:via-orange-900/10 dark:to-amber-900/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md animate-pulse">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-yellow-600 via-orange-600 to-amber-600 bg-clip-text text-transparent font-bold">
                  ⏳ Bài kiểm tra chờ bắt đầu ({pendingQuizzes.length})
                </span>
              </CardTitle>
              <CardDescription className="text-base">
                Các bài kiểm tra đang chờ giáo viên bắt đầu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingQuizzes.map((quiz) => (
                  <Card 
                    key={quiz.id} 
                    className="border-2 border-yellow-300 dark:border-yellow-700 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 dark:from-yellow-900/20 dark:to-orange-900/20 hover:shadow-md transition-all duration-300"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2 bg-gradient-to-r from-yellow-700 to-orange-700 bg-clip-text text-transparent">
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-yellow-200 dark:border-yellow-800">
                              <span className="text-muted-foreground">📁 Thư mục:</span>
                              <span className="font-semibold">{quiz.folder.name}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-yellow-200 dark:border-yellow-800">
                              <span className="text-muted-foreground">🔑 Mã:</span>
                              <span className="font-mono font-bold">{quiz.quizCode}</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 font-semibold shadow-sm">
                              ⏳ Chờ bắt đầu
                            </Badge>
                          </div>
                        </div>
                        <Link href={`/quizzes/${quiz.id}/lobby`}>
                          <Button 
                            className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl font-semibold px-6 py-6"
                          >
                            🚪 Tham gia phòng chờ
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

        {/* Active Quizzes */}
        {activeQuizzes.length > 0 && (
          <Card className="mb-6 border-0 shadow-soft bg-gradient-to-br from-green-50/50 via-emerald-50/50 to-teal-50/50 dark:from-green-900/10 dark:via-emerald-900/10 dark:to-teal-900/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md shadow-glow-green animate-pulse">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">
                  ✨ Bài kiểm tra đang mở ({activeQuizzes.length})
                </span>
              </CardTitle>
              <CardDescription className="text-base">
                Các bài kiểm tra bạn có thể làm ngay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeQuizzes.map((quiz) => (
                  <Card 
                    key={quiz.id} 
                    className="border-2 border-green-300 dark:border-green-700 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 hover:shadow-md hover:scale-[1.02] transition-all duration-300"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2 bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-green-200 dark:border-green-800">
                              <span className="text-muted-foreground">📁 Thư mục:</span>
                              <span className="font-semibold">{quiz.folder.name}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-green-200 dark:border-green-800">
                              <span className="text-muted-foreground">🔑 Mã:</span>
                              <span className="font-mono font-bold">{quiz.quizCode}</span>
                            </div>
                          </div>
                        </div>
                        <Link href={
                          (quiz.status || 'pending') === 'active' 
                            ? `/quizzes/${quiz.id}/live`
                            : `/quizzes/${quiz.id}/lobby`
                        }>
                          <Button 
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl font-semibold px-6 py-6"
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
          <Card className="mb-6 border-0 shadow-soft bg-gradient-to-br from-gray-50/50 via-slate-50/50 to-zinc-50/50 dark:from-gray-800/10 dark:via-slate-800/10 dark:to-zinc-800/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-400 to-slate-500 flex items-center justify-center shadow-md">
                  <ClipboardCheck className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-gray-600 via-slate-600 to-zinc-600 bg-clip-text text-transparent font-bold">
                  ✅ Bài kiểm tra đã kết thúc ({endedQuizzes.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {endedQuizzes.map((quiz) => (
                  <Card 
                    key={quiz.id} 
                    className="border-2 border-gray-300 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-slate-50/80 dark:from-gray-800/20 dark:to-slate-800/20 opacity-75"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2 text-muted-foreground">
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                              <span className="text-muted-foreground">📁 Thư mục:</span>
                              <span className="font-semibold">{quiz.folder.name}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                              <span className="text-muted-foreground">🔑 Mã:</span>
                              <span className="font-mono font-bold">{quiz.quizCode}</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <Badge className="bg-gray-400 text-white px-3 py-1 font-semibold shadow-sm">
                              ✅ Đã kết thúc
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" disabled className="opacity-50">
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
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4 animate-bounce-slow">📝</div>
              <ClipboardCheck className="mx-auto h-16 w-16 text-muted-foreground mb-6 opacity-50" />
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Chưa có bài kiểm tra
              </h3>
              <p className="text-muted-foreground text-lg">
                Giáo viên chưa tạo bài kiểm tra nào cho lớp này. Hoặc nhập mã bài kiểm tra ở trên để tham gia.
              </p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </AppShell>
  );
}

