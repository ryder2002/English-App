'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Volume2, Eye, RotateCcw, Send, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ListeningHomeworkPlayerProps {
  audioUrl: string;
  promptText?: string;
  boxes: number;
  answerKey?: string | null;
  isSubmitted: boolean;
  isLocked: boolean;
  submittedAnswers?: string[];
  boxResults?: boolean[];
  onSubmitAction: (answers: string[]) => Promise<void>;
  onRedoAction?: () => Promise<void>;
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
}: ListeningHomeworkPlayerProps) {
  const [answers, setAnswers] = useState<string[]>(submittedAnswers || Array(boxes).fill(''));
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const toggleAudioPlayback = () => {
    if (!audioElement) {
      const audio = new Audio(audioUrl);
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
      audio.play();
    } else {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmitAction(answers);
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

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  return (
    <div className="space-y-6">
      {/* Audio Player Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg">
        <CardContent className="p-6">
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
        </CardContent>
      </Card>

      {/* Prompt Text */}
      {promptText && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-2">Văn bản (có chỗ trống):</p>
                <div className="text-base leading-relaxed text-blue-900 whitespace-pre-wrap">{promptText}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Answer Boxes */}
      {!isSubmitted && !isLocked && (
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-900">Điền đáp án vào các ô</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {answers.map((value, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Câu {idx + 1}
                  </label>
                  <Input
                    value={value}
                    onChange={(e) => {
                      const newAnswers = [...answers];
                      newAnswers[idx] = e.target.value;
                      setAnswers(newAnswers);
                    }}
                    placeholder={`Nhập đáp án ${idx + 1}`}
                    className="text-base"
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || answers.every(a => !a.trim())}
              size="lg"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Send className="w-6 h-6 mr-2" />
              {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
            </Button>
          </CardContent>
        </Card>
      )}

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
                {/* Score Summary */}
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${
                    scorePercent >= 80 ? 'border-green-500 bg-green-100' :
                    scorePercent >= 60 ? 'border-yellow-500 bg-yellow-100' :
                    'border-red-500 bg-red-100'
                  }`}>
                    <span className={`text-4xl font-bold ${
                      scorePercent >= 80 ? 'text-green-700' :
                      scorePercent >= 60 ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {scorePercent}%
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mt-4">
                    Đúng {correctCount}/{totalCount} câu
                  </p>
                </div>

                {/* Answer Review */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-lg">Chi tiết từng câu:</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {submittedAnswers?.map((answer, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${
                          boxResults[idx]
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${
                            boxResults[idx] ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {boxResults[idx] ? (
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            ) : (
                              <XCircle className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">Câu {idx + 1}:</p>
                            <p className={`text-base font-semibold ${
                              boxResults[idx] ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {answer || <span className="italic text-gray-400">(Không điền)</span>}
                            </p>
                            {!boxResults[idx] && answerKey && (
                              <p className="text-sm text-gray-600 mt-2">
                                💡 <strong>Gợi ý:</strong> Kiểm tra lại spelling và grammar
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
