
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
import { useAuth } from "./auth-context";

interface VocabularyContextType {
  vocabulary: VocabularyItem[];
  folders: string[];
  addVocabularyItem: (item: Omit<VocabularyItem, 'id' | 'createdAt'>) => Promise<void>;
  removeVocabularyItem: (id: string) => Promise<void>;
  updateVocabularyItem: (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => Promise<void>;
  addFolder: (folderName: string) => Promise<void>;
  removeFolder: (folderName: string) => Promise<void>;
  updateFolder: (oldName: string, newName: string) => Promise<void>;
  isLoading: boolean;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setVocabulary([]);
        setFolders([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        let [vocabData, folderData] = await Promise.all([
          getVocabulary(user.uid),
          getFolders(user.uid),
        ]);

        // If it's a new user with no data, create sample data
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
            await Promise.all(sampleWords.map(word => dbAddVocabularyItem(word, user.uid)));
            
            // Re-fetch data after creating samples
            [vocabData, folderData] = await Promise.all([
                getVocabulary(user.uid),
                getFolders(user.uid),
            ]);
        }
        
        setFolders(folderData);
        setVocabulary(vocabData);

      } catch (error) {
        console.error("Error loading data:", error);
        toast({
            variant: "destructive",
            title: "Lỗi tải dữ liệu",
            description: "Không thể tải từ vựng và thư mục.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, toast]);

  const addVocabularyItem = async (item: Omit<VocabularyItem, "id" | "createdAt">) => {
    if (!user) return;
    setIsLoading(true);
    try {
        // If folder doesn't exist, add it first.
        if (!folders.includes(item.folder)) {
            await addFolder(item.folder);
        }
        const newItem = await dbAddVocabularyItem(item, user.uid);
        setVocabulary((prev) => [newItem, ...prev]);
    } catch (error) {
         console.error("Error adding vocabulary item:", error);
         toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm từ vựng." });
    } finally {
        setIsLoading(false);
    }
  };

  const removeVocabularyItem = async (id: string) => {
    if (!user) return;
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
        setVocabulary(await getVocabulary(user.uid)); // Re-fetch to be safe
    }
  }
  
  const updateVocabularyItem = async (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => {
    if (!user) return;
    setIsLoading(true);
    try {
        if (updates.folder && !folders.includes(updates.folder)) {
           await addFolder(updates.folder);
        }
        await dbUpdateVocabularyItem(id, updates);
        setVocabulary(prev => prev.map(item => item.id === id ? { ...item, ...updates } as VocabularyItem : item));
    } catch (error) {
        console.error("Error updating vocabulary item:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật từ vựng." });
    } finally {
        setIsLoading(false);
    }
  }
  
  const addFolder = async (folderName: string) => {
    if (!user) return;
    if (folders.find(f => f.toLowerCase() === folderName.toLowerCase())) {
        toast({ variant: "destructive", title: "Thư mục đã tồn tại" });
        return;
    }
    setIsLoading(true);
    try {
        await dbAddFolder(folderName, user.uid);
        setFolders(prev => [...prev, folderName].sort());
    } catch (error) {
        console.error("Error adding folder:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm thư mục." });
    } finally {
        setIsLoading(false);
    }
  }

  const removeFolder = async (folderName: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
        await dbDeleteFolder(folderName, user.uid);
        await dbDeleteVocabularyByFolder(folderName, user.uid);
        
        setFolders(prev => prev.filter(f => f !== folderName));
        setVocabulary(prev => prev.filter(item => item.folder !== folderName));
        toast({
            title: "Đã xóa thư mục",
            description: `Thư mục "${folderName}" và các từ trong đó đã được xóa.`,
        });
    } catch (error) {
        console.error("Error deleting folder:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa thư mục." });
    } finally {
        setIsLoading(false);
    }
  }

  const updateFolder = async (oldName: string, newName: string) => {
    if (!user) return;
    if (folders.find(f => f.toLowerCase() === newName.toLowerCase() && f.toLowerCase() !== oldName.toLowerCase())) {
        toast({ variant: "destructive", title: "Tên thư mục đã được sử dụng." });
        return;
    }
    setIsLoading(true);
    try {
        await dbUpdateFolder(oldName, newName, user.uid);
        await dbUpdateVocabularyFolder(oldName, newName, user.uid);

        setFolders(prev => prev.map(f => (f === oldName ? newName : f)).sort());
        setVocabulary(prev => prev.map(item => item.folder === oldName ? {...item, folder: newName} : item));
    } catch (error) {
        console.error("Error updating folder:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật thư mục." });
    } finally {
        setIsLoading(false);
    }
  }

  const contextValue = {
    vocabulary,
    folders,
    addVocabularyItem,
    removeVocabularyItem,
    updateVocabularyItem,
    isLoading,
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
