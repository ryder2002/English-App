"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ClassDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const [clazz, setClazz] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/admin/classes/${id}`, { headers, credentials: 'include' });
        if (!res.ok) {
          console.error('Failed to fetch class', res.status);
          setClazz(null);
          return;
        }

        const data = await res.json();
        setClazz(data);
      } catch (err) {
        console.error(err);
        setClazz(null);
      } finally { setIsLoading(false); }
    };
    fetchData();
  }, [id]);

  if (isLoading) return <div>Đang tải...</div>;
  if (!id) return <div>Không tìm thấy ID lớp</div>;
  if (!clazz) return <div>Không tìm thấy lớp</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{clazz.name}</h1>
        <div>
          <Button variant="ghost" onClick={() => router.push(`/admin/classes/${id}/edit`)}>Sửa</Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="mb-2"><strong>Mã:</strong> {clazz.classCode}</div>
          <div className="mb-2"><strong>Giáo viên:</strong> {clazz.teacher?.email}</div>
          <div className="mb-2"><strong>Số thành viên:</strong> {Array.isArray(clazz.members) ? clazz.members.length : 0}</div>
          <div className="mb-2"><strong>Mô tả:</strong> {clazz.description}</div>
        </CardContent>
      </Card>
    </div>
  );
}
