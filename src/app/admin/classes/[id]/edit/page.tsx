"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/admin/classes/${id}`, { headers, credentials: 'include' });
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/classes/${id}`, {
        method: 'PUT',
        headers,
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

  if (isLoading) return <div>Đang tải...</div>;
  if (!id) return <div>Không tìm thấy ID lớp.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Chỉnh sửa lớp</h1>
      <Card>
        <CardContent className="space-y-4">
          <Input placeholder="Tên lớp" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Mô tả (tùy chọn)" value={description} onChange={(e) => setDescription(e.target.value)} />
          {error && <div className="text-destructive">{error}</div>}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSubmitting || !id}>{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button>
            <Button variant="ghost" onClick={() => router.push(`/admin/classes/${id}`)}>Hủy</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
