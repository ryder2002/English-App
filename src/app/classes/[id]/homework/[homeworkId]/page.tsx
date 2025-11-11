"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Play, Pause, Send, Eye, RotateCcw } from 'lucide-react';
import { SpeakingRecorder } from '@/components/speaking-recorder';
import { SpeakingHomeworkPlayer } from '@/components/speaking-homework-player';

interface Homework {
  id: number;
  title: string;
  description?: string;
  type: 'listening' | 'reading' | 'speaking';
  deadline: string;
  status: string;
  audioUrl?: string;
  promptText?: string | null;
  processedAnswerText?: string | null;
  content?: string | null;
  hideMode?: 'all' | 'random';
  speakingText?: string | null;
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
    transcribedText?: string;
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
    transcribedText?: string;
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

  // Derived states
  const currentSubmission = homework?.currentSubmission || homework?.submissions?.[0];
  const isSubmitted = currentSubmission?.status === 'submitted' || currentSubmission?.status === 'graded';
  const isLocked = homework?.status === 'locked';

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

      // Show success toast
      toast({
        title: 'Thành công',
        description: 'Đã nộp bài thành công!',
      });

      // Redirect to submission detail page if we have submission id
      if (data.submission?.id) {
        setTimeout(() => {
          router.push(`/classes/${classId}/homework/${homeworkId}/submissions/${data.submission.id}`);
        }, 500);
      } else {
        // Fallback: refresh data to show results
        await fetchHomework();
      }
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
  
  // Update derived states to include expiration
  const finalIsLocked = isLocked || isExpired;
  
  // Get submitted attempts (exclude in_progress)
  const submittedAttempts = homework.submissions?.filter(s => s.status === 'submitted' || s.status === 'graded') || [];

