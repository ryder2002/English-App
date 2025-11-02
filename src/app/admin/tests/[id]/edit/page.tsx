"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminClasses } from '@/app/admin/useAdminClasses';
import { useVocabulary } from '@/contexts/vocabulary-context';
import { FolderSelectItems } from '@/components/folder-select-items';

export default function EditTestPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params?.id as string | undefined;
  const { classes } = useAdminClasses();
  const { folderObjects, buildFolderTree } = useVocabulary();
  const folderTree = buildFolderTree ? buildFolderTree() : [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clazzId, setClazzId] = useState<string>('');
  const [folderId, setFolderId] = useState<string>('');
  const [timePerQuestion, setTimePerQuestion] = useState<string>('0');
  const [direction, setDirection] = useState<string>('en_vi');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/admin/tests/${id}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load quiz');
      }

      const data = await res.json();
      setTitle(data.title || '');
      setDescription(data.description || '');
      setClazzId(String(data.clazzId || ''));
      setFolderId(String(data.folderId || ''));
      setTimePerQuestion(String((data as any).timePerQuestion || 0));
      setDirection((data as any).direction || 'en_vi');
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải bài kiểm tra',
        variant: 'destructive',
      });
      router.push('/admin/tests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !clazzId || !folderId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/tests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          clazzId: Number(clazzId),
          folderId: Number(folderId),
          timePerQuestion: timePerQuestion ? Number(timePerQuestion) : 0,
          direction: direction || 'en_vi',
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update quiz');
      }

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật bài kiểm tra',
      });

      router.push(`/admin/tests/${id}`);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật bài kiểm tra',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
        <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={() => router.back()}>
          <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg md:text-2xl font-bold">Sửa bài kiểm tra</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Cập nhật thông tin bài kiểm tra</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin bài kiểm tra</CardTitle>
          <CardDescription>Điền thông tin để cập nhật bài kiểm tra</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài kiểm tra"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả bài kiểm tra (tùy chọn)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Lớp học *</Label>
              <Select value={clazzId} onValueChange={setClazzId} required>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Chọn lớp học" />
                </SelectTrigger>
                <SelectContent>
                  {!classes || classes.length === 0 ? (
                    <SelectItem value="" disabled>Chưa có lớp học</SelectItem>
                  ) : (
                    classes.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder">Thư mục từ vựng *</Label>
              <Select value={folderId} onValueChange={setFolderId} required>
                <SelectTrigger id="folder">
                  <SelectValue placeholder="Chọn thư mục" />
                </SelectTrigger>
                <SelectContent>
                  <FolderSelectItems 
                    folders={folderObjects || []}
                    folderTree={folderTree}
                    valueKey="id"
                    showAllOption={false}
                    includeEmpty={true}
                  />
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timePerQuestion">Thời gian chuyển câu (giây) *</Label>
              <Input
                id="timePerQuestion"
                type="number"
                min="0"
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(e.target.value)}
                placeholder="0 = không tự động chuyển"
              />
              <p className="text-xs text-muted-foreground">
                Nhập 0 để tắt tự động chuyển câu. Ví dụ: 5 = tự động chuyển sau 5 giây
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction">Hướng dịch *</Label>
              <Select value={direction} onValueChange={setDirection} required>
                <SelectTrigger id="direction">
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

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

