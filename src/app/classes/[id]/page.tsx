"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Users, ClipboardCheck, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{classDetail.name}</h1>
            {classDetail.description && (
              <p className="text-muted-foreground mt-1">{classDetail.description}</p>
            )}
          </div>
          <Button variant="destructive" onClick={handleLeaveClass}>
            Rời lớp học
          </Button>
        </div>

        {/* Class Info */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{classDetail._count.members}</div>
                  <div className="text-sm text-muted-foreground">Thành viên</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ClipboardCheck className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{classDetail._count.quizzes}</div>
                  <div className="text-sm text-muted-foreground">Bài kiểm tra</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Mã lớp</div>
                <div className="font-mono text-lg font-semibold">{classDetail.classCode}</div>
                <div className="text-sm text-muted-foreground mt-2">Giáo viên: {classDetail.teacher.name || classDetail.teacher.email}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Quizzes */}
        {pendingQuizzes.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Bài kiểm tra chờ bắt đầu ({pendingQuizzes.length})
              </CardTitle>
              <CardDescription>
                Các bài kiểm tra đang chờ giáo viên bắt đầu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingQuizzes.map((quiz) => (
                  <Card key={quiz.id} className="opacity-75 bg-yellow-50 dark:bg-yellow-950/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{quiz.title}</h3>
                          {quiz.description && (
                            <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Thư mục: {quiz.folder.name}</span>
                            <span className="font-mono">Mã: {quiz.quizCode}</span>
                          </div>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-medium">
                              Chờ bắt đầu
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" disabled>
                          Chờ giáo viên
                        </Button>
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Bài kiểm tra đang mở ({activeQuizzes.length})
              </CardTitle>
              <CardDescription>
                Các bài kiểm tra bạn có thể làm ngay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeQuizzes.map((quiz) => (
                  <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{quiz.title}</h3>
                          {quiz.description && (
                            <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Thư mục: {quiz.folder.name}</span>
                            <span className="font-mono">Mã: {quiz.quizCode}</span>
                          </div>
                        </div>
                        <Link href={
                          (quiz.status || 'pending') === 'active' 
                            ? `/quizzes/${quiz.id}/live`
                            : `/quizzes/${quiz.id}/lobby`
                        }>
                          <Button>
                            {(quiz.status || 'pending') === 'active' ? 'Làm bài' : 'Tham gia'}
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Bài kiểm tra đã kết thúc ({endedQuizzes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {endedQuizzes.map((quiz) => (
                  <Card key={quiz.id} className="opacity-60">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{quiz.title}</h3>
                          {quiz.description && (
                            <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Thư mục: {quiz.folder.name}</span>
                            <span className="font-mono">Mã: {quiz.quizCode}</span>
                          </div>
                        </div>
                        <Button variant="outline" disabled>
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
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có bài kiểm tra</h3>
              <p className="text-muted-foreground">
                Giáo viên chưa tạo bài kiểm tra nào cho lớp này.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

