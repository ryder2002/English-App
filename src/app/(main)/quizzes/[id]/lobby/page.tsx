'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Users, Clock, Play, CheckCircle } from 'lucide-react';

interface LobbyData {
  quiz: {
    id: number;
    title: string;
    description: string;
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
  const { user } = useAuth();
  const [lobbyData, setLobbyData] = useState<LobbyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'teacher';

  useEffect(() => {
    const fetchLobby = async () => {
      try {
        const res = await fetch(`/api/quizzes/${params.id}/lobby`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load lobby');
        }

        if (data.quiz.status === 'active') {
          router.push(`/quizzes/${params.id}/live`);
          return;
        }

        setLobbyData(data);
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.message,
          variant: 'destructive',
        });
        router.push('/classes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLobby();
    const interval = setInterval(fetchLobby, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [params.id, router, toast]);

  const handleStartQuiz = async () => {
    if (!confirm('Bạn có chắc muốn bắt đầu bài kiểm tra?')) return;

    setIsStarting(true);
    try {
      const res = await fetch(`/api/quizzes/${params.id}/start`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start quiz');
      }

      toast({
        title: 'Thành công',
        description: 'Đã bắt đầu bài kiểm tra',
      });

      // The polling will pick up the status change and redirect
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!lobbyData) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Không tìm thấy bài kiểm tra</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
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
  );
}
