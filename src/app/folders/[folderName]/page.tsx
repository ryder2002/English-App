import { VocabularyFolderList } from "@/components/vocabulary-folder-list";
import { FolderDetailClient } from "@/components/folder-detail-client";

interface FolderDetailPageProps {
    params: {
        folderName: string;
    }
}

export default function FolderDetailPage({ params }: FolderDetailPageProps) {
    const folderName = decodeURIComponent(params.folderName);
    
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <FolderDetailClient folderName={folderName} />
            <VocabularyFolderList folderName={folderName} />
        </div>
    );
}
