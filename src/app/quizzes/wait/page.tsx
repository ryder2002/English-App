"use client";

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, ArrowLeft, RefreshCw } from 'lucide-react';

export default function QuizWaitPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const quizCode = searchParams?.get('code') || '';
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!quizCode) {
      router.push('/quizzes/enter');
      return;
    }

    // Poll every 3 seconds to check if quiz has started
    const interval = setInterval(() => {
      checkQuizStatus();
    }, 3000);

    // Check immediately
    checkQuizStatus();

    return () => clearInterval(interval);
  }, [quizCode]);

  const checkQuizStatus = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const res = await fetch('/api/quizzes/enter-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quizCode: quizCode.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (res.ok) {
        // Check quiz status and redirect accordingly
        const quizStatus = data.quiz.status || 'pending';
        if (quizStatus === 'active') {
          router.push(`/quizzes/${data.quiz.id}/live`);
        } else if (quizStatus === 'pending') {
          router.push(`/quizzes/${data.quiz.id}/lobby`);
        } else {
          router.push(`/quizzes/${data.quiz.id}/live`);
        }
        return;
      }
      
      // If error is not about pending status, show it
      if (data.error && !data.error.includes('chưa được bắt đầu')) {
        toast({
          title: 'Lỗi',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      // Silently fail - will retry on next poll
      console.error('Check quiz status error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleBack = () => {
    router.push('/quizzes/enter');
  };

  return (
    <AppShell>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-2xl">
        <Card>
          <CardContent className="p-8 space-y-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Clock className="h-16 w-16 text-yellow-500 animate-pulse" />
                <RefreshCw className="h-6 w-6 text-primary absolute -bottom-1 -right-1 animate-spin" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Chờ giáo viên bắt đầu bài kiểm tra</h1>
                <p className="text-muted-foreground">
                  Mã bài kiểm tra: <span className="font-mono font-semibold text-primary">{quizCode}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Bài kiểm tra sẽ tự động bắt đầu khi giáo viên nhấn "Bắt đầu bài kiểm tra".
                </p>
                <p className="text-xs text-muted-foreground">
                  Đang kiểm tra mỗi 3 giây...
                </p>
              </div>

              <div className="flex gap-4 mt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
                <Button onClick={checkQuizStatus} disabled={isChecking}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                  {isChecking ? 'Đang kiểm tra...' : 'Kiểm tra ngay'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

