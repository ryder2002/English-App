'use client';

import { VocabularyFolderList } from "@/components/vocabulary-folder-list";
import { FolderDetailClient } from "@/components/folder-detail-client";
import { useParams } from "next/navigation";

export default function FolderDetailPage() {
    const params = useParams();
    const folderName = decodeURIComponent(params.folderName as string);
    
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <FolderDetailClient folderName={folderName} />
            <VocabularyFolderList folderName={folderName} />
        </div>
    );
}
