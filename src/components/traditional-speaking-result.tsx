'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface WordComparison {
  word: string;
  isCorrect: boolean;
  matchType: 'exact' | 'similar' | 'missing' | 'extra';
}

interface TraditionalSpeakingResultProps {
  referenceText: string;
  transcribedText: string;
  assessment: {
    overallScore: number;
    accuracyScore: number;
    completenessScore: number;
    referenceWords: string[];
    transcribedWords: string[];
    wordComparisons: WordComparison[];
    correctCount: number;
    incorrectCount: number;
    missingCount: number;
    extraCount: number;
    feedback: string;
  };
}

export function TraditionalSpeakingResult({ 
  referenceText, 
  transcribedText, 
  assessment 
}: TraditionalSpeakingResultProps) {
  // If no assessment data, show a message
  if (!assessment || !assessment.wordComparisons) {
    return (
      <Card className="border-2 border-yellow-300 bg-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">Chưa có kết quả đánh giá</p>
              <p className="text-sm text-yellow-700">Bài làm đang được xử lý hoặc chưa được chấm điểm.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-300';
    if (score >= 60) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className={`border-2 ${getScoreBgColor(assessment.overallScore)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Kết quả chấm điểm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(assessment.overallScore)}`}>
                {assessment.overallScore}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">Điểm tổng</p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Độ chính xác</span>
                <span className="text-sm font-bold">{assessment.accuracyScore}%</span>
              </div>
              <Progress value={assessment.accuracyScore} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Độ hoàn thành</span>
                <span className="text-sm font-bold">{assessment.completenessScore}%</span>
              </div>
              <Progress value={assessment.completenessScore} className="h-2" />
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{assessment.correctCount}</div>
              <div className="text-xs text-green-700">Đúng</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{assessment.incorrectCount}</div>
              <div className="text-xs text-yellow-700">Gần đúng</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{assessment.missingCount}</div>
              <div className="text-xs text-red-700">Thiếu</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{assessment.extraCount}</div>
              <div className="text-xs text-blue-700">Thừa</div>
            </div>
          </div>

          {/* Feedback */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Nhận xét:</strong> {assessment.feedback}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Text Comparison - Side by Side */}
      <Card>
        <CardHeader>
          <CardTitle>So sánh chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Reference Text */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-blue-50">
                  📝 Văn bản gốc
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({assessment.referenceWords.length} từ)
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[200px]">
                <div className="flex flex-wrap gap-2">
                  {assessment.wordComparisons.map((comparison, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        comparison.matchType === 'exact'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : comparison.matchType === 'similar'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {comparison.word}
                      {comparison.matchType === 'exact' && (
                        <CheckCircle2 className="inline ml-1 h-3 w-3" />
                      )}
                      {comparison.matchType === 'similar' && (
                        <AlertCircle className="inline ml-1 h-3 w-3" />
                      )}
                      {comparison.matchType === 'missing' && (
                        <XCircle className="inline ml-1 h-3 w-3" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span>Đúng hoàn toàn</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span>Gần đúng</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span>Thiếu/Sai</span>
                </div>
              </div>
            </div>

            {/* Transcribed Text */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-purple-50">
                  🎤 Bạn đã nói
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({assessment.transcribedWords.length} từ)
                </span>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 min-h-[200px]">
                <div className="flex flex-wrap gap-2">
                  {assessment.transcribedWords.map((word, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
              {transcribedText.trim() === '' && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  ⚠️ Không phát hiện được giọng nói. Hãy thử nói to và rõ hơn.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 Gợi ý cải thiện</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {assessment.missingCount > 0 && (
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Thiếu {assessment.missingCount} từ:</strong> Hãy đọc chậm hơn và phát âm rõ ràng từng từ.
                </span>
              </li>
            )}
            {assessment.incorrectCount > 0 && (
              <li className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>{assessment.incorrectCount} từ phát âm chưa chuẩn:</strong> Luyện tập các từ màu vàng nhiều hơn.
                </span>
              </li>
            )}
            {assessment.extraCount > 0 && (
              <li className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>{assessment.extraCount} từ thừa:</strong> Chỉ đọc đúng văn bản đã cho, không thêm từ.
                </span>
              </li>
            )}
            {assessment.overallScore >= 80 && (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Làm tốt lắm!</strong> Tiếp tục duy trì và luyện tập thêm các đoạn khó hơn.
                </span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
