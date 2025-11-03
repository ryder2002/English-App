"use client";

import { AppShell } from "@/components/app-shell";
import { PlusCircle, FileSpreadsheet } from "lucide-react";
import { SaveVocabularyDialog } from "@/components/save-vocabulary-dialog";
import { ImportExcelDialog } from "@/components/import-excel-dialog";
import { Button } from "@/components/ui/button";
import { VocabularyList } from "@/components/vocabulary-list";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function VocabularyPage() {
  const auth = useAuth();
  const router = useRouter();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  useEffect(() => {
    if (!auth?.isLoading && !auth?.user) {
      router.replace("/login");
    }
  }, [auth, router]);

  if (auth?.isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!auth?.user) {
    return null; // Will redirect to login
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8 lg:py-10 max-w-7xl">
          {/* Header với gradient và animation */}
          <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-4 sm:p-5 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-glow animate-pulse-slow flex-shrink-0">
                <span className="text-xl sm:text-2xl md:text-3xl">📚</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                  Từ vựng của tôi
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                  Quản lý và học từ vựng của bạn
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button 
                onClick={() => setIsSaveDialogOpen(true)} 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 px-4 py-2.5 sm:px-6 sm:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold"
              >
                <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">➕ Thêm từ</span>
                <span className="sm:hidden">➕ Thêm</span>
              </Button>
              <Button 
                onClick={() => setIsImportDialogOpen(true)} 
                variant="outline"
                className="w-full sm:w-auto border-2 border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-600 transition-all duration-300 hover:scale-105 px-4 py-2.5 sm:px-6 sm:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">📊 Import Excel</span>
                <span className="sm:hidden">📊 Import</span>
              </Button>
            </div>
            <SaveVocabularyDialog
              open={isSaveDialogOpen}
              onOpenChange={setIsSaveDialogOpen}
            />
            <ImportExcelDialog
              open={isImportDialogOpen}
              onOpenChange={setIsImportDialogOpen}
            />
          </div>
          <VocabularyList />
        </div>
      </div>
    </AppShell>
  );
}
