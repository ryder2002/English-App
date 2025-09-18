"use client";

import { PlusCircle } from "lucide-react";
import { AddVocabularyDialog } from "@/components/add-vocabulary-dialog";
import { Button } from "@/components/ui/button";
import { VocabularyList } from "@/components/vocabulary-list";
import { useState } from "react";

export default function VocabularyPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          My Vocabulary
        </h1>
        <AddVocabularyDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        >
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Word
          </Button>
        </AddVocabularyDialog>
      </div>
      <VocabularyList />
    </div>
  );
}
