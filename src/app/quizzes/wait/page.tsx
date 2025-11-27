'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function QuizWaitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const quizCode = searchParams?.get('code');
  const [isChecking, setIsChecking] = useState(false);

  const checkQuizStatus = async () => {
    if (!quizCode) return;

    setIsChecking(true);
    try {
      const res = await fetch(`/api/quizzes/check-code?code=${quizCode}`);
      const data = await res.json();

      if (res.ok && data.status === 'active') {
        router.push(`/quizzes/${data.id}/live`);
      }
    } catch (error) {
      console.error('Error checking quiz status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!quizCode) {
      router.push('/quizzes/enter');
      return;
    }

    const interval = setInterval(checkQuizStatus, 3000);
    return () => clearInterval(interval);
  }, [quizCode, router]);

  const handleBack = () => {
    router.push('/quizzes/enter');
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-2xl">
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-yellow-100 p-4 rounded-full">
                <Loader2 className="h-12 w-12 text-yellow-600 animate-spin" />
              </div>
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
  );
}
