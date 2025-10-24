"use client";

import React, { useState, useEffect } from "react";
import { useVocabulary } from "@/contexts/vocabulary-context";
import { VocabularyFolderList } from "@/components/vocabulary-folder-list";
import { SaveVocabularyDialog } from "@/components/save-vocabulary-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminFoldersPage() {
  const { folderObjects, addFolder, isLoadingInitialData } = useVocabulary();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    if (!selectedFolderId && folderObjects.length > 0) {
      setSelectedFolderId(folderObjects[0].id);
    }
  }, [folderObjects, selectedFolderId]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const newFolder = await addFolder(newFolderName.trim());
    if (newFolder) {
      setNewFolderName("");
      setSelectedFolderId(newFolder.id);
    }
  };

  const selectedFolder = folderObjects.find(f => f.id === selectedFolderId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex">
      {/* Sidebar folders */}
      <aside className="w-72 bg-white border-r shadow-sm flex flex-col">
        <div className="flex items-center justify-between px-6 py-6 border-b">
          <h2 className="font-bold text-lg text-blue-700">Thư mục</h2>
          <Button size="sm" variant="outline" onClick={() => setIsSaveDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Tạo mới
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          {isLoadingInitialData ? (
            <div className="text-sm text-muted-foreground">Đang tải...</div>
          ) : folderObjects.length === 0 ? (
            <div className="text-sm text-muted-foreground">Chưa có thư mục nào.</div>
          ) : (
            <ul className="space-y-1">
              {folderObjects.map((f) => (
                <li key={f.id}>
                  <button
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-lg transition font-medium",
                      selectedFolderId === f.id
                        ? "bg-blue-100 text-blue-700 shadow"
                        : "hover:bg-blue-50 text-gray-700"
                    )}
                    onClick={() => setSelectedFolderId(f.id)}
                  >
                    {f.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>
      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-800 mb-4">Quản lý Thư mục & Từ vựng</h1>
          <p className="text-sm text-muted-foreground mb-8">Tổ chức từ vựng của bạn vào các thư mục để dễ quản lý và học tập.</p>
          <div className="bg-white rounded-xl shadow-lg p-6">
            {selectedFolder ? (
              <VocabularyFolderList folderName={selectedFolder.name} />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-xl">
                <span className="mb-2">Chọn một thư mục để xem chi tiết.</span>
                <span className="text-xs">Chưa có thư mục nào được chọn.</span>
              </div>
            )}
          </div>
        </div>
      </main>
      <SaveVocabularyDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen} />
    </div>
  );
}
