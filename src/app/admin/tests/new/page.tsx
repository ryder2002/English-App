"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import useSWR from 'swr';
import { useVocabulary } from '@/contexts/vocabulary-context';
import { FolderSelectItems } from '@/components/folder-select-items';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json());

export default function NewTestPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clazzId, setClazzId] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [timePerQuestion, setTimePerQuestion] = useState<string>('0');
  const [direction, setDirection] = useState<string>('en_vi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: classes = [], isLoading: loadingClasses } = useSWR('/api/admin/classes', fetcher);
  const { folderObjects, buildFolderTree } = useVocabulary();
  const loadingFolders = !folderObjects;
  const folderTree = buildFolderTree ? buildFolderTree() : [];

  const handleCreate = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          clazzId: clazzId ? Number(clazzId) : null,
          folderId: folderId ? Number(folderId) : null,
          timePerQuestion: timePerQuestion ? Number(timePerQuestion) : 0,
          direction: direction || 'en_vi'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      router.push('/admin/tests');
    } catch (err: any) {
      setError(err.message || 'Lỗi');
    } finally { setIsSubmitting(false); }
  }

  const loading = loadingClasses || loadingFolders;

  return (
    <div>
      <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4">
        <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={() => router.back()}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 md:h-4 md:w-4"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg></Button>
        <h1 className="text-lg md:text-2xl font-bold">Tạo Bài kiểm tra</h1>
      </div>
      {loading ? (
        <div className="p-6 text-center text-muted-foreground">Đang tải dữ liệu...</div>
      ) : (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Input placeholder="Tiêu đề" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Mô tả (tùy chọn)" value={description} onChange={(e) => setDescription(e.target.value)} />

            <Select value={clazzId ?? 'all'} onValueChange={(v) => setClazzId(v === 'all' ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lớp</SelectItem>
                {classes.length === 0 && <SelectItem value="none" disabled>Không có lớp nào</SelectItem>}
                {classes.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={folderId ?? 'all'} onValueChange={(v) => setFolderId(v === 'all' ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn thư mục" />
              </SelectTrigger>
              <SelectContent>
                <FolderSelectItems 
                  folders={folderObjects || []}
                  folderTree={folderTree}
                  valueKey="id"
                  showAllOption={true}
                  allOptionLabel="Tất cả thư mục"
                />
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <label className="text-sm font-medium">Thời gian chuyển câu (giây)</label>
              <Input
                type="number"
                min="0"
                placeholder="0 = không tự động chuyển"
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nhập 0 để tắt tự động chuyển câu. Ví dụ: 5 = tự động chuyển sau 5 giây
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hướng dịch</label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn hướng dịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_vi">🇬🇧 Tiếng Anh → Tiếng Việt</SelectItem>
                  <SelectItem value="vi_en">🇻🇳 Tiếng Việt → Tiếng Anh</SelectItem>
                  <SelectItem value="random">🎲 Ngẫu nhiên</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Chọn hướng dịch cho bài kiểm tra: Anh→Việt, Việt→Anh, hoặc ngẫu nhiên
              </p>
            </div>

            {error && <div className="text-destructive">{error}</div>}
            <div className="flex justify-end gap-2">
              <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? 'Đang tạo...' : 'Tạo'}</Button>
              <Button variant="ghost" onClick={() => router.push('/admin/tests')}>Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
