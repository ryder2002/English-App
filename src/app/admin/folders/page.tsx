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
    <div className="min-h-screen">
      {/* Header với gradient */}
      <div className="mb-6 md:mb-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center shadow-md shadow-glow animate-pulse-slow">
            <span className="text-2xl md:text-3xl">📁</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent">
              Quản lý Thư mục
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Quản lý thư mục và từ vựng</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-4 md:mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800 rounded-xl p-1">
          <TabsTrigger 
            value="folders" 
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-md text-sm md:text-base font-semibold"
          >
            📂 Quản lý Thư mục
          </TabsTrigger>
          <TabsTrigger 
            value="vocabulary" 
            disabled={!selectedFolderName}
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md text-sm md:text-base font-semibold"
          >
            📝 Từ vựng
            {selectedFolderName && (
              <span className="ml-1 hidden sm:inline">
                ({selectedFolderName.length > 15 ? selectedFolderName.substring(0, 15) + '...' : selectedFolderName})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="folders" className="mt-4 md:mt-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-gray-200/50 dark:border-gray-700/50 p-4 md:p-6">
            <FolderManagerWithHierarchy />
          </div>
        </TabsContent>

        <TabsContent value="vocabulary" className="mt-4 md:mt-6">
          {selectedFolderName ? (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-gray-200/50 dark:border-gray-700/50 p-4 md:p-6">
              <VocabularyFolderList folderName={selectedFolderName} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 md:p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm mt-4 md:mt-6">
              <div className="text-5xl md:text-6xl mb-4 animate-bounce-slow">📁</div>
              <p className="text-base md:text-lg font-semibold text-muted-foreground mb-2">Vui lòng chọn một thư mục để xem từ vựng</p>
              <p className="text-sm text-muted-foreground">
                Click vào tên thư mục trong tab "Quản lý Thư mục" để xem từ vựng
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
