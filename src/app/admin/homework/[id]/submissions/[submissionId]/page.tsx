"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SpeakingResultDisplay } from '@/components/speaking-result-display';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubmissionDetail {
  id: number;
  user: { id: number; name?: string; email: string };
  homework: {
    id: number;
    title: string;
    type: string;
    speakingText?: string;
  };
  answer?: string | null;
  transcribedText?: string | null;
  score?: number | null;
  status: string;
  startedAt?: string;
  submittedAt?: string;
  lastActivityAt?: string;
  timeSpentSeconds?: number;
  audioDataUrl?: string; // Base64 audio URL
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const homeworkId = params?.id as string;
  const submissionId = params?.submissionId as string;
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa bài nộp này? Hành động này không thể hoàn tác.')) {
      return;
    }

    setIsDeleting(true);
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

      router.push(`/admin/homework/${homeworkId}`);
    } catch (e: any) {
      toast({
        title: 'Lỗi',
        description: e.message || 'Không thể xóa bài nộp',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (!detail) return <div className="p-6">Không tìm thấy bài nộp.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Chi tiết bài nộp
            </h1>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Đang xóa...' : 'Xóa bài nộp'}
          </Button>
        </div>

        <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Học viên: {detail.user.name || detail.user.email}</CardTitle>
            <CardDescription>
              Email: {detail.user.email}
              {detail.homework && (
                <div className="mt-1">
                  Bài tập: {detail.homework.title} ({detail.homework.type === 'speaking' ? '🎤 Speaking' : detail.homework.type})
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">Trạng thái: {detail.status === 'graded' ? '✅ Đã chấm' : detail.status === 'submitted' ? '✅ Đã nộp' : '📝 Đang làm'}</Badge>
              {typeof detail.score === 'number' && (
                <Badge 
                  variant={detail.score >= 0.7 ? 'default' : detail.score >= 0.5 ? 'secondary' : 'destructive'}
                  className="text-base"
                >
                  Điểm: {Math.round(detail.score * 100)}%
                </Badge>
              )}
              {detail.timeSpentSeconds !== undefined && <Badge variant="outline">Thời gian: {Math.floor(detail.timeSpentSeconds / 60)}:{(detail.timeSpentSeconds % 60).toString().padStart(2, '0')}</Badge>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div>Bắt đầu: {detail.startedAt ? new Date(detail.startedAt).toLocaleString('vi-VN') : '-'}</div>
              <div>Nộp lúc: {detail.submittedAt ? new Date(detail.submittedAt).toLocaleString('vi-VN') : '-'}</div>
              <div>Hoạt động cuối: {detail.lastActivityAt ? new Date(detail.lastActivityAt).toLocaleString('vi-VN') : '-'}</div>
            </div>

            {/* Speaking homework - show detailed comparison */}
            {detail.homework?.type === 'speaking' && detail.homework.speakingText && detail.transcribedText && (
              <div className="space-y-4">
                <div className="text-sm font-medium">� Phân tích chi tiết:</div>
                <SpeakingResultDisplay
                  originalText={detail.homework.speakingText}
                  transcribedText={detail.transcribedText}
                  score={detail.score || 0}
                  submissionId={detail.id}
                />
              </div>
            )}

            {/* Regular homework answer */}
            {detail.homework?.type !== 'speaking' && detail.answer && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Đáp án học viên</div>
                <div className="p-4 rounded-lg border bg-white dark:bg-gray-900/30 whitespace-pre-wrap">
                  {detail.answer || <span className="text-muted-foreground">(Trống)</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
