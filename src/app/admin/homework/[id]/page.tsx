"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { HomeworkSubmissions } from '@/components/homework-submissions';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

interface Submission {
  id: number;
  answer?: string;
  status: string;
  submittedAt?: string;
  user: {
    id: number;
    name?: string;
    email: string;
  };
}

interface Homework {
  id: number;
  title: string;
  description?: string;
  type: 'listening' | 'reading' | 'speaking';
  deadline: string;
  status: string;
  audioUrl?: string;
  answerText?: string;
  speakingText?: string;
  hideMode?: 'all' | 'random';
  promptText?: string;
  clazz: {
    id: number;
    name: string;
    classCode: string;
  };
  submissions: Submission[];
  _count: {
    submissions: number;
  };
}

export default function HomeworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const homeworkId = params?.id as string;

  const [homework, setHomework] = useState<Homework | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!homeworkId) {
      setIsLoading(false);
      return;
    }
    fetchHomework();
  }, [homeworkId]);

  const fetchHomework = async () => {
    try {
      const res = await fetch(`/api/admin/homework/${homeworkId}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load homework');
      }

      const data = await res.json();
      setHomework(data);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải bài tập',
        variant: 'destructive',
      });
      router.push('/admin/homework');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubmission = async (submissionId: number, userName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa bài nộp của "${userName}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/homework/${homeworkId}/submissions/${submissionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to delete');

      toast({
        title: 'Thành công',
        description: 'Đã xóa bài nộp',
      });

      // Refresh homework data
      fetchHomework();
    } catch (e: any) {
      toast({
        title: 'Lỗi',
        description: e.message || 'Không thể xóa bài nộp',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">Đang tải...</div>
    );
  }

  if (!homework) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Không tìm thấy bài tập.</p>
            <Button onClick={() => router.push('/admin/homework')} className="mt-4">
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const deadline = new Date(homework.deadline);
  const isExpired = deadline < now;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
            Chi tiết Bài tập
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>{homework.title}</CardTitle>
              {homework.description && (
                <CardDescription>{homework.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Loại:</span>
                  <Badge>{homework.type === 'listening' ? '🎧 Nghe' : '📖 Đọc'}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Lớp:</span>
                  <span>{homework.clazz.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Deadline:</span>
                  <span>{new Date(homework.deadline).toLocaleString('vi-VN')}</span>
                  {isExpired && <Badge variant="destructive">⚠️ Đã quá hạn</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Trạng thái:</span>
                  <Badge className={homework.status === 'active' ? 'bg-green-500' : homework.status === 'locked' ? 'bg-red-500' : 'bg-gray-500'}>
                    {homework.status === 'active' ? '✅ Đang mở' : homework.status === 'locked' ? '🔒 Đã khóa' : '📦 Đã lưu trữ'}
                  </Badge>
                </div>
                {homework.type === 'listening' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Chế độ ẩn:</span>
                      <Badge variant="outline">
                        {homework.hideMode === 'all' ? 'Ẩn toàn bộ' : 'Ẩn ngẫu nhiên'}
                      </Badge>
                    </div>
                    {homework.promptText && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Văn bản giao cho học viên:</span>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg border">
                          <p className="text-sm whitespace-pre-wrap">{homework.promptText}</p>
                        </div>
                      </div>
                    )}
                    {homework.audioUrl && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Audio:</span>
                        <audio src={homework.audioUrl} controls className="w-full" />
                      </div>
                    )}
                  </>
                )}

                {homework.type === 'reading' && homework.promptText && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Văn bản giao cho học viên:</span>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg border">
                      <p className="text-sm whitespace-pre-wrap">{homework.promptText}</p>
                    </div>
                  </div>
                )}

                {homework.type === 'speaking' && homework.speakingText && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Văn bản để đọc (Speaking):</span>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-sm whitespace-pre-wrap">{homework.speakingText}</p>
                    </div>
                  </div>
                )}

                {homework.answerText && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Đáp án đầy đủ:</span>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm whitespace-pre-wrap">{homework.answerText}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Thống kê</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{homework._count.submissions}</div>
                  <div className="text-sm text-muted-foreground">Tổng số bài nộp</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {homework.submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Đã nộp</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {homework.submissions.filter(s => s.status === 'in_progress').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Đang làm</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Regular Homework Submissions */}
        {homework.type !== 'speaking' && (
          <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Danh sách bài nộp ({homework.submissions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {homework.submissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có học viên nào nộp bài
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Học viên</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Thời gian nộp</TableHead>
                        <TableHead>Đáp án</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {homework.submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{submission.user.name || submission.user.email}</div>
                              <div className="text-xs text-muted-foreground">{submission.user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              submission.status === 'submitted' || submission.status === 'graded'
                                ? 'bg-green-500'
                                : 'bg-yellow-500'
                            }>
                              {submission.status === 'submitted' ? '✅ Đã nộp' : submission.status === 'graded' ? '✅ Đã chấm' : '📝 Đang làm'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {submission.submittedAt
                              ? new Date(submission.submittedAt).toLocaleString('vi-VN')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {submission.answer ? (
                              <div className="max-w-md">
                                <p className="text-sm whitespace-pre-wrap line-clamp-3">{submission.answer}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/admin/homework/${homework.id}/submissions/${submission.id}`}>
                                <Button variant="outline" size="sm">Xem chi tiết</Button>
                              </Link>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteSubmission(submission.id, submission.user.name || submission.user.email)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Speaking Homework Submissions */}
        <HomeworkSubmissions 
          homeworkId={homework.id} 
          homeworkType={homework.type}
        />
      </div>
    </div>
  );
}

