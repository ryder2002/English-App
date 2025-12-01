'use client';

import { VocabularyFolderList } from "@/components/vocabulary-folder-list";
import { FolderDetailClient } from "@/components/folder-detail-client";
import { useParams } from "next/navigation";

export default function FolderDetailPage() {
    const params = useParams();
    const folderName = decodeURIComponent(
        params && typeof params.folderName !== 'undefined'
            ? Array.isArray(params.folderName)
                ? params.folderName[0] ?? ''
                : params.folderName ?? ''
            : ''
    );
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <FolderDetailClient folderName={folderName} />
            <VocabularyFolderList folderName={folderName} />
        </div>
    );
}
