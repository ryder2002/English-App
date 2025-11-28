'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, BookOpen, Plus, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Class {
  id: number;
  name: string;
  description?: string;
  classCode: string;
  teacher: {
    name?: string;
    email: string;
  };
  _count: {
    members: number;
  };
  joinedAt: string;
  quizzes?: Array<{
    id: number;
    title: string;
    quizCode: string;
    status: string;
  }>;
}

export default function ClassesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes/my-classes', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setClasses(data);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleJoinClass = async () => {
    if (!joinCode.trim()) return;

    setIsJoining(true);
    try {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode: joinCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join class');
      }

      toast({
        title: 'Thành công',
        description: 'Đã tham gia lớp học thành công',
      });

      setIsDialogOpen(false);
      setJoinCode('');
      fetchClasses();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:p-6 lg:p-8">
        <div className="mb-4 sm:mb-6 md:mb-8 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-4 sm:p-5 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-glow animate-pulse-slow flex-shrink-0">
                <span className="text-xl sm:text-2xl md:text-3xl">🎓</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Lớp học của tôi
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  Tham gia lớp học và làm bài kiểm tra
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 px-4 py-2.5 sm:px-6 sm:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold">
                  <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Tham gia lớp</span>
                  <span className="sm:hidden">Tham gia</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    🎓 Tham gia lớp học
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Nhập mã lớp (ví dụ: ABC123)"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleJoinClass();
                      }}
                      className="border-2 border-purple-200 dark:border-purple-800 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <Button
                    onClick={handleJoinClass}
                    disabled={isJoining}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl font-semibold py-6"
                  >
                    {isJoining ? '⏳ Đang tham gia...' : '✅ Tham gia'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {classes.length === 0 ? (
          <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4 animate-bounce-slow">🎓</div>
              <Users className="mx-auto h-16 w-16 text-muted-foreground mb-6 opacity-50" />
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Chưa tham gia lớp nào
              </h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Nhấn "Tham gia lớp" và nhập mã lớp để bắt đầu học tập!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((clazz) => (
              <Card
                key={clazz.id}
                className="border-0 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 cursor-pointer bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden group"
                onClick={() => router.push(`/classes/${clazz.id}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative p-4 sm:p-6">
                  <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-lg sm:text-xl">
                    <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent line-clamp-2">
                      {clazz.name}
                    </span>
                    <span className="text-xs sm:text-sm font-mono bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-purple-200 dark:border-purple-800 font-bold text-purple-700 dark:text-purple-300 shrink-0">
                      {clazz.classCode}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 relative p-4 sm:p-6 pt-0">
                  {clazz.description && (
                    <p className="text-sm text-muted-foreground">{clazz.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold">{clazz._count.members} thành viên</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                      <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-muted-foreground">
                        {clazz.teacher.name || clazz.teacher.email}
                      </span>
                    </div>
                  </div>

                  {clazz.quizzes && clazz.quizzes.length > 0 && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-green-600" />
                        <span>📝 Bài kiểm tra ({clazz.quizzes.length})</span>
                      </div>
                      <div className="space-y-2">
                        {clazz.quizzes.map((quiz) => (
                          <Link
                            key={quiz.id}
                            href={`/quizzes/enter?code=${quiz.quizCode}`}
                            className="block text-sm px-3 py-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-200 text-green-700 dark:text-green-300 font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {quiz.title}
                            <Badge className={cn(
                              "ml-2",
                              quiz.status === 'active' ? "bg-green-500 text-white" : "bg-gray-400 text-white"
                            )}>
                              {quiz.status === 'active' ? '✨ Đang mở' : '✅ Đã kết thúc'}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t border-gray-200 dark:border-gray-700">
                    📅 Tham gia: {new Date(clazz.joinedAt).toLocaleDateString('vi-VN')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
