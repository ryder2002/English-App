"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ClassMember { id: number; email: string; }
interface ClassDetail {
  id: number;
  name: string;
  description: string;
  classCode: string;
  teacher: { email: string; };
  members: ClassMember[];
}

export default function ClassDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const [clazz, setClazz] = useState<ClassDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/classes/${id}`, { credentials: 'include' });
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
  if (!clazz) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className='flex-1'>
          <h1 className="text-2xl font-bold">{clazz.name}</h1>
          <p className="text-sm text-muted-foreground">{clazz.description}</p>
        </div>
        <Button onClick={() => router.push(`/admin/classes/${id}/edit`)}>Sửa</Button>
      </div>

      <Card>
        <CardContent className="p-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Mã lớp</div>
            <div className="font-mono bg-muted px-2 py-1 rounded-md inline-block">{clazz.classCode}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Giáo viên</div>
            <div>{clazz.teacher?.email}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Số thành viên</div>
            <div>{Array.isArray(clazz.members) ? clazz.members.length : 0}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
