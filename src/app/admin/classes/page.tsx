"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAdminClasses } from '@/app/admin/useAdminClasses';
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
  ChevronLeft, ChevronRight, MoreHorizontal, Search
} from 'lucide-react';
import { useSWRConfig } from 'swr';

export default function AdminClassesPage() {
  const { classes, isLoading } = useAdminClasses();
  const { mutate } = useSWRConfig();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    if (!classes) return [];
    const q = query.trim().toLowerCase();
    return classes.filter((c: any) => {
      if (!q) return true;
      return (
        String(c.name).toLowerCase().includes(q) ||
        String(c.classCode).toLowerCase().includes(q) ||
        String(c.teacher?.email || '').toLowerCase().includes(q)
      );
    });
  }, [classes, query]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa lớp này?')) return;
    try {
      const res = await fetch(`/api/admin/classes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to delete');
      // revalidate classes
      await mutate('/api/admin/classes');
    } catch (err: any) {
      console.error('Delete error', err);
      alert(err.message || 'Lỗi khi xóa');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-6 lg:p-8">
      {/* Header với gradient */}
      <div className="mb-6 md:mb-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-glow animate-pulse-slow">
              <span className="text-2xl md:text-3xl">🎓</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Quản lý Lớp học
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">Quản lý lớp, xem mã lớp và thành viên</p>
            </div>
          </div>
          
          {/* Search và Button - Responsive */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 w-full">
              <Input
                placeholder="🔍 Tìm theo tên, mã hoặc email giáo viên"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                className="pl-10 border-2 border-purple-200 dark:border-purple-800 rounded-xl"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
            <Link href="/admin/classes/new" className="w-full md:w-auto">
              <Button className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl font-semibold">
                ➕ Tạo lớp mới
              </Button>
            </Link>
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

          {!isLoading && (!classes || classes.length === 0) && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-bounce-slow">🎓</div>
              <div className="text-lg font-semibold text-muted-foreground mb-2">Chưa có lớp nào</div>
              <Link href="/admin/classes/new">
                <Button className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                  ➕ Tạo lớp học đầu tiên
                </Button>
              </Link>
            </div>
          )}

          {!isLoading && classes && classes.length > 0 && (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">🎓 Tên lớp</TableHead>
                      <TableHead className="font-semibold">🔑 Mã lớp</TableHead>
                      <TableHead className="font-semibold">👨‍🏫 Giáo viên</TableHead>
                      <TableHead className="text-right font-semibold">⚙️ Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageItems.map((c: any) => (
                      <TableRow key={c.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                        <TableCell>
                          <div className="font-bold text-base">{c.name}</div>
                          {c.description && (
                            <div className="text-sm text-muted-foreground mt-1">{c.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-2 py-1 rounded-lg text-sm font-bold">
                            {c.classCode}
                          </span>
                        </TableCell>
                        <TableCell>{c.teacher?.email}</TableCell>
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
                                <Link href={`/admin/classes/${c.id}`} className="cursor-pointer">👁️ Chi tiết</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/classes/${c.id}/edit`} className="cursor-pointer">✏️ Sửa</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(c.id)} className="text-destructive focus:text-destructive cursor-pointer">
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
                {pageItems.map((c: any) => (
                  <Card key={c.id} className="border-2 border-purple-200 dark:border-purple-800 bg-white/90 dark:bg-gray-800/90 hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-bold text-lg mb-1 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {c.name}
                          </h3>
                          {c.description && (
                            <p className="text-sm text-muted-foreground mb-2">{c.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-mono bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-2 py-1 rounded-lg font-bold">
                              🔑 {c.classCode}
                            </span>
                            {c.teacher?.email && (
                              <span className="text-muted-foreground">👨‍🏫 {c.teacher.email}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <Link href={`/admin/classes/${c.id}`} className="flex-1">
                            <Button variant="outline" className="w-full text-sm">
                              👁️ Chi tiết
                            </Button>
                          </Link>
                          <Link href={`/admin/classes/${c.id}/edit`} className="flex-1">
                            <Button variant="outline" className="w-full text-sm">
                              ✏️ Sửa
                            </Button>
                          </Link>
                          <Button 
                            variant="destructive" 
                            className="flex-1 text-sm"
                            onClick={() => handleDelete(c.id)}
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
                  Hiển thị {start + 1}–{Math.min(start + pageSize, total)} trên {total} lớp
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
