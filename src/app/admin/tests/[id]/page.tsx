"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface QuizDetail {
  id: number;
  title: string;
  description: string;
  quizCode: string;
  clazz: { name: string; };
  folder: { name: string; };
}

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/tests/${id}`, { credentials: 'include' });
        if (!res.ok) {
          console.error('Failed to fetch test', res.status);
          setQuiz(null);
          return;
        }
        const data = await res.json();
        setQuiz(data);
      } catch (err) {
        console.error(err);
        setQuiz(null);
      } finally { setIsLoading(false); }
    };
    fetchData();
  }, [id]);

  if (isLoading) return <div>Đang tải...</div>;
  if (!quiz) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className='flex-1'>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">{quiz.description}</p>
        </div>
        {/* <Button>Sửa</Button> */}
      </div>

      <Card>
        <CardContent className="p-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Mã đề</div>
            <div className="font-mono bg-muted px-2 py-1 rounded-md inline-block">{quiz.quizCode}</div>
          </div>
           <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Lớp</div>
            <div>{quiz.clazz?.name}</div>
          </div>
           <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Thư mục từ vựng</div>
            <div>{quiz.folder?.name}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
