"use client";

import { AppShell } from "@/components/app-shell";
import { PlusCircle } from "lucide-react";
import { SaveVocabularyDialog } from "@/components/save-vocabulary-dialog";
import { Button } from "@/components/ui/button";
import { VocabularyList } from "@/components/vocabulary-list";
import { useState } from "react";

export default function VocabularyPage() {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  return (
    <AppShell>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-gradient">
            Từ vựng của tôi
          </h1>
          <Button onClick={() => setIsSaveDialogOpen(true)} variant="default">
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm từ
          </Button>
          <SaveVocabularyDialog
            open={isSaveDialogOpen}
            onOpenChange={setIsSaveDialogOpen}
          />
        </div>
        <VocabularyList />
      </div>
    </AppShell>
  );
}
