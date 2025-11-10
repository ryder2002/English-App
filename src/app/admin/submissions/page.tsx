'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Search, 
  Eye, 
  Download, 
  User, 
  Calendar,
  Mic,
  BarChart3,
  FileText,
  Volume2
} from 'lucide-react';

interface Submission {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  homework: {
    id: number;
    title: string;
    speakingText: string;
    language: string;
  };
  transcribedText: string;
  score: number;
  audioUrl: string;
  voiceAnalysis: any;
  submittedAt: string;
  metadata: {
    audioSize: string;
    hasTranscription: boolean;
    hasAIAnalysis: boolean;
    method: string;
  };
}

interface DetailedSubmission {
  id: number;
  user: any;
  homework: any;
  transcribedText: string;
  score: number;
  audioUrl: string;
  submittedAt: string;
  analysis: {
    method: string;
    overallScore: number;
    accuracy: number;
    fluency: number;
    completeness: number;
    prosody: number;
    feedback: string[];
    suggestions: string[];
    wordAssessments: any[];
  };
  statistics: {
    wordsSpoken: number;
    originalWords: number;
    completionRate: number;
  };
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<DetailedSubmission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async (offset = 0) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        offset: offset.toString()
      });

      const response = await fetch(`/api/admin/submissions?${params}`);
      const data = await response.json();

      if (data.success) {
        setSubmissions(data.submissions);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch submissions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
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
      link.download = `submission-${submissionId}-audio.webm`;
      link.click();
    }
  };

  const filteredSubmissions = submissions.filter(submission =>
    submission.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.homework.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Admin Dashboard - User Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by user name, email, or homework title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-96"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Total: {pagination.total} submissions
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading submissions...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Homework</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Audio</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
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
                        <div className="max-w-xs">
                          <div className="font-medium truncate">{submission.homework.title}</div>
                          <div className="text-sm text-gray-500 truncate">
                            {submission.homework.speakingText.substring(0, 50)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`text-lg font-bold ${
                            submission.score >= 80 ? 'text-green-600' :
                            submission.score >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {submission.score}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getMethodBadge(submission.metadata.method)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(submission.submittedAt).toLocaleDateString()}
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
                              >
                                <Volume2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadAudio(submission.audioUrl, submission.id)}
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
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Submission Details</DialogTitle>
                            </DialogHeader>
                            {detailLoading ? (
                              <div className="text-center py-8">Loading details...</div>
                            ) : selectedSubmission && (
                              <div className="space-y-6">
                                {/* User & Homework Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">User Information</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2 text-sm">
                                        <div><strong>Name:</strong> {selectedSubmission.user.name}</div>
                                        <div><strong>Email:</strong> {selectedSubmission.user.email}</div>
                                        <div><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}</div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">Homework Information</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2 text-sm">
                                        <div><strong>Title:</strong> {selectedSubmission.homework.title}</div>
                                        <div><strong>Language:</strong> {selectedSubmission.homework.language}</div>
                                        <div><strong>Words:</strong> {selectedSubmission.statistics.originalWords}</div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Original Text */}
                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Original Text</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="bg-gray-50 p-3 rounded text-sm">
                                      {selectedSubmission.homework.speakingText}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Transcribed Text */}
                                {selectedSubmission.transcribedText && (
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">Transcribed Text</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="bg-blue-50 p-3 rounded text-sm">
                                        {selectedSubmission.transcribedText}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Analysis Results */}
                                {selectedSubmission.analysis && (
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">AI Analysis Results</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="text-center">
                                          <div className="text-2xl font-bold text-purple-600">
                                            {selectedSubmission.analysis.overallScore}%
                                          </div>
                                          <div className="text-xs text-gray-600">Overall</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-2xl font-bold text-blue-600">
                                            {selectedSubmission.analysis.accuracy}%
                                          </div>
                                          <div className="text-xs text-gray-600">Accuracy</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-2xl font-bold text-green-600">
                                            {selectedSubmission.analysis.fluency}%
                                          </div>
                                          <div className="text-xs text-gray-600">Fluency</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-2xl font-bold text-orange-600">
                                            {selectedSubmission.analysis.completeness}%
                                          </div>
                                          <div className="text-xs text-gray-600">Completeness</div>
                                        </div>
                                      </div>

                                      {/* Feedback */}
                                      {selectedSubmission.analysis.feedback?.length > 0 && (
                                        <div className="mb-4">
                                          <h4 className="font-medium mb-2">Feedback:</h4>
                                          <ul className="space-y-1">
                                            {selectedSubmission.analysis.feedback.map((item, index) => (
                                              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                                <span className="text-blue-500">•</span>
                                                {item}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Suggestions */}
                                      {selectedSubmission.analysis.suggestions?.length > 0 && (
                                        <div>
                                          <h4 className="font-medium mb-2">Suggestions:</h4>
                                          <ul className="space-y-1">
                                            {selectedSubmission.analysis.suggestions.map((item, index) => (
                                              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                                <span className="text-green-500">•</span>
                                                {item}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Audio Player */}
                                {selectedSubmission.audioUrl && (
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">Audio Recording</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <audio 
                                        controls 
                                        className="w-full"
                                        src={selectedSubmission.audioUrl}
                                      >
                                        Your browser does not support the audio element.
                                      </audio>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {filteredSubmissions.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                No submissions found matching your search.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
