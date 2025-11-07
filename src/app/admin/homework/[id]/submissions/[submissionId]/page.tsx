"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

interface SubmissionDetail {
  id: number;
  user: { id: number; name?: string; email: string };
  answer?: string | null;
  score?: number | null;
  status: string;
  startedAt?: string;
  submittedAt?: string;
  lastActivityAt?: string;
  timeSpentSeconds?: number;
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const homeworkId = params?.id as string;
  const submissionId = params?.submissionId as string;
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/homework/${homeworkId}/submissions/${submissionId}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load');
        setDetail({
          ...data,
          startedAt: data.startedAt ? new Date(data.startedAt).toISOString() : undefined,
          submittedAt: data.submittedAt ? new Date(data.submittedAt).toISOString() : undefined,
          lastActivityAt: data.lastActivityAt ? new Date(data.lastActivityAt).toISOString() : undefined,
        });
      } catch (e: any) {
        setError(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [homeworkId, submissionId]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (!detail) return <div className="p-6">Không tìm thấy bài nộp.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Chi tiết bài nộp
          </h1>
        </div>

        <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Học viên: {detail.user.name || detail.user.email}</CardTitle>
            <CardDescription>Email: {detail.user.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">Trạng thái: {detail.status === 'graded' ? '✅ Đã chấm' : detail.status === 'submitted' ? '✅ Đã nộp' : '📝 Đang làm'}</Badge>
              {typeof detail.score === 'number' && <Badge variant="outline">Điểm: {detail.score}/1</Badge>}
              {detail.timeSpentSeconds !== undefined && <Badge variant="outline">Thời gian: {detail.timeSpentSeconds}s</Badge>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div>Bắt đầu: {detail.startedAt ? new Date(detail.startedAt).toLocaleString('vi-VN') : '-'}</div>
              <div>Nộp lúc: {detail.submittedAt ? new Date(detail.submittedAt).toLocaleString('vi-VN') : '-'}</div>
              <div>Hoạt động cuối: {detail.lastActivityAt ? new Date(detail.lastActivityAt).toLocaleString('vi-VN') : '-'}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Đáp án học viên</div>
              <div className="p-4 rounded-lg border bg-white dark:bg-gray-900/30 whitespace-pre-wrap">
                {detail.answer || <span className="text-muted-foreground">(Trống)</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
