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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {/* Header với gradient */}
          <div className="mb-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-md shadow-glow animate-pulse-slow">
                  <span className="text-3xl">🃏</span>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">
                    Flashcards
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Học từ vựng với flashcard thẻ
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto sm:min-w-[280px]">
                {mounted && (
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger className="w-full bg-white/90 dark:bg-gray-800/90 border-2 border-orange-200 dark:border-orange-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                      <SelectValue placeholder="📁 Chọn thư mục để học" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
                      <SelectItem value="all">📚 Tất cả từ vựng</SelectItem>
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
          </div>
          <FlashcardPlayer selectedFolder={selectedFolder} />
        </div>
      </div>
    </AppShell>
  );
}