  const handleEditableInput = (e: React.FormEvent<HTMLDivElement>) => {
    setAnswer((e.target as HTMLDivElement).innerText);
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 md:p-6 lg:p-8 max-w-5xl">
          <div className="mb-3 sm:mb-4 md:mb-6 flex items-center justify-between gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push(`/classes/${classId}`)} className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {isSubmitted && currentSubmission && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      console.log('Current submission:', currentSubmission);
                      console.log('Redirecting to:', `/classes/${classId}/homework/${homeworkId}/submissions/${currentSubmission.id}`);
                      router.push(`/classes/${classId}/homework/${homeworkId}/submissions/${currentSubmission.id}`);
                    }}
                    className="h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-4"
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Xem bài làm
                  </Button>
                  {!isLocked && !isExpired && (
                    <Button 
                      onClick={doRetry} 
                      className="h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 border-none"
                    >
                      <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Làm lại
                    </Button>
                  )}
                </>
              )}
              {!isLocked && !isSubmitted && homework.type !== 'speaking' && (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (
                    homework?.boxes && homework.boxes > 0 
                      ? !boxes.some(b => (b || '').trim().length > 0)
                      : !answer.trim()
                  )}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-4"
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                </Button>
              )}
            </div>
          </div>

          <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-xl md:text-2xl lg:text-3xl mb-1 sm:mb-2 break-words">
                    {homework.title}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Badge variant="outline" className="text-xs">{homework.type === 'listening' ? '🎧 Nghe' : '📖 Đọc'}</Badge>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">⏰ {deadline.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</Badge>
                    {isExpired && <Badge variant="destructive" className="text-xs">⚠️ Quá hạn</Badge>}
                    {isSubmitted && typeof currentSubmission?.score === 'number' && (
                      <Badge variant="outline" className="text-xs">Điểm: {currentSubmission.score}/1</Badge>
                    )}
                    {currentSubmission?.attemptNumber && (
                      <Badge variant="outline" className="text-xs">Lần {currentSubmission.attemptNumber}</Badge>
                    )}
                  </div>
                </div>
                <Badge className={`${isLocked ? 'bg-gray-400' : isSubmitted ? 'bg-green-500' : 'bg-orange-500'} text-white text-xs sm:text-sm whitespace-nowrap flex-shrink-0`}>
                  {isLocked ? '🔒 Khóa' : isSubmitted ? '✅ Nộp' : '📝 Chưa'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="space-y-3 sm:space-y-4">
                {homework.type === 'listening' && homework.audioUrl && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                    <Button
                      onClick={handlePlayPause}
                      disabled={isLocked}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-9 sm:h-10 text-sm"
                    >
                      {isPlaying ? <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> : <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
                      {isPlaying ? 'Dừng' : 'Phát'}
                    </Button>
                    <audio src={homework.audioUrl} controls className="flex-1 w-full h-9 sm:h-10" />
                  </div>
                )}

                {/* Display content/promptText as read-only for listening/reading */}
                {homework.type !== 'speaking' && (homework.content || homework.promptText || homework.processedAnswerText) && (
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Văn bản giao cho học viên (có chỗ trống)
                    </label>
                    <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 whitespace-pre-wrap text-sm sm:text-base leading-6 sm:leading-7 overflow-x-auto">
                      {homework.content || homework.promptText || homework.processedAnswerText}
                    </div>
                  </div>
                )}

                {/* Speaking homework component */}
                {homework.type === 'speaking' && homework.speakingText && (
                  <SpeakingHomeworkPlayer
                    speakingText={homework.speakingText}
                    isSubmitted={isSubmitted}
                    isLocked={isLocked}
                    transcribedText={currentSubmission?.transcribedText}
                    score={currentSubmission?.score || undefined}
                    onSubmitAction={async (audioBlob: Blob, transcribedText: string) => {
                      setIsSubmitting(true);
                      try {
                        // 1. Get signed URL from our server
                        const urlRes = await fetch('/api/homework/submission/generate-upload-url', {
                          method: 'POST',
                          credentials: 'include',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            homeworkId: homework.id,
                            fileType: audioBlob.type,
                          }),
                        });
                        if (!urlRes.ok) throw new Error('Could not get upload URL.');
                        const { signedUrl, audioUrl } = await urlRes.json();

                        // 2. Upload audio directly to R2
                        await fetch(signedUrl, {
                          method: 'PUT',
                          body: audioBlob,
                          headers: { 'Content-Type': audioBlob.type },
                        });

                        // 3. Create the submission record in our database
                        const createSubRes = await fetch('/api/homework/submission/create', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                homeworkId: homework.id,
                                audioUrl,
                                transcribedText,
                            }),
                        });
                        if (!createSubRes.ok) throw new Error('Could not create submission.');
                        const { submissionId } = await createSubRes.json();

                        // 4. Trigger AI assessment (fire and forget)
                        fetch(`/api/homework/submission/${submissionId}/assess`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ audioUrl, transcribedText }),
                        });

                        toast({
                          title: 'Nộp bài thành công!',
                          description: 'Bài của bạn đang được AI phân tích. Kết quả sẽ có sau vài giây.',
                        });

                        // 5. Redirect to the submission page to see results
                        router.push(`/classes/${classId}/homework/${homeworkId}/submissions/${submissionId}`);

                      } catch (error: any) {
                        console.error('Submission process failed:', error);
                        toast({
                          title: 'Lỗi',
                          description: error.message || 'Không thể nộp bài',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  />
                )}

                {/* Input area for boxes or textarea (listening/reading only) */}
                {homework.type !== 'speaking' && (homework.boxes && homework.boxes > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Điền đáp án vào các ô tương ứng
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {boxes.map((value, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground w-5 sm:w-6 flex-shrink-0">{idx + 1}.</div>
                          <input
                            className="flex-1 rounded-md border px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base bg-white dark:bg-gray-900/30 min-w-0"
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
                              <span className="text-green-600 text-sm flex-shrink-0">✔</span>
                            ) : (
                              <span className="text-red-600 text-sm flex-shrink-0">✘</span>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                    {!isSubmitted && <p className="text-xs text-muted-foreground">Điền đáp án vào các ô tương ứng, sau đó nhấn Nộp bài.</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Đáp án của bạn
                    </label>
                    <Textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={isLocked || isSubmitted}
                      placeholder="Nhập đáp án của bạn tại đây..."
                      className={`min-h-[150px] sm:min-h-[200px] w-full text-sm sm:text-base leading-6 sm:leading-7 ${
                        isLocked || isSubmitted
                          ? 'bg-gray-50 dark:bg-gray-900/30'
                          : 'bg-white dark:bg-gray-900/30'
                      }`}
                    />
                    {!isSubmitted && (
                      <p className="text-xs text-muted-foreground">Nhập đáp án của bạn vào ô trên, sau đó nhấn Nộp bài.</p>
                    )}
                  </div>
                ))}

                {/* Show answer key after submit */}
                {showAnswerKey && homework.answerKey && (
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Đáp án chuẩn</label>
                    <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 whitespace-pre-wrap text-sm sm:text-base overflow-x-auto">
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

