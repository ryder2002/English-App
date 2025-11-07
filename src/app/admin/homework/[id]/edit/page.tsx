"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useAdminClasses } from '@/app/admin/useAdminClasses';

export default function EditHomeworkPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { classes } = useAdminClasses();
  const homeworkId = params?.id as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'listening' | 'reading'>('listening');
  const [clazzId, setClazzId] = useState<string>('');
  const [deadline, setDeadline] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [promptText, setPromptText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [answerBoxesText, setAnswerBoxesText] = useState('');
  const [hideMode, setHideMode] = useState<'all' | 'random'>('all');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'active' | 'locked' | 'archived'>('active');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    if (!homeworkId) return;
    fetchHomework();
  }, [homeworkId]);

  const fetchHomework = async () => {
    try {
      const res = await fetch(`/api/admin/homework/${homeworkId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load homework');
      const data = await res.json();
      
      setTitle(data.title);
      setDescription(data.description || '');
      setType(data.type);
      setClazzId(String(data.clazzId));
      setDeadline(new Date(data.deadline).toISOString().slice(0, 16));
      setAudioUrl(data.audioUrl || '');
      setPromptText(data.promptText || '');
      setAnswerText(data.answerText || '');
      setHideMode(data.hideMode || 'all');
      setContent(data.content || '');
      setStatus(data.status);
      setAnswerBoxesText(Array.isArray(data.answerBoxes) ? data.answerBoxes.join('\n') : '');
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải bài tập',
        variant: 'destructive',
      });
      router.push('/admin/homework');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Lỗi',
        description: 'Chỉ chấp nhận file audio',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Lỗi',
        description: 'File không được vượt quá 10MB',
        variant: 'destructive',
      });
      return;
    }

    setAudioFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/homework/upload-audio', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await res.json();
      setAudioUrl(data.url);
      toast({
        title: 'Thành công',
        description: 'Đã tải lên file audio',
      });
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải lên file',
        variant: 'destructive',
      });
      setAudioFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !type || !clazzId || !deadline) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'listening' && (!audioUrl || !answerText)) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng tải lên audio và nhập đáp án',
        variant: 'destructive',
      });
      return;
    }

    if (!answerText) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập đáp án đầy đủ',
        variant: 'destructive',
      });
      return;
    }

    if (!promptText) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập văn bản giao cho học viên',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/homework/${homeworkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          deadline,
          audioUrl: type === 'listening' ? audioUrl : null,
          promptText: type === 'listening' ? promptText : promptText || null,
          answerText,
          hideMode: type === 'listening' ? hideMode : null,
          content: type === 'reading' ? content : null,
          status,
          answerBoxes: answerBoxesText
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật bài tập',
      });

      router.push('/admin/homework');
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật bài tập',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">Đang tải...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
            Chỉnh sửa Bài tập
          </h1>
        </div>

        <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Thông tin bài tập</CardTitle>
            <CardDescription>Cập nhật thông tin bài tập</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Tiêu đề *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Loại bài tập</Label>
              <Select value={type} onValueChange={(v: 'listening' | 'reading') => setType(v)} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="listening">🎧 Bài tập nghe</SelectItem>
                  <SelectItem value="reading">📖 Bài tập đọc</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Không thể thay đổi loại bài tập sau khi tạo</p>
            </div>

            <div className="space-y-2">
              <Label>Lớp học *</Label>
              <Select value={clazzId} onValueChange={setClazzId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deadline *</Label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={status} onValueChange={(v: 'active' | 'locked' | 'archived') => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">✅ Đang mở</SelectItem>
                  <SelectItem value="locked">🔒 Đã khóa</SelectItem>
                  <SelectItem value="archived">📦 Đã lưu trữ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === 'listening' && (
              <>
                <div className="space-y-2">
                  <Label>File Audio *</Label>
                  {audioUrl ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <span className="flex-1 text-sm">✅ {audioFile?.name || 'Đã tải lên'}</span>
                      <audio src={audioUrl} controls className="flex-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAudioUrl('');
                          setAudioFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="audio-upload"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="audio-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {isUploading ? 'Đang tải lên...' : 'Click để chọn file audio mới'}
                      </span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {['listening', 'reading'].includes(type) && (
              <div className="space-y-2">
                <Label>Văn bản giao cho học viên (có chỗ trống)</Label>
                <Textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={6}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Đáp án đầy đủ *</Label>
              <Textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Các đáp án dưới dạng ô (mỗi dòng một đáp án)</Label>
              <Textarea
                value={answerBoxesText}
                onChange={(e) => setAnswerBoxesText(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">Học viên sẽ điền vào các ô trống tương ứng.</p>
            </div>

            {type === 'listening' && (
              <>
                <div className="space-y-2">
                  <Label>Chế độ ẩn đáp án</Label>
                  <Select value={hideMode} onValueChange={(v: 'all' | 'random') => setHideMode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Ẩn toàn bộ</SelectItem>
                      <SelectItem value="random">Ẩn ngẫu nhiên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {type === 'reading' && (
              <div className="space-y-2">
                <Label>Nội dung bài đọc *</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => router.back()}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

