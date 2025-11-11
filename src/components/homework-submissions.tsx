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
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Chi tiết bài làm Speaking</DialogTitle>
                            </DialogHeader>
                            {detailLoading ? (
                              <div className="text-center py-8">Đang tải chi tiết...</div>
                            ) : selectedSubmission && (
                              <div className="space-y-6">
                                {/* User Info */}
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Thông tin học viên</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div><strong>Tên:</strong> {selectedSubmission.user.name}</div>
                                      <div><strong>Email:</strong> {selectedSubmission.user.email}</div>
                                      <div><strong>Nộp lúc:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString('vi-VN')}</div>
                                      <div><strong>Phương pháp:</strong> {getMethodBadge(selectedSubmission.analysis.method)}</div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Original vs Transcribed Text */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">Văn bản gốc</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="bg-gray-50 p-3 rounded text-sm">
                                        {selectedSubmission.homework.speakingText}
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">Văn bản đã đọc</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="bg-blue-50 p-3 rounded text-sm">
                                        {selectedSubmission.transcribedText || 'Không có transcription'}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Scores */}
                                {selectedSubmission.analysis && (
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">Kết quả đánh giá AI</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                                          <div className="text-2xl font-bold text-purple-600">
                                            {selectedSubmission.analysis.overallScore}%
                                          </div>
                                          <div className="text-xs text-gray-600">Tổng thể</div>
                                        </div>
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                          <div className="text-2xl font-bold text-blue-600">
                                            {selectedSubmission.analysis.accuracy || 0}%
                                          </div>
                                          <div className="text-xs text-gray-600">Chính xác</div>
                                        </div>
                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                          <div className="text-2xl font-bold text-green-600">
                                            {selectedSubmission.analysis.fluency || 0}%
                                          </div>
                                          <div className="text-xs text-gray-600">Trôi chảy</div>
                                        </div>
                                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                                          <div className="text-2xl font-bold text-orange-600">
                                            {selectedSubmission.analysis.completeness || 0}%
                                          </div>
                                          <div className="text-xs text-gray-600">Hoàn thiện</div>
                                        </div>
                                      </div>

                                      {/* Feedback & Suggestions */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedSubmission.analysis.feedback?.length > 0 && (
                                          <div>
                                            <h4 className="font-medium mb-2 text-sm">Nhận xét:</h4>
                                            <ul className="space-y-1">
                                              {selectedSubmission.analysis.feedback.map((item: string, index: number) => (
                                                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                                  <span className="text-blue-500 mt-1">•</span>
                                                  {item}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        {selectedSubmission.analysis.suggestions?.length > 0 && (
                                          <div>
                                            <h4 className="font-medium mb-2 text-sm">Gợi ý cải thiện:</h4>
                                            <ul className="space-y-1">
                                              {selectedSubmission.analysis.suggestions.map((item: string, index: number) => (
                                                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                                  <span className="text-green-500 mt-1">•</span>
                                                  {item}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Audio Player */}
                                {selectedSubmission.audioUrl && (
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">Bản ghi âm</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <audio 
                                        controls 
                                        className="w-full"
                                        src={selectedSubmission.audioUrl}
                                      >
                                        Trình duyệt không hỗ trợ phát audio.
                                      </audio>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Statistics */}
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Thống kê</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <div className="font-medium">{selectedSubmission.statistics.originalWords}</div>
                                        <div className="text-gray-600">Từ gốc</div>
                                      </div>
                                      <div>
                                        <div className="font-medium">{selectedSubmission.statistics.wordsSpoken}</div>
                                        <div className="text-gray-600">Từ đã đọc</div>
                                      </div>
                                      <div>
                                        <div className="font-medium">{selectedSubmission.statistics.completionRate}%</div>
                                        <div className="text-gray-600">Tỷ lệ hoàn thành</div>
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
