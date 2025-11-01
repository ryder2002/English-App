"use client";

import { AppShell } from "@/components/app-shell";
import { PlusCircle } from "lucide-react";
import { SaveVocabularyDialog } from "@/components/save-vocabulary-dialog";
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
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {/* Header với gradient và animation */}
          <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-glow animate-pulse-slow">
                <span className="text-3xl">📚</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Từ vựng của tôi
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Quản lý và học từ vựng của bạn
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setIsSaveDialogOpen(true)} 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 px-6 py-6 rounded-xl text-base font-semibold"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              ➕ Thêm từ
            </Button>
            <SaveVocabularyDialog
              open={isSaveDialogOpen}
              onOpenChange={setIsSaveDialogOpen}
            />
          </div>
          <VocabularyList />
        </div>
      </div>
    </AppShell>
  );
}
