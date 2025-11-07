"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import useSWR from 'swr';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useAdminClasses } from '@/app/admin/useAdminClasses';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json());

export default function NewHomeworkPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { classes } = useAdminClasses();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'listening' | 'reading' | 'speaking'>('listening');
  const [clazzId, setClazzId] = useState<string>('');
  const [deadline, setDeadline] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [promptText, setPromptText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [answerBoxesText, setAnswerBoxesText] = useState('');
  const [hideMode, setHideMode] = useState<'all' | 'random'>('all');
  const [content, setContent] = useState('');
  const [speakingText, setSpeakingText] = useState(''); // New field for speaking
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Lỗi',
        description: 'Chỉ chấp nhận file audio (mp3, wav, ogg, webm, m4a)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
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
        description: 'Vui lòng tải lên audio và nhập đáp án đầy đủ cho bài tập nghe',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'reading' && !answerText) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập đáp án đầy đủ cho bài tập',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'speaking' && !speakingText) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập văn bản cho học viên đọc',
        variant: 'destructive',
      });
      return;
    }

    if (type !== 'speaking' && !promptText) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập văn bản gửi cho học viên',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          type,
          clazzId: Number(clazzId),
          deadline,
          audioUrl: type === 'listening' ? audioUrl : null,
          promptText: type !== 'speaking' ? promptText : null,
          answerText: type !== 'speaking' ? answerText : null,
          hideMode: type === 'listening' ? hideMode : null,
          content: type === 'reading' ? content : null,
          speakingText: type === 'speaking' ? speakingText : null,
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
        description: 'Đã tạo bài tập về nhà',
      });

      router.push('/admin/homework');
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tạo bài tập',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
            Tạo Bài tập về nhà
          </h1>
        </div>

        <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Thông tin bài tập</CardTitle>
            <CardDescription>Điền thông tin để tạo bài tập mới</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Tiêu đề *</Label>
              <Input
                placeholder="Ví dụ: Bài tập nghe Unit 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                placeholder="Mô tả bài tập (tùy chọn)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Loại bài tập *</Label>
              <Select value={type} onValueChange={(v: 'listening' | 'reading' | 'speaking') => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="listening">🎧 Bài tập nghe</SelectItem>
                  <SelectItem value="reading">📖 Bài tập đọc</SelectItem>
                  <SelectItem value="speaking">🎤 Bài tập nói</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lớp học *</Label>
              <Select value={clazzId} onValueChange={setClazzId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent>
                  {(!classes || classes.length === 0) ? (
                    <SelectItem value="__loading__" disabled>Đang tải lớp...</SelectItem>
                  ) : (
                    classes.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))
                  )}
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
              <p className="text-xs text-muted-foreground">
                Sau deadline, bài tập sẽ tự động bị khóa
              </p>
            </div>

            {type === 'listening' && (
              <>
                <div className="space-y-2">
                  <Label>File Audio *</Label>
                  {audioUrl ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <span className="flex-1 text-sm">✅ {audioFile?.name || 'Đã tải lên'}</span>
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
                  ) : (
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
                          {isUploading ? 'Đang tải lên...' : 'Click để chọn file audio (mp3, wav, ogg, max 10MB)'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </>
            )}

            {['listening', 'reading'].includes(type) && (
              <>
                <div className="space-y-2">
                  <Label>Văn bản giao cho học viên (có chỗ trống) *</Label>
                  <Textarea
                    placeholder="Dán đoạn văn bản với chỗ trống cho học viên..."
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Đoạn văn này sẽ hiển thị cho học viên khi làm bài.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Đáp án đầy đủ *</Label>
                  <Textarea
                    placeholder="Nhập toàn bộ đáp án chuẩn"
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Hệ thống sẽ so sánh bài làm của học viên với đáp án này.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Các đáp án dưới dạng ô (mỗi dòng một đáp án)</Label>
                  <Textarea
                    placeholder={"Ví dụ:\n1) Hi\n2) mean to you"}
                    value={answerBoxesText}
                    onChange={(e) => setAnswerBoxesText(e.target.value)}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">Học viên sẽ thấy các ô trống tương ứng để điền. Chấm điểm theo từng ô.</p>
                </div>
              </>
            )}

            {type === 'speaking' && (
              <div className="space-y-2">
                <Label>Văn bản cho học viên đọc *</Label>
                <Textarea
                  placeholder="Nhập đoạn văn bản mà học viên cần đọc to và thu âm..."
                  value={speakingText}
                  onChange={(e) => setSpeakingText(e.target.value)}
                  rows={8}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Học viên sẽ nghe mẫu (Text-to-Speech), sau đó thu âm giọng đọc của mình. Hệ thống sẽ chuyển giọng nói thành văn bản và so sánh với văn bản gốc.
                </p>
                {speakingText && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(speakingText);
                        utterance.lang = 'en-US';
                        utterance.rate = 0.85;
                        window.speechSynthesis.speak(utterance);
                      }
                    }}
                  >
                    🔊 Nghe thử giọng mẫu
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Chế độ ẩn đáp án</Label>
              <Select value={hideMode} onValueChange={(v: 'all' | 'random') => setHideMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ẩn toàn bộ (Học viên nghe và chép lại)</SelectItem>
                  <SelectItem value="random">Ẩn ngẫu nhiên (Học viên điền vào chỗ trống)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {hideMode === 'all'
                  ? 'Học viên sẽ nghe và chép lại toàn bộ nội dung'
                  : 'Hệ thống sẽ ẩn khoảng 30% từ ngẫu nhiên để học viên điền vào'}
              </p>
            </div>

            {type === 'reading' && (
              <div className="space-y-2">
                <Label>Nội dung bài đọc *</Label>
                <Textarea
                  placeholder="Nhập nội dung bài đọc"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                />
                <p className="text-xs text-muted-foreground">
                  Tính năng bài tập đọc sẽ được phát triển thêm sau
                </p>
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
                {isSubmitting ? 'Đang tạo...' : 'Tạo bài tập'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

