'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Eye, 
  Download, 
  User, 
  Calendar,
  Volume2,
  FileText,
  Mic
} from 'lucide-react';

interface SpeakingSubmission {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  transcribedText: string;
  score: number;
  audioUrl: string;
  voiceAnalysis: any;
  submittedAt: string;
  method: string;
}

interface HomeworkSubmissionsProps {
  homeworkId: number;
  homeworkType?: 'listening' | 'reading' | 'speaking';
}

export function HomeworkSubmissions({ homeworkId, homeworkType }: HomeworkSubmissionsProps) {
  const [speakingSubmissions, setSpeakingSubmissions] = useState<SpeakingSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (homeworkType === 'speaking') {
      fetchSpeakingSubmissions();
    } else {
      setLoading(false);
    }
  }, [homeworkId, homeworkType]);

  const fetchSpeakingSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/submissions?homeworkId=${homeworkId}`);
      const data = await response.json();

      if (data.success) {
        setSpeakingSubmissions(data.submissions);
      } else {
        console.error('Failed to fetch speaking submissions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching speaking submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionDetail = async (submissionId: number) => {
    try {
      setDetailLoading(true);
      const response = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ submissionId })
      });

      const data = await response.json();

      if (data.success) {
        setSelectedSubmission(data.submission);
      } else {
        console.error('Failed to fetch submission detail:', data.error);
      }
    } catch (error) {
      console.error('Error fetching submission detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    }
  };

  const downloadAudio = (audioUrl: string, submissionId: number) => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `speaking-submission-${submissionId}-audio.webm`;
      link.click();
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'openrouter-ai':
        return <Badge className="bg-purple-100 text-purple-700">🧠 AI Enhanced</Badge>;
      case 'text-analysis':
        return <Badge className="bg-blue-100 text-blue-700">📊 Analysis</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">🎯 Basic</Badge>;
    }
  };

  if (homeworkType !== 'speaking') {
    return null; // Only show for speaking homework
  }

  return (
    <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-purple-600" />
          Lịch sử bài làm Speaking ({speakingSubmissions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : speakingSubmissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            Chưa có học viên nào nộp bài speaking
          </div>
        ) : (
          <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{speakingSubmissions.length}</div>
                <div className="text-sm text-gray-600">Tổng bài nộp</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(speakingSubmissions.reduce((acc, s) => acc + s.score, 0) / speakingSubmissions.length) || 0}%
                </div>
                <div className="text-sm text-gray-600">Điểm trung bình</div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {speakingSubmissions.filter(s => s.method === 'openrouter-ai').length}
                </div>
                <div className="text-sm text-gray-600">AI Enhanced</div>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Điểm số</TableHead>
                    <TableHead>Phương pháp</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Audio</TableHead>
                    <TableHead>Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {speakingSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{submission.user.name}</div>
                            <div className="text-sm text-gray-500">{submission.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`text-lg font-bold ${
                          submission.score >= 80 ? 'text-green-600' :
                          submission.score >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {submission.score}%
                        </div>
                      </TableCell>
                      <TableCell>
                        {getMethodBadge(submission.method)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(submission.submittedAt).toLocaleDateString('vi-VN')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {submission.audioUrl && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => playAudio(submission.audioUrl)}
                                title="Phát audio"
                              >
                                <Volume2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadAudio(submission.audioUrl, submission.id)}
                                title="Tải xuống"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => fetchSubmissionDetail(submission.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Xem
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Chi tiết bài làm Speaking
                              </DialogTitle>
                            </DialogHeader>
                            {detailLoading ? (
                              <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                                <p className="mt-4 text-gray-600">Đang tải chi tiết...</p>
                              </div>
                            ) : selectedSubmission && (
                              <div className="space-y-6">
                                {/* User Info - Enhanced Design */}
                                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-purple-500 rounded-lg">
                                        <User className="h-5 w-5 text-white" />
                                      </div>
                                      <CardTitle className="text-lg">Thông tin học viên</CardTitle>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-white p-3 rounded-lg shadow-sm">
                                        <div className="text-xs text-gray-500 mb-1">Tên học viên</div>
                                        <div className="font-semibold text-gray-900">{selectedSubmission.user.name}</div>
                                      </div>
                                      <div className="bg-white p-3 rounded-lg shadow-sm">
                                        <div className="text-xs text-gray-500 mb-1">Email</div>
                                        <div className="font-semibold text-gray-900">{selectedSubmission.user.email}</div>
                                      </div>
                                      <div className="bg-white p-3 rounded-lg shadow-sm">
                                        <div className="text-xs text-gray-500 mb-1">Thời gian nộp</div>
                                        <div className="font-semibold text-gray-900">{new Date(selectedSubmission.submittedAt).toLocaleString('vi-VN')}</div>
                                      </div>
                                      <div className="bg-white p-3 rounded-lg shadow-sm">
                                        <div className="text-xs text-gray-500 mb-1">Phương pháp đánh giá</div>
                                        <div className="font-semibold">{getMethodBadge(selectedSubmission.analysis.method)}</div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Audio Player - Enhanced Design */}
                                {selectedSubmission.audioUrl && (
                                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500 rounded-lg">
                                          <Volume2 className="h-5 w-5 text-white" />
                                        </div>
                                        <CardTitle className="text-lg">Bản ghi âm của học viên</CardTitle>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <audio 
                                          controls 
                                          className="w-full"
                                          src={selectedSubmission.audioUrl}
                                          style={{
                                            outline: 'none',
                                            filter: 'sepia(20%) saturate(70%) hue-rotate(170deg) brightness(95%)'
                                          }}
                                        >
                                          Trình duyệt không hỗ trợ phát audio.
                                        </audio>
                                        <div className="flex gap-2 mt-3">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => downloadAudio(selectedSubmission.audioUrl, selectedSubmission.id)}
                                            className="flex-1"
                                          >
                                            <Download className="h-4 w-4 mr-2" />
                                            Tải xuống
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Original vs Transcribed Text - Enhanced Design */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-500 rounded-lg">
                                          <FileText className="h-5 w-5 text-white" />
                                        </div>
                                        <CardTitle className="text-lg">Văn bản gốc</CardTitle>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="bg-white p-4 rounded-lg text-base leading-relaxed text-gray-900 font-medium shadow-sm">
                                        {selectedSubmission.homework.speakingText}
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-lg">
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-500 rounded-lg">
                                          <Mic className="h-5 w-5 text-white" />
                                        </div>
                                        <CardTitle className="text-lg">Văn bản đã đọc</CardTitle>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="bg-white p-4 rounded-lg text-base leading-relaxed text-gray-900 shadow-sm">
                                        {selectedSubmission.transcribedText || <span className="text-gray-400 italic">Không có transcription</span>}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Scores - Enhanced Design */}
                                {selectedSubmission.analysis && (
                                  <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg">
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500 rounded-lg">
                                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        </div>
                                        <CardTitle className="text-lg">Kết quả đánh giá</CardTitle>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="text-center p-4 bg-white rounded-xl shadow-md border-2 border-purple-200 transform transition-transform hover:scale-105">
                                          <div className="text-3xl font-bold text-purple-600">
                                            {selectedSubmission.analysis.overallScore}%
                                          </div>
                                          <div className="text-sm text-gray-600 mt-1 font-medium">Tổng thể</div>
                                        </div>
                                        <div className="text-center p-4 bg-white rounded-xl shadow-md border-2 border-blue-200 transform transition-transform hover:scale-105">
                                          <div className="text-3xl font-bold text-blue-600">
                                            {selectedSubmission.analysis.accuracy || 0}%
                                          </div>
                                          <div className="text-sm text-gray-600 mt-1 font-medium">Chính xác</div>
                                        </div>
                                        <div className="text-center p-4 bg-white rounded-xl shadow-md border-2 border-green-200 transform transition-transform hover:scale-105">
                                          <div className="text-3xl font-bold text-green-600">
                                            {selectedSubmission.analysis.fluency || 0}%
                                          </div>
                                          <div className="text-sm text-gray-600 mt-1 font-medium">Trôi chảy</div>
                                        </div>
                                        <div className="text-center p-4 bg-white rounded-xl shadow-md border-2 border-orange-200 transform transition-transform hover:scale-105">
                                          <div className="text-3xl font-bold text-orange-600">
                                            {selectedSubmission.analysis.completeness || 0}%
                                          </div>
                                          <div className="text-sm text-gray-600 mt-1 font-medium">Hoàn thiện</div>
                                        </div>
                                      </div>

                                      {/* Feedback & Suggestions */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedSubmission.analysis.feedback && (
                                          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-400">
                                            <h4 className="font-semibold mb-3 text-base flex items-center gap-2">
                                              <span className="text-blue-500">💬</span>
                                              Nhận xét:
                                            </h4>
                                            {typeof selectedSubmission.analysis.feedback === 'string' ? (
                                              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                {selectedSubmission.analysis.feedback}
                                              </p>
                                            ) : Array.isArray(selectedSubmission.analysis.feedback) ? (
                                              <ul className="space-y-2">
                                                {selectedSubmission.analysis.feedback.map((item: string, index: number) => (
                                                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2 bg-blue-50 p-2 rounded">
                                                    <span className="text-blue-500 mt-0.5 font-bold">•</span>
                                                    <span>{item}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            ) : null}
                                          </div>
                                        )}
                                        {selectedSubmission.analysis.suggestions && (
                                          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-400">
                                            <h4 className="font-semibold mb-3 text-base flex items-center gap-2">
                                              <span className="text-green-500">💡</span>
                                              Gợi ý cải thiện:
                                            </h4>
                                            {typeof selectedSubmission.analysis.suggestions === 'string' ? (
                                              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                {selectedSubmission.analysis.suggestions}
                                              </p>
                                            ) : Array.isArray(selectedSubmission.analysis.suggestions) ? (
                                              <ul className="space-y-2">
                                                {selectedSubmission.analysis.suggestions.map((item: string, index: number) => (
                                                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2 bg-green-50 p-2 rounded">
                                                    <span className="text-green-500 mt-0.5 font-bold">→</span>
                                                    <span>{item}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            ) : null}
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Statistics - Enhanced Design */}
                                <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 shadow-lg">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-gray-600 rounded-lg">
                                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                      </div>
                                      <CardTitle className="text-lg">Thống kê chi tiết</CardTitle>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div className="bg-white p-4 rounded-lg shadow-sm text-center border-2 border-gray-200">
                                        <div className="text-2xl font-bold text-gray-700">{selectedSubmission.statistics.originalWords}</div>
                                        <div className="text-sm text-gray-600 mt-1">Từ gốc</div>
                                      </div>
                                      <div className="bg-white p-4 rounded-lg shadow-sm text-center border-2 border-gray-200">
                                        <div className="text-2xl font-bold text-gray-700">{selectedSubmission.statistics.wordsSpoken}</div>
                                        <div className="text-sm text-gray-600 mt-1">Từ đã đọc</div>
                                      </div>
                                      <div className="bg-white p-4 rounded-lg shadow-sm text-center border-2 border-gray-200">
                                        <div className="text-2xl font-bold text-gray-700">{selectedSubmission.statistics.completionRate}%</div>
                                        <div className="text-sm text-gray-600 mt-1">Tỷ lệ hoàn thành</div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
