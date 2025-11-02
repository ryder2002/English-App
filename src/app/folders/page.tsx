import { AppShell } from "@/components/app-shell";
import { FolderManagerWithHierarchy } from "@/components/folder-manager-hierarchy";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quản lý Thư mục - CN",
};

export default function FoldersPage() {
    return (
        <AppShell>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
                <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:p-6 lg:p-8">
                    {/* Header với gradient */}
                    <div className="mb-4 sm:mb-6 md:mb-8 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-4 sm:p-5 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center justify-center gap-3 sm:gap-4">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-glow-green animate-pulse-slow flex-shrink-0">
                                <span className="text-xl sm:text-2xl md:text-3xl">📁</span>
                            </div>
                            <div className="text-center sm:text-left">
                                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                    Quản lý Thư mục
                                </h1>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                                    Tổ chức từ vựng của bạn theo thư mục
                                </p>
                            </div>
                        </div>
                    </div>
                    <FolderManagerWithHierarchy />
                </div>
            </div>
        </AppShell>
    );
}
