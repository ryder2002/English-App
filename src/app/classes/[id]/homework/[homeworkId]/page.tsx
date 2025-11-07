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
    attemptNumber: number;
    answer?: string;
    answers?: string[];
    boxResults?: boolean[];
    status: string;
    submittedAt?: string;
    score?: number | null;
    timeSpentSeconds?: number;
    isCorrect?: boolean;
  }>;
  currentSubmission?: {
    id: number;
    attemptNumber: number;
    answer?: string;
    answers?: string[];
    boxResults?: boolean[];
    status: string;
    submittedAt?: string;
    score?: number | null;
    timeSpentSeconds?: number;
    isCorrect?: boolean;
  };
  boxes?: number;
  answerKey?: string | null;
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
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [boxes, setBoxes] = useState<string[]>([]);
  const [boxResults, setBoxResults] = useState<boolean[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const doRetry = async () => {
    try {
      const res = await fetch(`/api/homework/${homeworkId}/retry`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Retry failed');
      // Reset view
      setLastResult(null);
      setShowAnswerKey(false);
      setAnswer(''); // Keep answer field empty for student input
      // Refresh submission state
      fetchHomework();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message || 'Không thể làm lại bài', variant: 'destructive' });
    }
  };

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
      
      // Use currentSubmission for the current attempt
      const currentSubmission = data.currentSubmission || data.submissions?.[0];
      
      if (data.boxes && data.boxes > 0) {
        // Initialize boxes from current submission or empty strings
        const submitted = currentSubmission?.answers || [];
        const init = Array.from({ length: data.boxes }, (_, i) => submitted[i] || '');
        setBoxes(init);
        setAnswer('');
      } else {
        // fallback to editable text flow
        const submissionAnswer = currentSubmission?.answer;
        if (submissionAnswer) {
          setAnswer(submissionAnswer);
          if (typeof currentSubmission.score === 'number') {
            setLastResult(currentSubmission.score > 0);
          } else {
            setLastResult(null);
          }
        } else {
          // Don't pre-fill answer field, keep it empty for student input
          setAnswer('');
          setLastResult(null);
        }
      }

      // audio
      if (data.type === 'listening' && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.addEventListener('ended', () => setIsPlaying(false));
        setAudioElement(audio);
      }

      // If backend returns answerKey after submission, allow toggling
      if (data.answerKey) setShowAnswerKey(true); else setShowAnswerKey(false);
      if (currentSubmission?.boxResults) setBoxResults(currentSubmission.boxResults);
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
    // If using boxes
    const usingBoxes = Boolean(homework?.boxes && homework.boxes > 0);
    if (usingBoxes) {
      if (!boxes.some(b => (b || '').trim().length > 0)) {
        toast({ title: 'Lỗi', description: 'Vui lòng điền ít nhất một ô', variant: 'destructive' });
        return;
      }
    } else if (!answer.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập đáp án', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/homework/${homeworkId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(usingBoxes ? { answers: boxes } : { answer }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      if (Array.isArray(data.boxResults)) setBoxResults(data.boxResults);
      if (typeof data.isCorrect === 'boolean') setLastResult(data.isCorrect);

      fetchHomework();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Không thể nộp bài', variant: 'destructive' });
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
  const currentSubmission = homework.currentSubmission || homework.submissions?.[0];
  const isSubmitted = currentSubmission?.status === 'submitted' || currentSubmission?.status === 'graded';
  
  // Get submitted attempts (exclude in_progress)
  const submittedAttempts = homework.submissions?.filter(s => s.status === 'submitted' || s.status === 'graded') || [];

  const handleEditableInput = (e: React.FormEvent<HTMLDivElement>) => {
    setAnswer((e.target as HTMLDivElement).innerText);
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:p-6 lg:p-8">
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => router.push(`/classes/${classId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              {isSubmitted && !isLocked && (
                <Button variant="outline" onClick={doRetry}>
                  Làm lại
                </Button>
              )}
              {!isLocked && !isSubmitted && (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (
                    homework?.boxes && homework.boxes > 0 
                      ? !boxes.some(b => (b || '').trim().length > 0)
                      : !answer.trim()
                  )}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                </Button>
              )}
            </div>
          </div>

          <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-2">
                    {homework.title}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <Badge variant="outline">{homework.type === 'listening' ? '🎧 Nghe' : '📖 Đọc'}</Badge>
                    <Badge variant="outline">⏰ {deadline.toLocaleString('vi-VN')}</Badge>
                    {isExpired && <Badge variant="destructive">⚠️ Đã quá hạn</Badge>}
                    {isSubmitted && typeof currentSubmission?.score === 'number' && (
                      <Badge variant="outline">Điểm: {currentSubmission.score}/1</Badge>
                    )}
                    {currentSubmission?.attemptNumber && (
                      <Badge variant="outline">Lần {currentSubmission.attemptNumber}</Badge>
                    )}
                    {submittedAttempts.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowHistory(!showHistory)}
                        className="h-6 px-2 text-xs"
                      >
                        📋 Lịch sử ({submittedAttempts.length})
                      </Button>
                    )}
                  </div>
                </div>
                <Badge className={`${isLocked ? 'bg-gray-400' : isSubmitted ? 'bg-green-500' : 'bg-orange-500'} text-white`}>
                  {isLocked ? '🔒 Đã khóa' : isSubmitted ? '✅ Đã nộp' : '📝 Chưa nộp'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* History section */}
                {showHistory && submittedAttempts.length > 0 && (
                  <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      📋 Lịch sử làm bài
                    </label>
                    <div className="space-y-2">
                      {submittedAttempts.map((attempt) => (
                        <div key={attempt.id} className="p-3 bg-white dark:bg-gray-800 rounded border flex items-center justify-between">
                          <div>
                            <span className="font-medium">Lần {attempt.attemptNumber}</span>
                            {attempt.submittedAt && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(attempt.submittedAt).toLocaleString('vi-VN')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {typeof attempt.score === 'number' && (
                              <Badge variant={attempt.score >= 0.5 ? 'default' : 'destructive'}>
                                Điểm: {attempt.score}/1
                              </Badge>
                            )}
                            {attempt.timeSpentSeconds && (
                              <span className="text-xs text-muted-foreground">
                                {Math.floor(attempt.timeSpentSeconds / 60)}:{String(attempt.timeSpentSeconds % 60).padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {homework.type === 'listening' && homework.audioUrl && (
                  <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                    <Button
                      onClick={handlePlayPause}
                      disabled={isLocked}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {isPlaying ? 'Dừng' : 'Phát'}
                    </Button>
                    <audio src={homework.audioUrl} controls className="flex-1" />
                  </div>
                )}

                {/* Display content/promptText as read-only */}
                {(homework.content || homework.promptText || homework.processedAnswerText) && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Văn bản giao cho học viên (có chỗ trống)
                    </label>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 whitespace-pre-wrap text-base leading-7">
                      {homework.content || homework.promptText || homework.processedAnswerText}
                    </div>
                  </div>
                )}

                {/* Input area for boxes or textarea */}
                {homework.boxes && homework.boxes > 0 ? (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Điền đáp án vào các ô tương ứng
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {boxes.map((value, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground w-6">{idx + 1}.</div>
                          <input
                            className="flex-1 rounded-md border px-3 py-2 text-base bg-white dark:bg-gray-900/30"
                            value={value}
                            onChange={(e) => {
                              const next = [...boxes];
                              next[idx] = e.target.value;
                              setBoxes(next);
                            }}
                            disabled={isLocked || isSubmitted}
                            placeholder={`Điền đáp án ${idx + 1}`}
                          />
                          {boxResults && (
                            boxResults[idx] ? (
                              <span className="text-green-600 text-sm">✔</span>
                            ) : (
                              <span className="text-red-600 text-sm">✘</span>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                    {!isSubmitted && <p className="text-xs text-muted-foreground">Điền đáp án vào các ô tương ứng, sau đó nhấn Nộp bài.</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Đáp án của bạn
                    </label>
                    <Textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={isLocked || isSubmitted}
                      placeholder="Nhập đáp án của bạn tại đây..."
                      className={`min-h-[200px] w-full text-base leading-7 ${
                        isLocked || isSubmitted
                          ? 'bg-gray-50 dark:bg-gray-900/30'
                          : 'bg-white dark:bg-gray-900/30'
                      }`}
                    />
                    {!isSubmitted && (
                      <p className="text-xs text-muted-foreground">Nhập đáp án của bạn vào ô trên, sau đó nhấn Nộp bài.</p>
                    )}
                  </div>
                )}

                {/* Show answer key after submit */}
                {showAnswerKey && homework.answerKey && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Đáp án chuẩn</label>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 whitespace-pre-wrap">
                      {homework.answerKey}
                    </div>
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

