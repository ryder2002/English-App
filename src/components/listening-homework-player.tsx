'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Volume2, Eye, RotateCcw, Send, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface ListeningHomeworkPlayerProps {
  audioUrl: string;
  promptText?: string;
  boxes: number;
  answerKey?: string | null;
  isSubmitted: boolean;
  isLocked: boolean;
  submittedAnswers?: string[];
  boxResults?: boolean[];
  onSubmitAction: (answers: string[]) => Promise<any>; // Changed from Promise<void>
  onRedoAction?: () => Promise<void>;
  classId?: string;
  homeworkId?: string;
}

export function ListeningHomeworkPlayer({
  audioUrl,
  promptText,
  boxes,
  answerKey,
  isSubmitted,
  isLocked,
  submittedAnswers,
  boxResults,
  onSubmitAction,
  onRedoAction,
  classId,
  homeworkId,
}: ListeningHomeworkPlayerProps) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [answers, setAnswers] = useState<string[]>(submittedAnswers || Array(boxes).fill(''));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  // Parse prompt text to create inline inputs
  const parsePromptText = (text: string) => {
    if (!text) return [];
    
    // Split by numbered blanks: 1.__, 2.__, etc.
    const parts: Array<{type: 'text' | 'input', content: string, index?: number}> = [];
    const regex = /(\d+)\._+/g;
    let lastIndex = 0;
    let match;
    let blankIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the blank
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      // Add input for the blank
      parts.push({
        type: 'input',
        content: match[0],
        index: blankIndex
      });
      
      lastIndex = regex.lastIndex;
      blankIndex++;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    return parts;
  };

  const promptParts = parsePromptText(promptText || '');

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const result = await onSubmitAction(answers);
      
      // Extract submission ID from result if available
      if (result && typeof result === 'object' && 'submissionId' in result) {
        const subId = (result as any).submissionId;
        setSubmissionId(subId);
        
        // Redirect to submission detail page
        if (classId && homeworkId && subId) {
          router.push(`/classes/${classId}/homework/${homeworkId}/submissions/${subId}`);
        }
      }
      
      setShowResult(true);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedo = async () => {
    if (onRedoAction) {
      try {
        setIsSubmitting(true);
        await onRedoAction();
        setAnswers(Array(boxes).fill(''));
        setShowResult(false);
      } catch (error) {
        console.error('Redo error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Calculate score
  const correctCount = boxResults?.filter(r => r).length || 0;
  const totalCount = boxes;
  const scorePercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Audio Player Card with Seek Bar */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-xl">
                <Volume2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-900 mb-2">Nghe audio và điền đáp án</p>
                <Button
                  onClick={toggleAudioPlayback}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause Audio
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Play Audio
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Seek Bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-purple-700">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Text with Inline Inputs */}
      {promptText && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-4">Điền vào chỗ trống:</p>
                <div className="text-base leading-loose text-blue-900">
                  {promptParts.map((part, idx) => {
                    if (part.type === 'text') {
                      return <span key={idx}>{part.content}</span>;
                    } else {
                      const inputIndex = part.index!;
                      const isCorrect = isSubmitted && boxResults && boxResults[inputIndex];
                      const isWrong = isSubmitted && boxResults && !boxResults[inputIndex];
                      
                      return (
                        <span key={idx} className="inline-block relative mx-1">
                          <Input
                            value={answers[inputIndex] || ''}
                            onChange={(e) => {
                              if (!isSubmitted && !isLocked) {
                                const newAnswers = [...answers];
                                newAnswers[inputIndex] = e.target.value;
                                setAnswers(newAnswers);
                              }
                            }}
                            disabled={isSubmitted || isLocked}
                            placeholder={`${inputIndex + 1}`}
                            className={`
                              inline-block w-32 h-9 px-2 text-center font-medium
                              ${isSubmitted 
                                ? isCorrect 
                                  ? 'bg-green-100 border-green-500 text-green-900' 
                                  : 'bg-red-100 border-red-500 text-red-900'
                                : 'bg-white border-blue-300 focus:border-blue-500'
                              }
                              ${isSubmitted ? 'cursor-not-allowed' : ''}
                            `}
                          />
                          {isSubmitted && (
                            <span className="absolute -top-1 -right-1">
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                            </span>
                          )}
                        </span>
                      );
                    }
                  })}
                </div>
                
                {!isSubmitted && !isLocked && (
                  <div className="mt-6">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || answers.every(a => !a.trim())}
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Old Answer Boxes - REMOVED */}

      {/* Action Buttons (After Submit) */}
      {isSubmitted && (
        <div className="space-y-6">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3 justify-center">
                {/* Play Audio Button */}
                <Button
                  onClick={toggleAudioPlayback}
                  size="lg"
                  variant="outline"
                  className="px-6 py-6 text-base font-semibold border-2 border-blue-400 hover:bg-blue-100 transition-all duration-300"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause Audio
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Play Audio
                    </>
                  )}
                </Button>

                {/* View Result Button */}
                <Button
                  onClick={() => setShowResult(!showResult)}
                  size="lg"
                  variant="outline"
                  className="px-6 py-6 text-base font-semibold border-2 border-green-400 hover:bg-green-100 transition-all duration-300"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  {showResult ? 'Ẩn kết quả' : 'Xem bài làm'}
                </Button>

                {/* Redo Button */}
                {onRedoAction && !isLocked && (
                  <Button
                    onClick={handleRedo}
                    size="lg"
                    disabled={isSubmitting}
                    className="px-6 py-6 text-base font-semibold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Làm lại
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Result Display */}
          {showResult && boxResults && (
            <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg">
              <CardContent className="p-6 space-y-6">
                {/* Score Summary with Statistics */}
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${
                      scorePercent >= 80 ? 'border-green-500 bg-green-100' :
                      scorePercent >= 60 ? 'border-yellow-500 bg-yellow-100' :
                      'border-red-500 bg-red-100'
                    }`}>
                      <span className={`text-5xl font-bold ${
                        scorePercent >= 80 ? 'text-green-700' :
                        scorePercent >= 60 ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {scorePercent}%
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 mt-4">
                      Kết quả: {correctCount}/{totalCount} câu đúng
                    </p>
                  </div>

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-6 h-6 text-green-600 mr-2" />
                        <span className="text-3xl font-bold text-green-700">{correctCount}</span>
                      </div>
                      <p className="text-sm font-semibold text-green-800">Câu đúng</p>
                    </div>
                    
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <XCircle className="w-6 h-6 text-red-600 mr-2" />
                        <span className="text-3xl font-bold text-red-700">{totalCount - correctCount}</span>
                      </div>
                      <p className="text-sm font-semibold text-red-800">Câu sai</p>
                    </div>
                    
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-3xl font-bold text-blue-700">{scorePercent}</span>
                      </div>
                      <p className="text-sm font-semibold text-blue-800">Điểm số</p>
                    </div>
                  </div>

                  {/* Performance Message */}
                  <div className={`mt-4 p-4 rounded-lg text-center font-semibold ${
                    scorePercent >= 80 ? 'bg-green-100 text-green-800' :
                    scorePercent >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {scorePercent >= 80 ? '🎉 Xuất sắc! Bạn đã làm rất tốt!' :
                     scorePercent >= 60 ? '👍 Tốt! Còn một chút nữa thôi!' :
                     '💪 Cần cố gắng thêm! Hãy nghe lại và luyện tập nhiều hơn!'}
                  </div>
                </div>

                {/* Detailed Answer Review */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold text-gray-900">Chi tiết từng câu</h4>
                    <span className="text-sm text-gray-600">
                      {correctCount} đúng / {totalCount - correctCount} sai
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {submittedAnswers?.map((answer, idx) => {
                      const correctAnswer = answerKey?.split(',')[idx]?.trim();
                      return (
                        <div
                          key={idx}
                          className={`p-5 rounded-xl border-2 shadow-sm transition-all hover:shadow-md ${
                            boxResults[idx]
                              ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50'
                              : 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`p-3 rounded-full flex-shrink-0 ${
                              boxResults[idx] ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                              {boxResults[idx] ? (
                                <CheckCircle2 className="w-6 h-6 text-white" />
                              ) : (
                                <XCircle className="w-6 h-6 text-white" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-3">
                              {/* Question Number */}
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-white rounded-full text-sm font-bold text-gray-700 border-2 border-gray-300">
                                  Câu {idx + 1}
                                </span>
                                {boxResults[idx] ? (
                                  <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold">
                                    ✓ Chính xác
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-semibold">
                                    ✗ Sai
                                  </span>
                                )}
                              </div>

                              {/* Student Answer */}
                              <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                                <p className="text-xs font-semibold text-gray-500 mb-2">📝 Câu trả lời của bạn:</p>
                                <p className={`text-lg font-bold ${
                                  boxResults[idx] ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {answer || <span className="italic text-gray-400">(Không điền)</span>}
                                </p>
                              </div>

                              {/* Correct Answer (if wrong) */}
                              {!boxResults[idx] && correctAnswer && (
                                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                                  <p className="text-xs font-semibold text-green-700 mb-2">✅ Đáp án đúng:</p>
                                  <p className="text-lg font-bold text-green-800">
                                    {correctAnswer}
                                  </p>
                                </div>
                              )}

                              {/* Feedback/Hint */}
                              {!boxResults[idx] && (
                                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400">
                                  <p className="text-sm text-yellow-800">
                                    <strong>💡 Gợi ý:</strong> Hãy nghe lại audio và chú ý đến:
                                  </p>
                                  <ul className="mt-2 ml-5 space-y-1 text-sm text-yellow-700 list-disc">
                                    <li>Phát âm và trọng âm của từ</li>
                                    <li>Chính tả (spelling)</li>
                                    <li>Ngữ pháp (số nhiều, thì...)</li>
                                  </ul>
                                </div>
                              )}

                              {/* Success Message */}
                              {boxResults[idx] && (
                                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                                  <p className="text-sm text-green-800">
                                    <strong>🎯 Chính xác!</strong> Bạn đã nghe và viết đúng!
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Locked Message */}
          {isLocked && (
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 text-center">
                <p className="text-yellow-800 font-semibold">
                  🔒 Bài tập đã đóng, không thể làm lại
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
