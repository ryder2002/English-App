import React from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <div className="font-bold text-xl text-blue-700">Admin Dashboard</div>
        <div className="space-x-4">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/classes">Lớp học</Link>
          <Link href="/admin/tests">Bài kiểm tra</Link>
          <Link href="/admin/folders">Thư mục/Từ vựng</Link>
        </div>
      </nav>
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
