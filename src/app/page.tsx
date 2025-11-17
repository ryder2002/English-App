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
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Từ vựng của tôi</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              onClick={() => setIsSaveDialogOpen(true)} 
              className="w-full sm:w-auto"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm từ
            </Button>
            <Button 
              onClick={() => setIsImportDialogOpen(true)} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
          </div>
        </div>

        <VocabularyList />

        <SaveVocabularyDialog
          open={isSaveDialogOpen}
          onOpenChange={setIsSaveDialogOpen}
        />
        <ImportExcelDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
        />
      </div>
    </AppShell>
  );
}
