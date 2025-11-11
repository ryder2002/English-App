'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Eye, 
  User, 
  Calendar,
  Mic
} from 'lucide-react';

interface SpeakingSubmission {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  homework: {
    id: number;
    title: string;
    speakingText: string;
  };
  transcribedText: string;
  score: number;
  submittedAt: string;
  voiceAnalysis?: any;
  metadata?: {
    audioSize: string;
    hasTranscription: boolean;
    hasAIAnalysis: boolean;
    method: string;
  };
}

interface HomeworkSubmissionsProps {
  homeworkId: number;
  homeworkType?: string;
}

export function HomeworkSubmissions({ homeworkId, homeworkType }: HomeworkSubmissionsProps) {
  const [submissions, setSubmissions] = useState<SpeakingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpeakingSubmissions = async () => {
    try {
      setLoading(true);
      console.log('Fetching submissions for homework:', homeworkId);
      
      const response = await fetch(`/api/admin/submissions?homeworkId=${homeworkId}`, {
        credentials: 'include',
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, '-', errorText);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      
      setSubmissions(data.submissions || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch speaking submissions:', err.message);
      setError(err.message || 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (homeworkId && homeworkType === 'speaking') {
      fetchSpeakingSubmissions();
    } else {
      setLoading(false);
    }
  }, [homeworkId, homeworkType]);

  if (homeworkType !== 'speaking') {
    return null;
  }

  const handleViewSubmission = (submission: SpeakingSubmission) => {
    window.open(`/admin/homework/${homeworkId}/submissions/${submission.id}`, '_blank');
  };

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Lịch sử bài làm Speaking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Lịch sử bài làm Speaking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <strong>Lỗi:</strong> {error}
            </div>
            <Button onClick={fetchSpeakingSubmissions} variant="outline" size="sm">
              🔄 Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Lịch sử bài làm Speaking
          </div>
          <Badge variant="outline" className="ml-2">
            {submissions.length} bài nộp
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mic className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">Chưa có bài nộp</h3>
            <p>Chưa có học viên nào nộp bài speaking cho bài tập này</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Học viên</TableHead>
                    <TableHead className="w-[100px]">Điểm</TableHead>
                    <TableHead className="w-[180px]">Thời gian nộp</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{submission.user.name || 'Unnamed User'}</div>
                            <div className="text-sm text-muted-foreground">{submission.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={submission.score >= 0.8 ? 'default' : submission.score >= 0.6 ? 'secondary' : 'destructive'}
                          className="font-medium"
                        >
                          {Math.round(submission.score * 100)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(submission.submittedAt).toLocaleString('vi-VN')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSubmission(submission)}
                            className="h-8"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Xem chi tiết
                          </Button>
                        </div>
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