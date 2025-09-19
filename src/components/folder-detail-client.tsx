"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { SaveVocabularyDialog } from "@/components/save-vocabulary-dialog";

interface FolderDetailClientProps {
    folderName: string;
}

export function FolderDetailClient({ folderName }: FolderDetailClientProps) {
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/folders">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold font-headline tracking-tight bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-transparent bg-clip-text">
                        {folderName}
                    </h1>
                </div>
                <Button onClick={() => setIsSaveDialogOpen(true)} variant="default">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Thêm từ
                </Button>
            </div>
            <SaveVocabularyDialog
                open={isSaveDialogOpen}
                onOpenChange={setIsSaveDialogOpen}
                defaultFolder={folderName}
            />
        </>
    );
}