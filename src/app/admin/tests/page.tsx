"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAdminTests } from '@/app/admin/useAdminTests';
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
import { useVocabulary } from '@/contexts/vocabulary-context';

export default function AdminTestsPage() {
  const { tests, isLoading, mutate } = useAdminTests();
  const { classes } = useAdminClasses();
  const { folderObjects } = useVocabulary();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const { toast } = useToast();
  const router = useRouter();

  const filtered = useMemo(() => {
    let filteredTests = tests || [];
    if (selectedClass && selectedClass !== 'all') {
      filteredTests = filteredTests.filter((t: any) => String(t.clazz?.id) === selectedClass);
    }
    if (selectedFolder && selectedFolder !== 'all') {
      filteredTests = filteredTests.filter((t: any) => String(t.folderId) === selectedFolder);
    }
    const q = query.trim().toLowerCase();
    return filteredTests.filter((t: any) => {
      if (!q) return true;
      return (
        String(t.title).toLowerCase().includes(q) ||
        String(t.quizCode).toLowerCase().includes(q) ||
        String(t.clazz?.name || '').toLowerCase().includes(q)
      );
    });
  }, [tests, query, selectedClass, selectedFolder]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const start = (current - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const handleDelete = async (testId: number, testTitle: string) => {
    if (!confirm(`Bạn có chắc muốn xóa bài kiểm tra "${testTitle}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/tests/${testId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete test');
      }

      toast({
        title: 'Thành công',
        description: 'Đã xóa bài kiểm tra',
      });

      // Refresh the list
      if (mutate) {
        mutate();
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể xóa bài kiểm tra',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-6 lg:p-8">
      {/* Header với gradient */}
      <div className="mb-6 md:mb-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md shadow-glow-green animate-pulse-slow">
              <span className="text-2xl md:text-3xl">📝</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Quản lý Bài kiểm tra
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">Quản lý bài kiểm tra và xem kết quả</p>
            </div>
          </div>
          
          {/* Search và Filters - Responsive */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 w-full">
              <Input
                placeholder="🔍 Tìm theo tiêu đề, mã đề, lớp"
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
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger className="border-2 border-purple-200 dark:border-purple-800 rounded-xl">
                    <SelectValue placeholder="📁 Chọn thư mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {(!folderObjects || folderObjects.length === 0) ? (
                      <SelectItem value="__loading__" disabled>Đang tải thư mục...</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="all">Tất cả thư mục</SelectItem>
                        {folderObjects.map((f: any) => (
                          <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Link href="/admin/tests/new" className="w-full md:w-auto">
                <Button className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl font-semibold">
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

          {!isLoading && (!tests || tests.length === 0) && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-bounce-slow">📝</div>
              <div className="text-lg font-semibold text-muted-foreground mb-2">Chưa có bài kiểm tra nào</div>
              <Link href="/admin/tests/new">
                <Button className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                  ➕ Tạo bài kiểm tra đầu tiên
                </Button>
              </Link>
            </div>
          )}

          {!isLoading && tests && tests.length > 0 && (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">📝 Tiêu đề</TableHead>
                      <TableHead className="font-semibold">🔑 Mã đề</TableHead>
                      <TableHead className="font-semibold">🎓 Lớp học</TableHead>
                      <TableHead className="text-right font-semibold">⚙️ Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageItems.map((t: any) => (
                      <TableRow key={t.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                        <TableCell className="font-medium">{t.title}</TableCell>
                        <TableCell>
                          <span className="font-mono bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-2 py-1 rounded-lg text-sm font-bold">
                            {t.quizCode}
                          </span>
                        </TableCell>
                        <TableCell>{t.clazz?.name || '-'}</TableCell>
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
                                <Link href={`/admin/tests/${t.id}`} className="cursor-pointer">👁️ Chi tiết</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/tests/${t.id}/edit`} className="cursor-pointer">
                                  <Edit className="mr-2 h-4 w-4" />
                                  ✏️ Sửa
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(t.id, t.title)}
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

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {pageItems.map((t: any) => (
                  <Card key={t.id} className="border-2 border-purple-200 dark:border-purple-800 bg-white/90 dark:bg-gray-800/90 hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-bold text-lg mb-1 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            {t.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-mono bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-2 py-1 rounded-lg font-bold">
                              🔑 {t.quizCode}
                            </span>
                            {t.clazz?.name && (
                              <span className="text-muted-foreground">🎓 {t.clazz.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <Link href={`/admin/tests/${t.id}`} className="flex-1">
                            <Button variant="outline" className="w-full text-sm">
                              👁️ Chi tiết
                            </Button>
                          </Link>
                          <Link href={`/admin/tests/${t.id}/edit`} className="flex-1">
                            <Button variant="outline" className="w-full text-sm">
                              ✏️ Sửa
                            </Button>
                          </Link>
                          <Button 
                            variant="destructive" 
                            className="flex-1 text-sm"
                            onClick={() => handleDelete(t.id, t.title)}
                          >
                            🗑️ Xóa
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination - Responsive */}
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
