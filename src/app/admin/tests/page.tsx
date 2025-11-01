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
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Bài kiểm tra</h1>
          <p className="text-sm text-muted-foreground">Quản lý bài kiểm tra và xem kết quả.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Tìm theo tiêu đề, mã đề, lớp"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="min-w-[140px]">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger><SelectValue placeholder="Chọn lớp" /></SelectTrigger>
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
          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger><SelectValue placeholder="Chọn thư mục" /></SelectTrigger>
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
          <Link href="/admin/tests/new">
            <Button>+ Tạo bài mới</Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardContent>
          {isLoading && <div className="text-sm text-muted-foreground">Đang tải...</div>}

          {!isLoading && (!tests || tests.length === 0) && (
            <div className="text-muted-foreground">Chưa có bài kiểm tra nào.</div>
          )}

          {!isLoading && tests && tests.length > 0 && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Mã đề</TableHead>
                    <TableHead>Lớp học</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.title}</TableCell>
                      <TableCell>{t.quizCode}</TableCell>
                      <TableCell>{t.clazz?.name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Mở menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/tests/${t.id}`}>Chi tiết</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/tests/${t.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Sửa
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(t.id, t.title)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Hiển thị {start + 1}–{Math.min(start + pageSize, total)} trên {total} bài</div>
                <div className="flex items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="rounded border px-2 py-1 text-sm"
                  >
                    <option value={10}>10 / trang</option>
                    <option value={25}>25 / trang</option>
                    <option value={50}>50 / trang</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" onClick={goPrev} disabled={current === 1}>
                      <ChevronLeft />
                    </Button>
                    <div className="px-3 text-sm">{current} / {totalPages}</div>
                    <Button variant="ghost" onClick={goNext} disabled={current === totalPages}>
                      <ChevronRight />
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
