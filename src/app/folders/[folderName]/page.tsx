'use client';

import { VocabularyFolderList } from "@/components/vocabulary-folder-list";
import { FolderDetailClient } from "@/components/folder-detail-client";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export default function FolderDetailPage() {
    const params = useParams();
    const folderName = decodeURIComponent(params.folderName as string);
    
    return (
        <AppShell>
            <div className="container mx-auto p-4 md:p-6 lg:p-8">
                <FolderDetailClient folderName={folderName} />
                <VocabularyFolderList folderName={folderName} />
            </div>
        </AppShell>
    );
}
