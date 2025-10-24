"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function ClassEditPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/classes/${id}`, { credentials: 'include' });
        if (!res.ok) {
          console.error('Failed to fetch class', res.status);
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setName(data.name || '');
        setDescription(data.description || '');
      } catch (err) {
        console.error(err);
      } finally { setIsLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/classes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      router.push(`/admin/classes/${id}`);
    } catch (err: any) {
      setError(err.message || 'Lỗi');
    } finally { setIsSubmitting(false); }
  }

  if (isLoading) return <div className="text-center mt-8">Đang tải...</div>;
  if (!id) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Chỉnh sửa lớp: {name}</h1>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Input placeholder="Tên lớp" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Mô tả (tùy chọn)" value={description} onChange={(e) => setDescription(e.target.value)} />
          {error && <div className="text-destructive">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button onClick={handleSave} disabled={isSubmitting || !id}>{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button>
            <Button variant="ghost" onClick={() => router.back()}>Hủy</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
