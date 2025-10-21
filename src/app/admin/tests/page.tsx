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
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function AdminTestsPage() {
  const { tests, isLoading } = useAdminTests();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    if (!tests) return [];
    const q = query.trim().toLowerCase();
    return tests.filter((t: any) => {
      if (!q) return true;
      return (
        String(t.title).toLowerCase().includes(q) ||
        String(t.quizCode).toLowerCase().includes(q) ||
        String(t.clazz?.name || '').toLowerCase().includes(q)
      );
    });
  }, [tests, query]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold font-headline tracking-tight text-gradient">
          Quản lý bài kiểm tra
        </h1>
        <div className="w-full sm:w-auto sm:min-w-[250px]">
          <Input
            placeholder="Tìm kiếm bài kiểm tra..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full"
            startIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Mã đề</TableHead>
                <TableHead>Lớp học</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Đang tải...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Không có dữ liệu</TableCell>
                </TableRow>
              ) : (
                filtered.slice((current - 1) * pageSize, current * pageSize).map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.title}</TableCell>
                    <TableCell>{t.quizCode}</TableCell>
                    <TableCell>{t.clazz?.name || '-'}</TableCell>
                    <TableCell>
                      <Link href={`/admin/tests/${t.id}`} className="text-blue-600 hover:underline">Xem</Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={current === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm">
          Trang {current} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={current === totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
