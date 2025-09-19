
'use client';

import { VocabularyFolderList } from "@/components/vocabulary-folder-list";
import { Button } from "@/components/ui/button";
import { ChevronLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SaveVocabularyDialog } from "@/components/save-vocabulary-dialog";

interface FolderDetailPageProps {
    params: {
        folderName: string;
    }
}

export default function FolderDetailPage({ params }: FolderDetailPageProps) {
    const folderName = decodeURIComponent(params.folderName);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
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
            <VocabularyFolderList folderName={folderName} />
            <SaveVocabularyDialog
                open={isSaveDialogOpen}
                onOpenChange={setIsSaveDialogOpen}
                defaultFolder={folderName}
            />
        </div>
    );
}

