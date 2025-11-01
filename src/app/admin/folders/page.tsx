"use client";

import { useState, useEffect } from "react";
import { useVocabulary } from "@/contexts/vocabulary-context";
import { VocabularyFolderList } from "@/components/vocabulary-folder-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderManagerWithHierarchy } from "@/components/folder-manager-hierarchy";
import { useRouter } from "next/navigation";

export default function AdminFoldersPage() {
  const { folderObjects } = useVocabulary();
  const router = useRouter();
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("folders");

  useEffect(() => {
    if (folderObjects.length > 0 && !selectedFolderName) {
      setSelectedFolderName(folderObjects[0].name);
    }
  }, [folderObjects, selectedFolderName]);

  // Intercept clicks on folder links
  useEffect(() => {
    const handleFolderClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/folders/"]');
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        const href = link.getAttribute('href');
        if (href) {
          const folderName = decodeURIComponent(href.replace('/folders/', ''));
          setSelectedFolderName(folderName);
          setActiveTab('vocabulary');
        }
      }
    };

    document.addEventListener('click', handleFolderClick, true);
    return () => {
      document.removeEventListener('click', handleFolderClick, true);
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-center mb-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight text-gradient">
          Quản lý Thư mục
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
          <TabsTrigger value="folders">Quản lý Thư mục</TabsTrigger>
          <TabsTrigger value="vocabulary" disabled={!selectedFolderName}>
            Từ vựng
            {selectedFolderName && ` (${selectedFolderName})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="folders">
          <FolderManagerWithHierarchy />
        </TabsContent>

        <TabsContent value="vocabulary">
          {selectedFolderName ? (
            <VocabularyFolderList folderName={selectedFolderName} />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-card mt-6">
              <p className="text-muted-foreground">Vui lòng chọn một thư mục để xem từ vựng.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click vào tên thư mục trong tab "Quản lý Thư mục" để xem từ vựng
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
