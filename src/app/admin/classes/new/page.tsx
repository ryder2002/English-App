"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NewClassPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) throw new Error('Unauthorized');

      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      router.push('/admin/classes');
    } catch (err: any) {
      setError(err.message || 'Lỗi');
    } finally { setIsSubmitting(false); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tạo Lớp mới</h1>
      <Card>
        <CardContent className="space-y-4">
          <Input placeholder="Tên lớp" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Mô tả (tùy chọn)" value={description} onChange={(e) => setDescription(e.target.value)} />
          {error && <div className="text-destructive">{error}</div>}
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? 'Đang tạo...' : 'Tạo'}</Button>
            <Button variant="ghost" onClick={() => router.push('/admin/classes')}>Hủy</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
