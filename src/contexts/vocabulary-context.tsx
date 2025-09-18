"use client";

import type { VocabularyItem } from "@/lib/types";
import { createContext, useContext, useState, type ReactNode } from "react";

interface VocabularyContextType {
  vocabulary: VocabularyItem[];
  folders: string[];
  addVocabularyItem: (item: VocabularyItem) => void;
  removeVocabularyItem: (id: string) => void;
  updateVocabularyItem: (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => void;
  addFolder: (folderName: string) => void;
  removeFolder: (folderName: string) => void;
  updateFolder: (oldName: string, newName: string) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(
  undefined
);

const initialVocabulary: VocabularyItem[] = [
  {
    id: "1",
    word: "hello",
    language: "english",
    vietnameseTranslation: "xin chào",
    ipa: "/həˈloʊ/",
    folder: "Basics",
  },
  {
    id: "2",
    word: "你好",
    language: "chinese",
    vietnameseTranslation: "xin chào",
    pinyin: "nǐ hǎo",
    folder: "Basics",
  },
  {
    id: "3",
    word: "world",
    language: "english",
    vietnameseTranslation: "thế giới",
    ipa: "/wɜːrld/",
    folder: "Basics",
  },
  {
    id: "4",
    word: "世界",
    language: "chinese",
    vietnameseTranslation: "thế giới",
    pinyin: "shìjiè",
    folder: "Basics",
  },
   {
    id: "5",
    word: "travel",
    language: "english",
    vietnameseTranslation: "du lịch",
    ipa: "/ˈtrævəl/",
    folder: "Travel",
  },
  {
    id: "6",
    word: "旅行",
    language: "chinese",
    vietnameseTranslation: "du lịch",
    pinyin: "lǚxíng",
    folder: "Travel",
  },
];

const initialFolders = ["Basics", "Travel"];

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const [vocabulary, setVocabulary] =
    useState<VocabularyItem[]>(initialVocabulary);
  const [folders, setFolders] = useState<string[]>(initialFolders);
  const [isLoading, setIsLoading] = useState(false);

  const addVocabularyItem = (item: VocabularyItem) => {
    setVocabulary((prev) => [item, ...prev]);
    if (!folders.includes(item.folder)) {
      setFolders(prev => [...prev, item.folder]);
    }
  };

  const removeVocabularyItem = (id: string) => {
    setVocabulary((prev) => prev.filter((item) => item.id !== id));
  }
  
  const updateVocabularyItem = (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => {
    setVocabulary(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
     if (updates.folder && !folders.includes(updates.folder)) {
      setFolders(prev => [...prev, updates.folder!]);
    }
  }
  
  const addFolder = (folderName: string) => {
    if (!folders.includes(folderName)) {
        setFolders(prev => [folderName, ...prev]);
    }
  }

  const removeFolder = (folderName: string) => {
    setFolders(prev => prev.filter(f => f !== folderName));
    setVocabulary(prev => prev.filter(item => item.folder !== folderName));
  }

  const updateFolder = (oldName: string, newName: string) => {
    setFolders(prev => prev.map(f => (f === oldName ? newName : f)));
    setVocabulary(prev => prev.map(item => item.folder === oldName ? {...item, folder: newName} : item));
  }


  return (
    <VocabularyContext.Provider
      value={{ 
        vocabulary, 
        folders,
        addVocabularyItem, 
        removeVocabularyItem, 
        updateVocabularyItem, 
        isLoading, 
        setIsLoading,
        addFolder,
        removeFolder,
        updateFolder,
    }}
    >
      {children}
    </VocabularyContext.Provider>
  );
}

export function useVocabulary() {
  const context = useContext(VocabularyContext);
  if (context === undefined) {
    throw new Error("useVocabulary must be used within a VocabularyProvider");
  }
  return context;
}
