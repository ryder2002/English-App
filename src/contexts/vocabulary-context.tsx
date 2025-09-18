
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
  addVocabularyItem: (item: Omit<VocabularyItem, 'id' | 'createdAt'>) => Promise<void>;
  removeVocabularyItem: (id: string) => Promise<void>;
  updateVocabularyItem: (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => Promise<void>;
  addFolder: (folderName: string) => Promise<void>;
  removeFolder: (folderName: string) => Promise<void>;
  updateFolder: (oldName: string, newName: string) => Promise<void>;
  isLoading: boolean;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(
  undefined
);

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

        if (vocabData.length === 0 && folderData.length === 0) {
          const sampleFolder = "Thư mục mẫu";
          await dbAddFolder(sampleFolder, user.uid);
          const sampleWordData: Omit<VocabularyItem, 'id' | 'createdAt'> = {
            word: "hello",
            language: "english",
            vietnameseTranslation: "xin chào",
            folder: sampleFolder,
            ipa: "/həˈloʊ/",
          };
          const newWord = await dbAddVocabularyItem(sampleWordData, user.uid);
          
          folderData = [sampleFolder];
          vocabData = [newWord];
        }
        
        setFolders(folderData.sort());
        setVocabulary(vocabData);

      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu từ Firestore:", error);
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
        if (!folders.includes(item.folder)) {
            await addFolder(item.folder); // Use the context's addFolder to also update UI
        }
        const newItem = await dbAddVocabularyItem(item, user.uid);
        setVocabulary((prev) => [newItem, ...prev]);
    } catch (error) {
         console.error("Lỗi khi thêm từ vựng:", error);
         toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm từ vựng." });
    } finally {
        setIsLoading(false);
    }
  };

  const removeVocabularyItem = async (id: string) => {
    if (!user) return;
    const originalVocabulary = [...vocabulary];
    setVocabulary((prev) => prev.filter((item) => item.id !== id));
    try {
        await dbDeleteVocabularyItem(id);
        toast({
          title: "Đã xóa từ",
          description: "Từ vựng đã được xóa khỏi danh sách của bạn.",
      });
    } catch (error) {
        console.error("Lỗi khi xóa từ vựng:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa từ vựng." });
        setVocabulary(originalVocabulary);
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
        console.error("Lỗi khi cập nhật từ vựng:", error);
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
        console.error("Lỗi khi thêm thư mục:", error);
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
        console.error("Lỗi khi xóa thư mục:", error);
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
        console.error("Lỗi khi cập nhật thư mục:", error);
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
    throw new Error("useVocabulary phải được sử dụng trong một VocabularyProvider");
  }
  return context;
}
