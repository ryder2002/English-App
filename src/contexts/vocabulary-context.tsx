"use client";

import type { VocabularyItem } from "@/lib/types";
import { createContext, useContext, useState, type ReactNode } from "react";

interface VocabularyContextType {
  vocabulary: VocabularyItem[];
  addVocabularyItem: (item: VocabularyItem) => void;
  removeVocabularyItem: (id: string) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  getFolders: () => string[];
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(
  undefined
);

const initialVocabulary: VocabularyItem[] = [
  {
    id: "1",
    word: "hello",
    language: "english",
    ipa: "/həˈloʊ/",
    vietnameseTranslation: "xin chào",
    folder: "Basics",
  },
  {
    id: "2",
    word: "你好",
    language: "chinese",
    pinyin: "nǐ hǎo",
    vietnameseTranslation: "xin chào",
    folder: "Basics",
  },
  {
    id: "3",
    word: "world",
    language: "english",
    ipa: "/wɜːrld/",
    vietnameseTranslation: "thế giới",
    folder: "Basics",
  },
  {
    id: "4",
    word: "世界",
    language: "chinese",
    pinyin: "shìjiè",
    vietnameseTranslation: "thế giới",
    folder: "Basics",
  },
   {
    id: "5",
    word: "travel",
    language: "english",
    ipa: "/ˈtrævəl/",
    vietnameseTranslation: "du lịch",
    folder: "Travel",
  },
  {
    id: "6",
    word: "旅行",
    language: "chinese",
    pinyin: "lǚxíng",
    vietnameseTranslation: "du lịch",
    folder: "Travel",
  },
];

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const [vocabulary, setVocabulary] =
    useState<VocabularyItem[]>(initialVocabulary);
  const [isLoading, setIsLoading] = useState(false);

  const addVocabularyItem = (item: VocabularyItem) => {
    setVocabulary((prev) => [item, ...prev]);
  };

  const removeVocabularyItem = (id: string) => {
    setVocabulary((prev) => prev.filter((item) => item.id !== id));
  }

  const getFolders = () => {
    const folders = new Set(vocabulary.map(item => item.folder));
    return Array.from(folders);
  }

  return (
    <VocabularyContext.Provider
      value={{ vocabulary, addVocabularyItem, removeVocabularyItem, isLoading, setIsLoading, getFolders }}
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
