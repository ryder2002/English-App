"use client";

import type { VocabularyItem } from "@/lib/types";
import { createContext, useContext, useState, type ReactNode, useEffect } from "react";
import { 
    getVocabulary,
    addVocabularyItem as dbAddVocabularyItem,
    updateVocabularyItem as dbUpdateVocabularyItem,
    deleteVocabularyItem as dbDeleteVocabularyItem,
    deleteVocabularyByFolder as dbDeleteVocabularyByFolder,
    updateVocabularyFolder as dbUpdateVocabularyFolder
} from "@/lib/services/vocabulary-service";
import {
    getFolders,
    addFolder as dbAddFolder,
    updateFolder as dbUpdateFolder,
    deleteFolder as dbDeleteFolder
} from "@/lib/services/folder-service";
import { useToast } from "@/hooks/use-toast";

interface VocabularyContextType {
  vocabulary: VocabularyItem[];
  folders: string[];
  addVocabularyItem: (item: VocabularyItem) => Promise<void>;
  removeVocabularyItem: (id: string) => Promise<void>;
  updateVocabularyItem: (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => Promise<void>;
  addFolder: (folderName: string) => Promise<void>;
  removeFolder: (folderName: string) => Promise<void>;
  updateFolder: (oldName: string, newName: string) => Promise<void>;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isDataReady: boolean;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(
  undefined
);

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [vocabData, folderData] = await Promise.all([
                getVocabulary(),
                getFolders()
            ]);
            setVocabulary(vocabData);
            // Add a default folder if none exist
            if (folderData.length === 0) {
              const defaultFolder = "Cơ bản";
              await dbAddFolder(defaultFolder);
              setFolders([defaultFolder]);
            } else {
              setFolders(folderData);
            }
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu từ Firestore:", error);
            toast({
                variant: "destructive",
                title: "Lỗi tải dữ liệu",
                description: "Không thể tải từ vựng và thư mục từ cơ sở dữ liệu.",
            });
        } finally {
            setIsLoading(false);
            setIsDataReady(true);
        }
    };
    fetchData();
  }, [toast]);
  

  const addVocabularyItem = async (item: VocabularyItem) => {
    const newItem = await dbAddVocabularyItem({
        word: item.word,
        language: item.language,
        folder: item.folder,
        vietnameseTranslation: item.vietnameseTranslation,
        ipa: item.ipa,
        pinyin: item.pinyin,
    });
    setVocabulary((prev) => [newItem, ...prev]);
    if (!folders.includes(item.folder)) {
      await addFolder(item.folder);
    }
  };

  const removeVocabularyItem = async (id: string) => {
    await dbDeleteVocabularyItem(id);
    setVocabulary((prev) => prev.filter((item) => item.id !== id));
  }
  
  const updateVocabularyItem = async (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => {
    await dbUpdateVocabularyItem(id, updates);
    setVocabulary(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
     if (updates.folder && !folders.includes(updates.folder)) {
      await addFolder(updates.folder);
    }
  }
  
  const addFolder = async (folderName: string) => {
    if (!folders.includes(folderName)) {
        await dbAddFolder(folderName);
        setFolders(prev => [folderName, ...prev]);
    }
  }

  const removeFolder = async (folderName: string) => {
    await dbDeleteFolder(folderName);
    await dbDeleteVocabularyByFolder(folderName);
    setFolders(prev => prev.filter(f => f !== folderName));
    setVocabulary(prev => prev.filter(item => item.folder !== folderName));
  }

  const updateFolder = async (oldName: string, newName: string) => {
    await dbUpdateFolder(oldName, newName);
    await dbUpdateVocabularyFolder(oldName, newName);
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
        isDataReady,
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
    throw new Error("useVocabulary phải được sử dụng trong một VocabularyProvider");
  }
  return context;
}
