"use client";

import React from "react";
import { FlashcardPlayer } from "@/components/flashcard-player";
import { useVocabulary } from "@/contexts/vocabulary-context";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardStackPlusIcon } from "@radix-ui/react-icons";
import { AppShell } from "@/components/app-shell";

export default function FlashcardsPage() {
  const { folderObjects = [], buildFolderTree } = useVocabulary() || {};
  const folderTree = buildFolderTree();
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AppShell>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-gradient">
            Flashcards
          </h1>
          <div className="w-full sm:w-auto sm:min-w-[250px]">
            {mounted && (
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn một thư mục để học" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả từ vựng</SelectItem>
                  {folderTree.map((folder) => (
                    <React.Fragment key={folder.id}>
                      <SelectItem value={folder.name}>{folder.name}</SelectItem>
                      {folder.children &&
                        folder.children.map((child) => (
                          <SelectItem key={child.id} value={child.name}>
                            &nbsp;&nbsp;└ {child.name}
                          </SelectItem>
                        ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <FlashcardPlayer selectedFolder={selectedFolder} />
      </div>
    </AppShell>
  );
}
