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
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Lớp học</h1>
          <p className="text-sm text-muted-foreground">Quản lý lớp, xem mã lớp và thành viên.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Tìm theo tên, mã hoặc email giáo viên"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Link href="/admin/classes/new">
            <Button>+ Tạo lớp mới</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent>
          {isLoading && <div className="text-sm text-muted-foreground">Đang tải...</div>}

          {!isLoading && (!classes || classes.length === 0) && (
            <div className="text-muted-foreground">Chưa có lớp nào. Tạo lớp mới để bắt đầu.</div>
          )}

          {!isLoading && classes && classes.length > 0 && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên lớp</TableHead>
                    <TableHead>Mã lớp</TableHead>
                    <TableHead>Giáo viên</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-muted-foreground">{c.description}</div>
                      </TableCell>
                      <TableCell>{c.classCode}</TableCell>
                      <TableCell>{c.teacher?.email}</TableCell>
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
                              <Link href={`/admin/classes/${c.id}`}>Chi tiết</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/classes/${c.id}/edit`}>Sửa</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(c.id)} className="text-destructive focus:text-destructive">Xóa</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Hiển thị {start + 1}–{Math.min(start + pageSize, total)} trên {total} lớp</div>
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
