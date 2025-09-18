"use client";

import type { VocabularyItem } from "@/lib/types";
import { createContext, useContext, useState, type ReactNode } from "react";

interface VocabularyContextType {
  vocabulary: VocabularyItem[];
  addVocabularyItem: (item: VocabularyItem) => void;
  removeVocabularyItem: (id: string) => void;
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
    ipa: "/həˈloʊ/",
    vietnameseTranslation: "xin chào",
  },
  {
    id: "2",
    word: "你好",
    language: "chinese",
    pinyin: "nǐ hǎo",
    vietnameseTranslation: "xin chào",
  },
  {
    id: "3",
    word: "world",
    language: "english",
    ipa: "/wɜːrld/",
    vietnameseTranslation: "thế giới",
  },
  {
    id: "4",
    word: "世界",
    language: "chinese",
    pinyin: "shìjiè",
    vietnameseTranslation: "thế giới",
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

  return (
    <VocabularyContext.Provider
      value={{ vocabulary, addVocabularyItem, removeVocabularyItem, isLoading, setIsLoading }}
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
