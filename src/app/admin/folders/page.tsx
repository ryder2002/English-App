"use client";

import React, { useState } from "react";
import { useVocabulary } from "@/contexts/vocabulary-context";
import { VocabularyFolderList } from "@/components/vocabulary-folder-list";
import { SaveVocabularyDialog } from "@/components/save-vocabulary-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AdminFoldersPage() {
  const { folderObjects, buildFolderTree, addFolder, removeFolder, updateFolder, isLoadingInitialData } = useVocabulary();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();

  const tree = buildFolderTree();

  // Ensure a folder is selected when data loads
  React.useEffect(() => {
    if (!selectedFolder && folderObjects.length > 0) {
      setSelectedFolder(folderObjects[0].name);
    }
  }, [folderObjects, selectedFolder]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const ok = await addFolder(newFolderName.trim());
    if (ok) {
      setNewFolderName("");
      toast({ title: "Đã tạo thư mục", description: `"${newFolderName}" đã được tạo.` });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
      <aside>
        <Card className="sticky top-6">
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Thư mục</h2>
              <Button size="sm" onClick={() => setIsSaveDialogOpen(true)}>+ Thêm từ</Button>
            </div>

            <div className="space-y-2">
              {isLoadingInitialData && <div className="text-sm text-muted-foreground">Đang tải...</div>}

              {folderObjects.length === 0 && !isLoadingInitialData && (
                <div className="text-sm text-muted-foreground">Chưa có thư mục nào. Tạo thư mục mới bên dưới.</div>
              )}

              {folderObjects.map((f) => (
                <button
                  key={f.id}
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-muted ${selectedFolder === f.name ? 'bg-muted/50 font-medium' : ''}`}
                  onClick={() => setSelectedFolder(f.name)}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Input
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Tên thư mục mới"
                className="flex-1"
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              />
              <Button onClick={handleCreateFolder}>Tạo</Button>
            </div>
          </CardContent>
        </Card>
      </aside>
      <main>
        {selectedFolder ? (
          <VocabularyFolderList selectedFolder={selectedFolder} />
        ) : (
          <div className="text-center text-muted-foreground mt-10">Chọn một thư mục để xem chi tiết.</div>
        )}
      </main>
      <SaveVocabularyDialog open={isSaveDialogOpen} setOpen={setIsSaveDialogOpen} />
    </div>
  );
}
