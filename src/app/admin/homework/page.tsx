"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAdminHomework } from '@/app/admin/useAdminHomework';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft, ChevronRight, MoreHorizontal, Search, Edit, Trash2
} from 'lucide-react';
import { useSWRConfig } from 'swr';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminClasses } from '@/app/admin/useAdminClasses';
import { Badge } from '@/components/ui/badge';

export default function AdminHomeworkPage() {
  const { homework, isLoading, mutate } = useAdminHomework();
  const { classes } = useAdminClasses();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const { toast } = useToast();
  const router = useRouter();

  const filtered = useMemo(() => {
    let filteredHomework = homework || [];
    if (selectedClass && selectedClass !== 'all') {
      filteredHomework = filteredHomework.filter((h: any) => String(h.clazz?.id) === selectedClass);
    }
    if (selectedType && selectedType !== 'all') {
      filteredHomework = filteredHomework.filter((h: any) => h.type === selectedType);
    }
    const q = query.trim().toLowerCase();
    return filteredHomework.filter((h: any) => {
      if (!q) return true;
      return (
        String(h.title).toLowerCase().includes(q) ||
        String(h.clazz?.name || '').toLowerCase().includes(q)
      );
    });
  }, [homework, query, selectedClass, selectedType]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const start = (current - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const handleDelete = async (homeworkId: number, homeworkTitle: string) => {
    if (!confirm(`Bạn có chắc muốn xóa bài tập "${homeworkTitle}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/homework/${homeworkId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete homework');
      }

      toast({
        title: 'Thành công',
        description: 'Đã xóa bài tập',
      });

      if (mutate) {
        mutate();
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể xóa bài tập',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (homework: any) => {
    const now = new Date();
    const deadline = new Date(homework.deadline);
    const isExpired = deadline < now;
    
    if (homework.status === 'locked' || isExpired) {
      return <Badge className="bg-red-500">🔒 Đã khóa</Badge>;
    }
    if (homework.status === 'archived') {
      return <Badge className="bg-gray-500">📦 Đã lưu trữ</Badge>;
    }
    return <Badge className="bg-green-500">✅ Đang mở</Badge>;
  };

  const getTypeBadge = (type: string) => {
    if (type === 'listening') {
      return <Badge className="bg-blue-500">🎧 Nghe</Badge>;
    }
    return <Badge className="bg-purple-500">📖 Đọc</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md shadow-glow animate-pulse-slow">
              <span className="text-2xl md:text-3xl">📚</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                Quản lý Bài tập về nhà
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">Quản lý bài tập nghe và đọc cho học viên</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 w-full">
              <Input
                placeholder="🔍 Tìm theo tiêu đề, lớp"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                className="pl-10 border-2 border-purple-200 dark:border-purple-800 rounded-xl"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="min-w-[140px] flex-1 md:flex-none">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="border-2 border-purple-200 dark:border-purple-800 rounded-xl">
                    <SelectValue placeholder="📚 Chọn lớp" />
                  </SelectTrigger>
                  <SelectContent>
                    {(!classes || classes.length === 0) ? (
                      <SelectItem value="__loading__" disabled>Đang tải lớp...</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="all">Tất cả lớp</SelectItem>
                        {classes.map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[140px] flex-1 md:flex-none">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="border-2 border-purple-200 dark:border-purple-800 rounded-xl">
                    <SelectValue placeholder="📝 Loại bài" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    <SelectItem value="listening">🎧 Nghe</SelectItem>
                    <SelectItem value="reading">📖 Đọc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Link href="/admin/homework/new" className="w-full md:w-auto">
                <Button className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl font-semibold">
                  ➕ Tạo bài mới
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardContent className="p-4 md:p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm text-muted-foreground">Đang tải...</div>
              </div>
            </div>
          )}

          {!isLoading && (!homework || homework.length === 0) && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-bounce-slow">📚</div>
              <div className="text-lg font-semibold text-muted-foreground mb-2">Chưa có bài tập nào</div>
              <Link href="/admin/homework/new">
                <Button className="mt-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white">
                  ➕ Tạo bài tập đầu tiên
                </Button>
              </Link>
            </div>
          )}

          {!isLoading && homework && homework.length > 0 && (
            <div className="space-y-4">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">📝 Tiêu đề</TableHead>
                      <TableHead className="font-semibold">📝 Loại</TableHead>
                      <TableHead className="font-semibold">🎓 Lớp học</TableHead>
                      <TableHead className="font-semibold">⏰ Deadline</TableHead>
                      <TableHead className="font-semibold">📊 Số bài nộp</TableHead>
                      <TableHead className="font-semibold">🔒 Trạng thái</TableHead>
                      <TableHead className="text-right font-semibold">⚙️ Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageItems.map((h: any) => (
                      <TableRow key={h.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                        <TableCell className="font-medium">{h.title}</TableCell>
                        <TableCell>{getTypeBadge(h.type)}</TableCell>
                        <TableCell>{h.clazz?.name || '-'}</TableCell>
                        <TableCell>{new Date(h.deadline).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell>{h._count?.submissions || 0}</TableCell>
                        <TableCell>{getStatusBadge(h)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/20">
                                <span className="sr-only">Mở menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/homework/${h.id}`} className="cursor-pointer">👁️ Chi tiết</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/homework/${h.id}/edit`} className="cursor-pointer">
                                  <Edit className="mr-2 h-4 w-4" />
                                  ✏️ Sửa
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(h.id, h.title)}
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                🗑️ Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {pageItems.map((h: any) => (
                  <Card key={h.id} className="border-2 border-purple-200 dark:border-purple-800 bg-white/90 dark:bg-gray-800/90 hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-bold text-lg mb-1 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                            {h.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            {getTypeBadge(h.type)}
                            {getStatusBadge(h)}
                            {h.clazz?.name && (
                              <span className="text-muted-foreground">🎓 {h.clazz.name}</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            ⏰ Deadline: {new Date(h.deadline).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            📊 Số bài nộp: {h._count?.submissions || 0}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <Link href={`/admin/homework/${h.id}`} className="flex-1">
                            <Button variant="outline" className="w-full text-sm">
                              👁️ Chi tiết
                            </Button>
                          </Link>
                          <Link href={`/admin/homework/${h.id}/edit`} className="flex-1">
                            <Button variant="outline" className="w-full text-sm">
                              ✏️ Sửa
                            </Button>
                          </Link>
                          <Button 
                            variant="destructive" 
                            className="flex-1 text-sm"
                            onClick={() => handleDelete(h.id, h.title)}
                          >
                            🗑️ Xóa
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs md:text-sm text-muted-foreground text-center sm:text-left">
                  Hiển thị {start + 1}–{Math.min(start + pageSize, total)} trên {total} bài
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="rounded-lg border-2 border-purple-200 dark:border-purple-800 px-2 py-1.5 text-xs md:text-sm bg-white dark:bg-gray-800"
                  >
                    <option value={10}>10 / trang</option>
                    <option value={25}>25 / trang</option>
                    <option value={50}>50 / trang</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={goPrev} disabled={current === 1} className="h-8 w-8 p-0">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="px-2 md:px-3 text-xs md:text-sm font-medium">{current} / {totalPages}</div>
                    <Button variant="ghost" size="sm" onClick={goNext} disabled={current === totalPages} className="h-8 w-8 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

