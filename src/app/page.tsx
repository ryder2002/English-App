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
      <div className="container mx-auto px-2 py-3 sm:px-4 sm:py-6 md:px-6 md:py-8 max-w-7xl">
        <div className="mb-8">
          {/* Mobile Layout */}
          <div className="block sm:hidden space-y-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent text-center">
              Từ vựng của tôi
            </h1>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => setIsSaveDialogOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                size="sm"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm từ mới
              </Button>
              <Button 
                onClick={() => setIsImportDialogOpen(true)} 
                variant="outline"
                className="w-full"
                size="sm"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Từ vựng của tôi
            </h1>
            <div className="flex gap-4">
              <Button 
                onClick={() => setIsSaveDialogOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm từ mới
              </Button>
              <Button 
                onClick={() => setIsImportDialogOpen(true)} 
                variant="outline"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
            </div>
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
