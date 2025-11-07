"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Play, Pause, Send } from 'lucide-react';

interface Homework {
  id: number;
  title: string;
  description?: string;
  type: 'listening' | 'reading';
  deadline: string;
  status: string;
  audioUrl?: string;
  promptText?: string | null;
  processedAnswerText?: string | null;
  content?: string | null;
  hideMode?: 'all' | 'random';
  submissions: Array<{
    id: number;
    answer?: string;
    status: string;
    submittedAt?: string;
    score?: number | null;
    timeSpentSeconds?: number;
    isCorrect?: boolean;
  }>;
}

export default function HomeworkPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  const homeworkId = params?.homeworkId as string;

  const [homework, setHomework] = useState<Homework | null>(null);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [lastResult, setLastResult] = useState<boolean | null>(null);

  useEffect(() => {
    if (!homeworkId) {
      setIsLoading(false);
      return;
    }
    fetchHomework();
  }, [homeworkId]);

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  const fetchHomework = async () => {
    try {
      const res = await fetch(`/api/homework/${homeworkId}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load homework');
      }

      const data = await res.json();
      setHomework(data);
      
      // Load existing submission if any
      if (data.submissions && data.submissions.length > 0) {
        setAnswer(data.submissions[0].answer || '');
        if (typeof data.submissions[0].score === 'number') {
          setLastResult(data.submissions[0].score > 0);
        } else {
          setLastResult(null);
        }
      } else {
        setLastResult(null);
      }

      // Initialize audio element
      if (data.type === 'listening' && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.addEventListener('ended', () => setIsPlaying(false));
        setAudioElement(audio);
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải bài tập',
        variant: 'destructive',
      });
      router.push(`/classes/${classId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập đáp án',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/homework/${homeworkId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answer }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      if (typeof data.isCorrect === 'boolean') {
        setLastResult(data.isCorrect);
        toast({
          title: data.isCorrect ? '🎉 Chính xác!' : '❌ Chưa chính xác',
          description: data.isCorrect
            ? 'Bạn đã hoàn thành bài tập chính xác.'
            : 'Đáp án chưa khớp với đáp án chuẩn. Hãy kiểm tra lại và thử lần nữa.',
          variant: data.isCorrect ? 'default' : 'destructive',
        });
      } else {
        toast({
          title: 'Thành công',
          description: 'Đã nộp bài tập',
        });
      }

      // Refresh homework to show updated status
      fetchHomework();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể nộp bài',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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

  if (!homework) {
    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Không tìm thấy bài tập.</p>
              <Button onClick={() => router.push(`/classes/${classId}`)} className="mt-4">
                Quay lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const now = new Date();
  const deadline = new Date(homework.deadline);
  const isExpired = deadline < now;
  const isLocked = homework.status === 'locked' || isExpired;
  const submission = homework.submissions?.[0];
  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded';
  const promptForStudent = homework.promptText ?? homework.processedAnswerText ?? '';

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:p-6 lg:p-8">
          <div className="mb-4 sm:mb-6">
            <Button variant="outline" size="icon" onClick={() => router.push(`/classes/${classId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm mb-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-2">
                    {homework.title}
                  </CardTitle>
                  {homework.description && (
                    <CardDescription className="text-sm sm:text-base">
                      {homework.description}
                    </CardDescription>
                  )}
                </div>
                <Badge className={`${
                  isLocked 
                    ? 'bg-gray-400' 
                    : isSubmitted 
                      ? 'bg-green-500' 
                      : 'bg-orange-500'
                } text-white`}>
                  {isLocked ? '🔒 Đã khóa' : isSubmitted ? '✅ Đã nộp' : '📝 Chưa nộp'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline">{homework.type === 'listening' ? '🎧 Nghe' : '📖 Đọc'}</Badge>
                  <Badge variant="outline">⏰ Deadline: {new Date(homework.deadline).toLocaleString('vi-VN')}</Badge>
                  {isExpired && (
                    <Badge variant="destructive">⚠️ Đã quá hạn</Badge>
                  )}
                  {typeof submission?.score === 'number' && (
                    <Badge variant="outline">Điểm: {submission.score}/1</Badge>
                  )}
                </div>

                {promptForStudent && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Đoạn văn giao cho bạn</label>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 whitespace-pre-wrap">
                      {promptForStudent}
                    </div>
                  </div>
                )}

                {homework.type === 'listening' && (
                  <>
                    {homework.audioUrl && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Audio</label>
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                          <Button
                            onClick={handlePlayPause}
                            disabled={isLocked}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          >
                            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                            {isPlaying ? 'Dừng' : 'Phát'}
                          </Button>
                          <audio
                            ref={(el) => {
                              if (el && !audioElement) {
                                setAudioElement(el);
                                el.addEventListener('ended', () => setIsPlaying(false));
                              }
                            }}
                            src={homework.audioUrl}
                            controls
                            className="flex-1"
                            disabled={isLocked}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {homework.hideMode === 'all' 
                          ? 'Nghe và chép lại nội dung audio' 
                          : 'Điền vào chỗ trống'}
                      </label>
                      <Textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Nhập đáp án của bạn..."
                        rows={10}
                        disabled={isLocked || isSubmitted}
                        className="text-base"
                      />
                      {isSubmitted && submission?.answer && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-muted-foreground mb-1">Đáp án đã nộp:</p>
                          <p className="text-sm whitespace-pre-wrap">{submission.answer}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {homework.type === 'reading' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nội dung bài đọc</label>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                      <p className="whitespace-pre-wrap">{homework.content || 'Nội dung đang được cập nhật...'}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tính năng bài tập đọc sẽ được phát triển thêm sau
                    </p>
                  </div>
                )}

                {!isLocked && !isSubmitted && (
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !answer.trim()}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                    </Button>
                  </div>
                )}

                {isSubmitted && typeof lastResult === 'boolean' && (
                  <div className={`p-4 rounded-lg border ${
                    lastResult
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {lastResult
                      ? 'Bạn đã nộp đáp án chính xác!'
                      : 'Đáp án của bạn chưa khớp với đáp án chuẩn. Bạn có thể thử lại nếu được phép.'}
                  </div>
                )}

                {isLocked && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      ⚠️ Bài tập này đã bị khóa. Deadline đã qua hoặc giáo viên đã khóa bài tập.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

