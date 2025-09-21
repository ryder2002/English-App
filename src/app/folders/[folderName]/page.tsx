import { VocabularyFolderList } from "@/components/vocabulary-folder-list";
import { FolderDetailClient } from "@/components/folder-detail-client";

interface FolderDetailPageProps {
    params: {
        folderName: string;
    },
    searchParams: {
        id: string;
    }
}

export default function FolderDetailPage({ params, searchParams }: FolderDetailPageProps) {
    const folderName = decodeURIComponent(params.folderName);
    const folderId = searchParams.id;
    
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <FolderDetailClient folderName={folderName} folderId={folderId} />
            <VocabularyFolderList folderId={folderId} />
        </div>
    );
}
