"use client";

import React from "react";
import { FlashcardPlayer } from "@/components/flashcard-player";
import { useVocabulary } from "@/contexts/vocabulary-context";
import { useState, useEffect } from "react";
import { FolderSelectItems } from "@/components/folder-select-items";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardStackPlusIcon } from "@radix-ui/react-icons";

export default function FlashcardsPage() {
  const { folderObjects = [], buildFolderTree } = useVocabulary() || {};
  const folderTree = buildFolderTree ? buildFolderTree() : [];
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:p-6 lg:p-8">
        {/* Header với gradient */}
        <div className="mb-4 sm:mb-6 md:mb-8 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-4 sm:p-5 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-md shadow-glow animate-pulse-slow flex-shrink-0">
                <span className="text-xl sm:text-2xl md:text-3xl">🃏</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">
                  Flashcards
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  Học từ vựng với flashcard thẻ
                </p>
              </div>
            </div>
            <div className="w-full">
              {mounted && (
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger className="w-full bg-white/90 dark:bg-gray-800/90 border-2 border-orange-200 dark:border-orange-800 rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-sm sm:text-base">
                    <SelectValue placeholder="📁 Chọn thư mục để học" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
                    <FolderSelectItems
                      folders={folderObjects || []}
                      folderTree={folderTree}
                      valueKey="name"
                      showAllOption={true}
                      allOptionLabel="📚 Tất cả từ vựng"
                    />
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
        <FlashcardPlayer selectedFolder={selectedFolder} />
      </div>
    </div>
  );
}
