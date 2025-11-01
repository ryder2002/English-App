"use client";

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, BookOpen, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Class {
  id: number;
  name: string;
  description?: string;
  classCode: string;
  teacher: {
    id: number;
    email: string;
    name?: string;
  };
  quizzes: Array<{
    id: number;
    title: string;
    quizCode: string;
    status: string;
  }>;
  _count: {
    members: number;
  };
  joinedAt: string;
}

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes/my-classes', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch classes');
      const data = await res.json();
      setClasses(data);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải danh sách lớp học',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập mã lớp',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ classCode: joinCode.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tham gia lớp');
      }

      toast({
        title: 'Thành công',
        description: `Đã tham gia lớp "${data.name}"`,
      });
      setJoinCode('');
      setIsDialogOpen(false);
      fetchClasses();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tham gia lớp',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="text-center">Đang tải...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-gradient">
            Lớp học của tôi
          </h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tham gia lớp
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tham gia lớp học</DialogTitle>
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
                  />
                </div>
                <Button onClick={handleJoinClass} disabled={isJoining} className="w-full">
                  {isJoining ? 'Đang tham gia...' : 'Tham gia'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa tham gia lớp nào</h3>
              <p className="text-muted-foreground mb-4">
                Nhấn "Tham gia lớp" và nhập mã lớp để bắt đầu
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((clazz) => (
              <Card key={clazz.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/classes/${clazz.id}`)}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{clazz.name}</span>
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {clazz.classCode}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {clazz.description && (
                    <p className="text-sm text-muted-foreground">{clazz.description}</p>
                  )}
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{clazz._count.members} thành viên</span>
                    </div>
                    <div className="text-muted-foreground">
                      Giáo viên: {clazz.teacher.name || clazz.teacher.email}
                    </div>
                  </div>

                  {clazz.quizzes && clazz.quizzes.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        Bài kiểm tra ({clazz.quizzes.length})
                      </div>
                      <div className="space-y-1">
                        {clazz.quizzes.map((quiz) => (
                          <Link
                            key={quiz.id}
                            href={`/quizzes/enter?code=${quiz.quizCode}`}
                            className="block text-sm text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {quiz.title} ({quiz.status === 'active' ? 'Đang mở' : 'Đã kết thúc'})
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Tham gia: {new Date(clazz.joinedAt).toLocaleDateString('vi-VN')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

