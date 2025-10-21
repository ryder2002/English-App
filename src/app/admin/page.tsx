"use client";

import { UserCircle, Users, Layers, BookOpen, FileText } from "lucide-react";
import { useAdminStats } from "./useAdminStats";
import Link from "next/link";

export default function AdminPage() {
  const { stats, isLoading, isError } = useAdminStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 px-6 py-6 border-b">
            <UserCircle className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-xl text-blue-700">Admin Panel</span>
          </div>
          <nav className="mt-6 space-y-2 px-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-blue-700 bg-blue-100 font-semibold"
            >
              <Layers className="w-5 h-5" /> Tổng quan
            </Link>
            <Link
              href="/admin/classes"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50"
            >
              <BookOpen className="w-5 h-5" /> Lớp học
            </Link>
            <Link
              href="/admin/folders"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50"
            >
              <Layers className="w-5 h-5" /> Folder
            </Link>
            <Link
              href="/admin/add-vocabulary"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50"
            >
              <FileText className="w-5 h-5" /> Thêm từ vựng
            </Link>
            <Link
              href="/admin/tests"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50"
            >
              <Users className="w-5 h-5" /> Kiểm tra
            </Link>
          </nav>
        </div>
        <div className="px-6 py-4 border-t">
          <span className="text-xs text-gray-400">
            © {new Date().getFullYear()} EnglishApp Admin
          </span>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-8">
          Thống kê tổng quan
        </h1>
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard
            label="Tổng học viên"
            value={stats?.studentCount ?? "--"}
            icon={<Users className="w-6 h-6 text-blue-500" />}
          />
          <StatCard
            label="Tổng lớp học"
            value={stats?.classCount ?? "--"}
            icon={<Layers className="w-6 h-6 text-green-500" />}
          />
          <StatCard
            label="Bộ từ vựng"
            value={stats?.vocabCount ?? "--"}
            icon={<BookOpen className="w-6 h-6 text-yellow-500" />}
          />
          <StatCard
            label="Bài kiểm tra"
            value={stats?.quizCount ?? "--"}
            icon={<FileText className="w-6 h-6 text-purple-500" />}
          />
        </div>

        {/* Recent activities */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">
            Hoạt động gần đây
          </h2>
          {isLoading ? (
            <div className="text-gray-400">Đang tải dữ liệu...</div>
          ) : isError ? (
            <div className="text-red-500">Lỗi tải dữ liệu.</div>
          ) : stats?.recentActivities?.length ? (
            <ul className="divide-y divide-gray-100">
              {stats.recentActivities.map((a: any, i: number) => (
                <li key={i} className="py-2 text-gray-700">
                  {a.text}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400">Chưa có dữ liệu.</div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: any;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow flex flex-col items-center justify-center py-8 px-4">
      <div className="mb-2">{icon}</div>
      <div className="text-2xl font-bold text-blue-900">{value}</div>
      <div className="text-gray-500 mt-1 text-sm">{label}</div>
    </div>
  );
}
