'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EnterQuizCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [quizCode, setQuizCode] = useState(searchParams?.get('code') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEnter = async () => {
    if (!quizCode.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/quizzes/check-code?code=${quizCode}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Mã bài kiểm tra không hợp lệ');
      }

      // Redirect to lobby or direct start depending on quiz status
      if (data.status === 'active') {
        router.push(`/quizzes/${data.id}/live`);
      } else {
        router.push(`/quizzes/${data.id}/lobby`);
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Vào phòng thi</CardTitle>
          </div>
          <CardDescription>
            Nhập mã bài kiểm tra mà giáo viên cung cấp để bắt đầu làm bài
          </CardDescription>
        </CardHeader>
        <CardContent>
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
  );
}
