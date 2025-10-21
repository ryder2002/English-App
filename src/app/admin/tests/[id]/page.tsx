"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TestDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [quiz, setQuiz] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/admin/tests/${id}`, { headers, credentials: 'include' });
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
  if (!id) return <div>Không tìm thấy ID bài kiểm tra</div>;
  if (!quiz) return <div>Không tìm thấy bài kiểm tra</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <div>
          <Button variant="ghost">Sửa</Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="mb-2"><strong>Mã:</strong> {quiz.quizCode}</div>
          <div className="mb-2"><strong>Lớp:</strong> {quiz.clazz?.name}</div>
          <div className="mb-2"><strong>Thư mục:</strong> {quiz.folder?.name}</div>
          <div className="mb-2"><strong>Mô tả:</strong> {quiz.description}</div>
        </CardContent>
      </Card>
    </div>
  );
}
