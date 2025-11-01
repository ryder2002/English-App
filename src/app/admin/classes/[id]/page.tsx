"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, ClipboardCheck, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface ClassDetail {
  id: number;
  name: string;
  description?: string;
  classCode: string;
  teacherId: number;
  createdAt: string;
  quizzes: Array<{
    id: number;
    title: string;
    quizCode: string;
    status: string;
  }>;
  members: Array<{
    id: number;
    userId: number;
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

export default function AdminClassDetailPage() {
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
      const res = await fetch(`/api/admin/classes/${classId}`, {
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
      router.push('/admin/classes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number, userId: number, userName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa ${userName || 'học viên này'} khỏi lớp học?`)) return;

    try {
      const res = await fetch(`/api/admin/classes/${classId}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Không thể xóa học viên');
      }

      toast({
        title: 'Thành công',
        description: 'Đã xóa học viên khỏi lớp học',
      });

      // Refresh class detail
      fetchClassDetail();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể xóa học viên',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (!classDetail) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Không tìm thấy lớp học.</p>
            <Button onClick={() => router.push('/admin/classes')} className="mt-4">
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{classDetail.name}</h1>
          {classDetail.description && (
            <p className="text-muted-foreground mt-1">{classDetail.description}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Thành viên ({classDetail._count?.members || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!classDetail.members || classDetail.members.length === 0) ? (
              <p className="text-muted-foreground text-sm">Lớp chưa có thành viên nào.</p>
            ) : (
              <div className="space-y-2">
                {classDetail.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {(member.user.name || member.user.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{member.user.name || member.user.email}</div>
                        <div className="text-xs text-muted-foreground">{member.user.email}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id, member.userId, member.user.name || member.user.email)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Bài kiểm tra ({classDetail._count?.quizzes || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!classDetail.quizzes || classDetail.quizzes.length === 0) ? (
              <p className="text-muted-foreground text-sm">Lớp chưa có bài kiểm tra nào.</p>
            ) : (
              <div className="space-y-2">
                {classDetail.quizzes.map((quiz) => (
                  <Link
                    key={quiz.id}
                    href={`/admin/tests/${quiz.id}`}
                    className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition"
                  >
                    <div className="font-medium">{quiz.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">Mã: {quiz.quizCode}</div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin lớp học</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Mã lớp:</span>
              <div className="font-mono text-lg">{classDetail.classCode}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Ngày tạo:</span>
              <div>{new Date(classDetail.createdAt).toLocaleDateString('vi-VN')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
