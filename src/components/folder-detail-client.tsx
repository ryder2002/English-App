"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { SaveVocabularyDialog } from "@/components/save-vocabulary-dialog";
import { ImportExcelDialog } from "@/components/import-excel-dialog";

interface FolderDetailClientProps {
    folderName: string;
}

export function FolderDetailClient({ folderName }: FolderDetailClientProps) {
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/folders">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold font-headline tracking-tight text-gradient">
                        {folderName}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
                        <span className="hidden sm:inline">📊 Import Excel</span>
                        <span className="sm:hidden">📊</span>
                    </Button>
                    <Button onClick={() => setIsSaveDialogOpen(true)} variant="default">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Thêm từ
                    </Button>
                </div>
            </div>
            <SaveVocabularyDialog
                open={isSaveDialogOpen}
                onOpenChange={setIsSaveDialogOpen}
                defaultFolder={folderName}
            />
            <ImportExcelDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                defaultFolder={folderName}
            />
        </>
    );
}
