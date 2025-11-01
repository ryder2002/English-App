"use client";

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClipboardCheck, ArrowRight } from 'lucide-react';

export default function EnterQuizCodePage() {
  const [quizCode, setQuizCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Pre-fill code from URL query
    if (searchParams) {
      const code = searchParams.get('code');
      if (code) {
        setQuizCode(code.toUpperCase());
      }
    }
  }, [searchParams]);

  const handleEnter = async () => {
    if (!quizCode.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập mã bài kiểm tra',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/quizzes/enter-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quizCode: quizCode.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể vào bài kiểm tra');
      }

      // Check quiz status and redirect accordingly
      const quizStatus = data.quiz.status || 'pending';
      if (quizStatus === 'active') {
        router.push(`/quizzes/${data.quiz.id}/live`);
      } else if (quizStatus === 'pending') {
        router.push(`/quizzes/${data.quiz.id}/lobby`);
      } else {
        router.push(`/quizzes/${data.quiz.id}/live`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể vào bài kiểm tra';
      
      // If quiz is pending, redirect to wait page (for backward compatibility)
      if (errorMessage.includes('chưa được bắt đầu')) {
        // Try to get quiz ID from error response
        const quizCodeFromError = quizCode.trim().toUpperCase();
        // We'll need to fetch quiz by code first, but for now redirect to wait
        router.push(`/quizzes/wait?code=${quizCodeFromError}`);
        return;
      }
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-2xl">
        <Card>
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <ClipboardCheck className="mx-auto h-12 w-12 text-primary mb-4" />
              <h1 className="text-2xl font-bold">Nhập mã bài kiểm tra</h1>
              <p className="text-muted-foreground">
                Nhập mã bài kiểm tra mà giáo viên cung cấp để bắt đầu làm bài
              </p>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Nhập mã bài kiểm tra (ví dụ: ABC123)"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEnter();
                }}
                className="text-center text-lg font-mono"
                autoFocus
              />
              <Button
                onClick={handleEnter}
                disabled={isSubmitting || !quizCode.trim()}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Bắt đầu làm bài'}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

