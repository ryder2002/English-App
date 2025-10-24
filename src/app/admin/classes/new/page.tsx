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
    try { // Removed token retrieval and Authorization header
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Removed Authorization header
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
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg></Button>
        <h1 className="text-2xl font-bold">Tạo Lớp mới</h1>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Input placeholder="Tên lớp" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Mô tả (tùy chọn)" value={description} onChange={(e) => setDescription(e.target.value)} />
          {error && <div className="text-destructive">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? 'Đang tạo...' : 'Tạo'}</Button>
            <Button variant="ghost" onClick={() => router.push('/admin/classes')}>Hủy</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
