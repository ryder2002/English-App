"use client";

import { Users, Layers, BookOpen, FileText } from "lucide-react";
import { useAdminStats } from "./useAdminStats";

export default function AdminPage() {
  const { stats, isLoading, isError } = useAdminStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-6 lg:p-8">
        {/* Header với gradient */}
        <div className="mb-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-glow animate-pulse-slow">
              <span className="text-2xl md:text-3xl">📊</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Thống kê tổng quan
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Tổng quan về hệ thống và hoạt động
              </p>
            </div>
          </div>
        </div>

        {/* Stats cards với responsive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
          <StatCard
            label="Tổng học viên"
            value={isLoading ? "..." : stats?.studentCount ?? "--"}
            icon={<Users className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />}
          />
          <StatCard
            label="Tổng lớp học"
            value={isLoading ? "..." : stats?.classCount ?? "--"}
            icon={<Layers className="w-5 h-5 md:w-6 md:h-6 text-green-500" />}
          />
          <StatCard
            label="Bộ từ vựng"
            value={isLoading ? "..." : stats?.vocabCount ?? "--"}
            icon={<BookOpen className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />}
          />
          <StatCard
            label="Bài kiểm tra"
            value={isLoading ? "..." : stats?.quizCount ?? "--"}
            icon={<FileText className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />}
          />
        </div>

        {/* Recent activities */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-gray-200/50 dark:border-gray-700/50 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📋 Hoạt động gần đây
          </h2>
          {isLoading ? (
            <div className="text-gray-400 text-sm md:text-base py-4">⏳ Đang tải dữ liệu...</div>
          ) : isError ? (
            <div className="text-red-500 text-sm md:text-base py-4">❌ Lỗi tải dữ liệu.</div>
          ) : stats?.recentActivities?.length ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats.recentActivities.map((a: any, i: number) => (
                <li key={i} className="py-3 text-sm md:text-base text-gray-700 dark:text-gray-300">
                  {a.text}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400 text-sm md:text-base py-4">📭 Chưa có dữ liệu.</div>
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
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center py-4 md:py-6 px-3 md:px-4 border border-gray-200/50 dark:border-gray-700/50">
      <div className="mb-2">{icon}</div>
      <div className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{value}</div>
      <div className="text-gray-600 dark:text-gray-400 mt-1 text-xs md:text-sm text-center font-medium">{label}</div>
    </div>
  );
}