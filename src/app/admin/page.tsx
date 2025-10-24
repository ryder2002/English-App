"use client";

import { Users, Layers, BookOpen, FileText } from "lucide-react";
import { useAdminStats } from "./useAdminStats";

export default function AdminPage() {
  const { stats, isLoading, isError } = useAdminStats();

  return (
    <div>
        <h1 className="text-3xl font-bold text-blue-800 mb-8">
          Thống kê tổng quan
        </h1>
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard
            label="Tổng học viên"
            value={isLoading ? "..." : stats?.studentCount ?? "--"}
            icon={<Users className="w-6 h-6 text-blue-500" />}
          />
          <StatCard
            label="Tổng lớp học"
            value={isLoading ? "..." : stats?.classCount ?? "--"}
            icon={<Layers className="w-6 h-6 text-green-500" />}
          />
          <StatCard
            label="Bộ từ vựng"
            value={isLoading ? "..." : stats?.vocabCount ?? "--"}
            icon={<BookOpen className="w-6 h-6 text-yellow-500" />}
          />
          <StatCard
            label="Bài kiểm tra"
            value={isLoading ? "..." : stats?.quizCount ?? "--"}
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
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
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