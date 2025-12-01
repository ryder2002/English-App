"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TraditionalSpeakingResult } from '@/components/traditional-speaking-result';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubmissionDetail {
  id: number;
  homework: {
    id: number;
    title: string;
    type: string;
    speakingText?: string;
    answerBoxes?: any; // Correct answers for listening
  };
  answer?: string | null;
  answers?: string[]; // Student answers for listening
  boxResults?: boolean[]; // Correct/wrong results for listening
  transcribedText?: string | null;
  score?: number | null;
  status: string;
  attemptNumber: number;
  startedAt?: string;
  submittedAt?: string;
  timeSpentSeconds?: number;
  audioDataUrl?: string;
  audioUrl?: string; // R2 audio URL
  voiceAnalysis?: any; // AI assessment results for speaking homework
}

export default function StudentSubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  const homeworkId = params?.homeworkId as string;
  const submissionId = params?.submissionId as string;

  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/homework/${homeworkId}/submission/${submissionId}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load');

        // Parse voiceAnalysis if it's a JSON string
        let parsedVoiceAnalysis = data.voiceAnalysis;
        if (typeof data.voiceAnalysis === 'string') {
          try {
            parsedVoiceAnalysis = JSON.parse(data.voiceAnalysis);
          } catch (e) {
            console.error('Failed to parse voiceAnalysis:', e);
          }
        }

        setDetail({
          ...data,
          voiceAnalysis: parsedVoiceAnalysis
        });
      } catch (e: any) {
        setError(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [homeworkId, submissionId]);

  const handleRetry = async () => {
    if (!confirm('Bạn có chắc muốn làm lại bài này? Điểm cũ sẽ được giữ lại trong lịch sử.')) {
      return;
    }

    setIsRetrying(true);
    try {
      const res = await fetch(`/api/homework/${homeworkId}/retry`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Retry failed');

      toast({
        title: 'Thành công',
        description: 'Bạn có thể làm lại bài tập ngay bây giờ',
      });

      router.push(`/classes/${classId}/homework/${homeworkId}`);
    } catch (e: any) {
      toast({
        title: 'Lỗi',
        description: e.message || 'Không thể làm lại bài',
        variant: 'destructive',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handlePlayAudio = () => {
    if (!detail?.audioUrl && !detail?.audioDataUrl) {
      toast({
        title: "Không có audio",
        description: "Bài nộp này không có file âm thanh",
        variant: "destructive",
      });
      return;
    }

    const audioUrl = detail.audioUrl || detail.audioDataUrl;
    if (!audioUrl) return;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        toast({
          title: "Lỗi phát audio",
          description: "Không thể phát file âm thanh. Vui lòng thử lại.",
          variant: "destructive",
        });
        setIsPlaying(false);
      };
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup audio on unmount
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
      }
    };
  }, [audioElement]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="text-center text-destructive">{error}</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="text-center">Không tìm thấy bài nộp.</div>
      </div>
    );
  }

  const now = new Date();
  const deadline = detail.homework ? new Date(detail.homework.id) : now;
  const isExpired = deadline < now;

  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Chi tiết bài làm
          </h1>
        </div>

        <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{detail.homework.title}</CardTitle>
            <CardDescription>
              Lần nộp thứ {detail.attemptNumber}
              {detail.homework.type && (
                <span className="ml-2">
                  ({detail.homework.type === 'speaking' ? '🎤 Speaking' : detail.homework.type === 'listening' ? '🎧 Listening' : '📖 Reading'})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">
                Trạng thái: {detail.status === 'graded' ? '✅ Đã chấm' : detail.status === 'submitted' ? '✅ Đã nộp' : '📝 Đang làm'}
              </Badge>
              {typeof detail.score === 'number' && (
                <Badge
                  variant={detail.score >= 0.7 ? 'default' : detail.score >= 0.5 ? 'secondary' : 'destructive'}
                  className="text-base"
                >
                  Điểm: {Math.round(detail.score * 100)}%
                </Badge>
              )}
              {detail.timeSpentSeconds !== undefined && (
                <Badge variant="outline">
                  Thời gian: {Math.floor(detail.timeSpentSeconds / 60)}:{(detail.timeSpentSeconds % 60).toString().padStart(2, '0')}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div>Bắt đầu: {detail.startedAt ? new Date(detail.startedAt).toLocaleString('vi-VN') : '-'}</div>
              <div>Nộp lúc: {detail.submittedAt ? new Date(detail.submittedAt).toLocaleString('vi-VN') : '-'}</div>
            </div>

            {/* Listening homework - show detailed results */}
            {detail.homework?.type === 'listening' && detail.answers && detail.boxResults && (
              <div className="space-y-6">
                {/* Score Summary Card */}
                <Card className="border-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">
                          Kết quả bài nghe
                        </h3>
                        <p className="text-indigo-100">
                          {detail.boxResults.filter((r: boolean) => r).length}/{detail.boxResults.length} câu đúng
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                          <span className="text-3xl font-bold">
                            {Math.round((detail.boxResults.filter((r: boolean) => r).length / detail.boxResults.length) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Answer Breakdown */}
                <Card className="border-2 border-indigo-100">
                  <CardHeader>
                    <CardTitle className="text-lg">📋 Chi tiết từng câu trả lời</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detail.answers.map((userAnswer: string, idx: number) => {
                      const isCorrect = detail.boxResults![idx];
                      const correctAnswer = detail.homework.answerBoxes
                        ? (Array.isArray(detail.homework.answerBoxes)
                          ? detail.homework.answerBoxes[idx]
                          : 'N/A')
                        : 'N/A';

                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border-2 ${isCorrect
                              ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                              : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            )}
                            <span className={`font-semibold ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                              }`}>
                              Câu {idx + 1}: {isCorrect ? 'Đúng' : 'Sai'}
                            </span>
                            <span className="text-sm text-gray-500 ml-auto">
                              {isCorrect ? '+' : '0'} điểm
                            </span>
                          </div>

                          <div className="space-y-2 ml-7">
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[120px]">
                                ✅ Đáp án đúng:
                              </span>
                              <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                                {correctAnswer}
                              </span>
                            </div>

                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[120px]">
                                {isCorrect ? '✅' : '❌'} Câu trả lời:
                              </span>
                              <span className={`text-sm font-semibold ${isCorrect
                                  ? 'text-green-700 dark:text-green-300'
                                  : 'text-red-700 dark:text-red-300'
                                }`}>
                                {userAnswer || '(Không trả lời)'}
                              </span>
                            </div>

                            {!isCorrect && (
                              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded border border-yellow-200 dark:border-yellow-800">
                                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                  💡 <strong>Gợi ý:</strong> Hãy luyện nghe kỹ hơn và chú ý đến từ vựng chính xác.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Statistics Card */}
                <Card className="border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">📊 Thống kê chi tiết</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {detail.boxResults.length}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Tổng câu hỏi
                        </div>
                      </div>

                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {detail.boxResults.filter((r: boolean) => r).length}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Câu đúng
                        </div>
                      </div>

                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {detail.boxResults.filter((r: boolean) => !r).length}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Câu sai
                        </div>
                      </div>

                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <div className={`text-2xl font-bold ${(detail.boxResults.filter((r: boolean) => r).length / detail.boxResults.length) >= 0.6
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                          }`}>
                          {(detail.boxResults.filter((r: boolean) => r).length / detail.boxResults.length) >= 0.6 ? '✅ Đạt' : '❌ Chưa đạt'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Kết quả
                        </div>
                      </div>
                    </div>

                    {detail.timeSpentSeconds !== undefined && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          ⏱️ Thời gian làm bài: <strong>{Math.floor(detail.timeSpentSeconds / 60)} phút {detail.timeSpentSeconds % 60} giây</strong>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Speaking homework - show detailed comparison */}
            {detail.homework?.type === 'speaking' && detail.homework.speakingText && detail.transcribedText && (
              <div className="space-y-4">
                {/* Audio Player */}
                {(detail.audioUrl || detail.audioDataUrl) && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                    <Button
                      variant={isPlaying ? "default" : "outline"}
                      size="sm"
                      onClick={handlePlayAudio}
                      className="gap-2"
                    >
                      {isPlaying ? (
                        <>
                          <VolumeX className="h-4 w-4" />
                          Dừng phát
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4" />
                          Nghe lại audio
                        </>
                      )}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Nghe lại bài thu âm của bạn
                    </span>
                  </div>
                )}

                <div className="text-sm font-medium">🎯 Phân tích chi tiết:</div>
                <TraditionalSpeakingResult
                  referenceText={detail.homework.speakingText}
                  transcribedText={detail.transcribedText}
                  assessment={detail.voiceAnalysis}
                />
              </div>
            )}

            {/* Regular homework answer */}
            {detail.homework?.type !== 'speaking' && detail.answer && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Đáp án của bạn</div>
                <div className="p-4 rounded-lg border bg-white dark:bg-gray-900/30 whitespace-pre-wrap">
                  {detail.answer || <span className="text-muted-foreground">(Trống)</span>}
                </div>
              </div>
            )}

            {/* Audio playback for speaking homework */}
            {detail.homework?.type === 'speaking' && (detail.audioUrl || detail.audioDataUrl) && (
              <div className="space-y-2">
                <div className="text-sm font-medium">🔊 Phát lại âm thanh:</div>
                <Button
                  onClick={handlePlayAudio}
                  className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
                >
                  {isPlaying ? '⏸️ Tạm dừng' : '▶️ Phát âm thanh'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons outside the card */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/classes/${classId}/homework/${homeworkId}`)}
            className="w-full h-12 text-base font-medium border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-950/30"
          >
            📖 Xem bài làm
          </Button>

          {!isExpired && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 shadow-lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              {isRetrying ? 'Đang xử lý...' : '🔄 Làm lại'}
            </Button>
          )}
        </div>
      </div>
    </div>

  );
}
