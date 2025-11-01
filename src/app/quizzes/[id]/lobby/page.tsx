"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { 
  Users, 
  Clock, 
  Play,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

interface LobbyData {
  quiz: {
    id: number;
    title: string;
    description?: string;
    quizCode: string;
    status: string;
  };
  joinedMembers: Array<{
    userId: number;
    userName: string;
    joinedAt: string;
  }>;
  totalMembers: number;
  canStart: boolean;
}

export default function QuizLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth() || {};
  const quizId = params?.id as string;

  const [lobbyData, setLobbyData] = useState<LobbyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!quizId || !user) {
      return;
    }

    fetchLobbyData();
    
    // Poll every 2 seconds for updates
    const interval = setInterval(() => {
      fetchLobbyData();
    }, 2000);

    return () => clearInterval(interval);
  }, [quizId, user]);

  const fetchLobbyData = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/lobby`, {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 404) {
          router.push('/quizzes/enter');
          return;
        }
        throw new Error('Failed to load lobby data');
      }

      const data = await res.json();
      
      // If quiz is active, redirect to live page immediately
      if (data.quiz && data.quiz.status === 'active') {
        setTimeout(() => {
          router.push(`/quizzes/${quizId}/live`);
        }, 100);
        return;
      }

      setLobbyData(data);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải dữ liệu',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!isAdmin) return;

    const memberCount = lobbyData?.joinedMembers.length || 0;
    if (memberCount === 0) {
      toast({
        title: 'Lỗi',
        description: 'Chưa có học viên nào tham gia. Vui lòng đợi học viên tham gia trước khi bắt đầu.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Bạn có chắc muốn bắt đầu bài kiểm tra này? ${memberCount} học sinh đã tham gia sẽ có thể làm bài ngay lập tức.`)) {
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/start`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to start quiz');
      }

      toast({
        title: 'Thành công',
        description: 'Đã bắt đầu bài kiểm tra! Đang chuyển đến trang làm bài...',
      });

      // Wait a moment then redirect to live page
      setTimeout(() => {
        router.push(`/quizzes/${quizId}/live`);
      }, 500);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể bắt đầu bài kiểm tra',
        variant: 'destructive',
      });
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!lobbyData) {
    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Không tìm thấy bài kiểm tra</p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">{lobbyData.quiz.title}</h1>
          <p className="text-muted-foreground">{lobbyData.quiz.description || 'Không có mô tả'}</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Mã đề: <span className="font-mono ml-1">{lobbyData.quiz.quizCode}</span>
            </Badge>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Đang chờ bắt đầu bài kiểm tra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4 py-8">
              <Clock className="h-16 w-16 text-yellow-600 mx-auto animate-pulse" />
              <div>
                <p className="text-lg font-semibold mb-2">
                  {isAdmin ? 'Chờ học viên tham gia...' : 'Chờ giáo viên bắt đầu bài kiểm tra...'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isAdmin 
                    ? 'Khi đã có đủ học viên, nhấn "Bắt đầu bài kiểm tra" để bắt đầu.'
                    : 'Bài kiểm tra sẽ tự động bắt đầu khi giáo viên nhấn "Bắt đầu".'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Học viên đã tham gia ({lobbyData.joinedMembers.length} / {lobbyData.totalMembers})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lobbyData.joinedMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có học viên nào tham gia
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Thời gian tham gia</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lobbyData.joinedMembers.map((member, index) => (
                    <TableRow key={member.userId}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{member.userName}</TableCell>
                      <TableCell>
                        {new Date(member.joinedAt).toLocaleTimeString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Đã tham gia
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Admin Start Button */}
        {isAdmin && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleStartQuiz}
              disabled={isStarting || !lobbyData.canStart}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6"
            >
              <Play className="mr-2 h-5 w-5" />
              {isStarting ? 'Đang bắt đầu...' : 'Bắt đầu bài kiểm tra'}
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

