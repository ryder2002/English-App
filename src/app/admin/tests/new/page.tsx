"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NewTestPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clazzId, setClazzId] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [cRes, fRes] = await Promise.all([fetch('/api/admin/classes'), fetch('/api/admin/folders')]);
        const cData = await cRes.json();
        const fData = await fRes.json();
        setClasses(cData);
        setFolders(fData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLists();
  }, []);

  const handleCreate = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) throw new Error('Unauthorized');
      const res = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ title, description, clazzId: Number(clazzId), folderId: Number(folderId) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      router.push('/admin/tests');
    } catch (err: any) {
      setError(err.message || 'Lỗi');
    } finally { setIsSubmitting(false); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tạo Bài kiểm tra</h1>
      <Card>
        <CardContent className="space-y-4">
          <Input placeholder="Tiêu đề" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Mô tả (tùy chọn)" value={description} onChange={(e) => setDescription(e.target.value)} />

          <Select onValueChange={(v) => setClazzId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn lớp" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => setFolderId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn thư mục" />
            </SelectTrigger>
            <SelectContent>
              {folders.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {error && <div className="text-destructive">{error}</div>}
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? 'Đang tạo...' : 'Tạo'}</Button>
            <Button variant="ghost" onClick={() => router.push('/admin/tests')}>Hủy</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
