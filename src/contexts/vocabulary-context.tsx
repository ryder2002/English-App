
"use client";

import type { VocabularyItem } from "@/lib/types";
import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react";
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
import { useAuth } from "./auth-context";

interface VocabularyContextType {
  vocabulary: VocabularyItem[];
  folders: string[];
  addVocabularyItem: (item: Omit<VocabularyItem, 'id' | 'createdAt'>) => Promise<boolean>;
  removeVocabularyItem: (id: string) => Promise<void>;
  updateVocabularyItem: (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => Promise<boolean>;
  addFolder: (folderName: string) => Promise<boolean>;
  removeFolder: (folderName: string) => Promise<void>;
  updateFolder: (oldName: string, newName: string) => Promise<boolean>;
  isLoadingInitialData: boolean;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setVocabulary([]);
      setFolders([]);
      setIsLoadingInitialData(false);
      return;
    }

    const fetchData = async () => {
      setIsLoadingInitialData(true);
      try {
        let [vocabData, folderData] = await Promise.all([
          getVocabulary(user.uid),
          getFolders(user.uid),
        ]);

        if (vocabData.length === 0 && folderData.length === 0) {
            const sampleFolders = ["Chủ đề chung", "Động vật", "Thức ăn"];
            await Promise.all(sampleFolders.map(folder => dbAddFolder(folder, user.uid)));
            
            const sampleWords: Omit<VocabularyItem, 'id' | 'createdAt'>[] = [
                { word: "hello", language: "english", vietnameseTranslation: "xin chào", folder: "Chủ đề chung", ipa: "/həˈloʊ/" },
                { word: "你好", language: "chinese", vietnameseTranslation: "xin chào", folder: "Chủ đề chung", pinyin: "nǐ hǎo" },
                { word: "dog", language: "english", vietnameseTranslation: "con chó", folder: "Động vật", ipa: "/dɔːɡ/" },
                { word: "猫", language: "chinese", vietnameseTranslation: "con mèo", folder: "Động vật", pinyin: "māo" },
                { word: "apple", language: "english", vietnameseTranslation: "quả táo", folder: "Thức ăn", ipa: "/ˈæp.əl/" },
            ];

            const newWords = await Promise.all(sampleWords.map(word => dbAddVocabularyItem(word, user.uid)));
            
            folderData = sampleFolders;
            vocabData = newWords;
        }
        
        setFolders(folderData.sort());
        setVocabulary(vocabData);

      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
            variant: "destructive",
            title: "Lỗi tải dữ liệu",
            description: "Không thể tải từ vựng và thư mục.",
        });
      } finally {
        setIsLoadingInitialData(false);
      }
    };
    
    fetchData();
  }, [user, toast]);

  const addVocabularyItem = useCallback(async (item: Omit<VocabularyItem, "id" | "createdAt">): Promise<boolean> => {
    if (!user) return false;
    try {
        if (!folders.includes(item.folder)) {
            const folderAdded = await addFolder(item.folder);
            if (!folderAdded) return false; 
        }
        const newItem = await dbAddVocabularyItem(item, user.uid);
        setVocabulary((prev) => [newItem, ...prev]);
        return true;
    } catch (error) {
         console.error("Error adding vocabulary item:", error);
         toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm từ vựng." });
         return false;
    }
  }, [user, toast, folders]);

  const removeVocabularyItem = useCallback(async (id: string) => {
    if (!user) return;
    const originalVocabulary = vocabulary;
    setVocabulary((prev) => prev.filter((item) => item.id !== id));
    try {
        await dbDeleteVocabularyItem(id);
        toast({
          title: "Đã xóa từ",
          description: "Từ vựng đã được xóa khỏi danh sách của bạn.",
      });
    } catch (error) {
        console.error("Error deleting vocabulary item:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa từ vựng." });
        setVocabulary(originalVocabulary);
    }
  }, [user, toast, vocabulary]);
  
  const updateVocabularyItem = useCallback(async (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>): Promise<boolean> => {
    if (!user) return false;
    try {
        if (updates.folder && !folders.includes(updates.folder)) {
           const folderAdded = await addFolder(updates.folder);
           if (!folderAdded) return false;
        }
        await dbUpdateVocabularyItem(id, updates);
        setVocabulary(prev => prev.map(item => item.id === id ? { ...item, ...updates } as VocabularyItem : item));
        return true;
    } catch (error) {
        console.error("Error updating vocabulary item:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật từ vựng." });
        return false;
    }
  }, [user, toast, folders]);
  
  const addFolder = useCallback(async (folderName: string): Promise<boolean> => {
    if (!user) return false;
    if (folders.find(f => f.toLowerCase() === folderName.toLowerCase())) {
        toast({ variant: "destructive", title: "Thư mục đã tồn tại" });
        return false;
    }
    try {
        await dbAddFolder(folderName, user.uid);
        setFolders(prev => [...prev, folderName].sort());
        return true;
    } catch (error) {
        console.error("Error adding folder:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm thư mục." });
        return false;
    }
  }, [user, toast, folders]);

  const removeFolder = useCallback(async (folderName: string) => {
    if (!user) return;
    const originalFolders = folders;
    const originalVocabulary = vocabulary;
    try {
        await dbDeleteFolder(folderName, user.uid);
        await dbDeleteVocabularyByFolder(folderName, user.uid);
        
        setFolders(prev => prev.filter(f => f !== folderName));
        setVocabulary(prev => prev.filter(item => item.folder !== folderName));
    } catch (error) {
        console.error("Error deleting folder:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa thư mục." });
        setFolders(originalFolders);
        setVocabulary(originalVocabulary);
    }
  }, [user, toast, folders, vocabulary]);

  const updateFolder = useCallback(async (oldName: string, newName: string): Promise<boolean> => {
    if (!user) return false;
    if (folders.find(f => f.toLowerCase() === newName.toLowerCase() && f.toLowerCase() !== oldName.toLowerCase())) {
        toast({ variant: "destructive", title: "Tên thư mục đã được sử dụng." });
        return false;
    }
    try {
        await dbUpdateFolder(oldName, newName, user.uid);
        await dbUpdateVocabularyFolder(oldName, newName, user.uid);

        setFolders(prev => prev.map(f => (f === oldName ? newName : f)).sort());
        setVocabulary(prev => prev.map(item => item.folder === oldName ? {...item, folder: newName} : item));
        return true;
    } catch (error) {
        console.error("Error updating folder:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật thư mục." });
        return false;
    }
  }, [user, toast, folders]);

  const contextValue = {
    vocabulary,
    folders,
    addVocabularyItem,
    removeVocabularyItem,
    updateVocabularyItem,
    isLoadingInitialData,
    addFolder,
    removeFolder,
    updateFolder,
  };

  return (
    <VocabularyContext.Provider value={contextValue}>
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
