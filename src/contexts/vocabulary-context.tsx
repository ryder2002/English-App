"use client";

import type { VocabularyItem } from "@/lib/types";
import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react";
import { 
    getVocabulary,
    addVocabularyItem as dbAddVocabularyItem,
    addManyVocabularyItems as dbAddManyVocabularyItems,
    updateVocabularyItem as dbUpdateVocabularyItem,
    deleteVocabularyItem as dbDeleteVocabularyItem,
    updateVocabularyFolder as dbUpdateVocabularyFolder,
    deleteVocabularyByFolder as dbDeleteVocabularyByFolder,
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
  addVocabularyItem: (item: Omit<VocabularyItem, 'id' | 'createdAt' | 'userId'>) => Promise<boolean>;
  addManyVocabularyItems: (items: Omit<VocabularyItem, 'id' | 'createdAt' | 'userId'>[]) => Promise<void>;
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
    const fetchData = async () => {
      if (!user) {
        setVocabulary([]);
        setFolders([]);
        setIsLoadingInitialData(false);
        return;
      }
      setIsLoadingInitialData(true);
      try {
        const [vocabData, folderData] = await Promise.all([
          getVocabulary(user.uid),
          getFolders(user.uid),
        ]);
        setVocabulary(vocabData);
        setFolders(folderData);
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

  const addVocabularyItem = useCallback(async (item: Omit<VocabularyItem, "id" | "createdAt" | "userId">): Promise<boolean> => {
    if (!user) return false;
    try {
        const newItem = await dbAddVocabularyItem(item, user.uid);
        setVocabulary((prev) => [newItem, ...prev]);
        return true;
    } catch (error) {
         console.error("Error adding vocabulary item:", error);
         toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm từ vựng." });
         return false;
    }
  }, [user, toast]);
  
  const addManyVocabularyItems = useCallback(async (items: Omit<VocabularyItem, 'id' | 'createdAt' | 'userId'>[]) => {
    if (!user) return;
    try {
        const newItems = await dbAddManyVocabularyItems(items, user.uid);
        setVocabulary((prev) => [...newItems, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
         console.error("Error batch adding vocabulary items:", error);
         toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm từ vựng hàng loạt." });
    }
  }, [user, toast]);

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
    
    const originalItem = vocabulary.find(v => v.id === id);
    setVocabulary(prev => prev.map(item => item.id === id ? { ...item, ...updates } as VocabularyItem : item));
    
    try {
        await dbUpdateVocabularyItem(id, updates);
        return true;
    } catch (error) {
        console.error("Error updating vocabulary item:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật từ vựng." });
        if (originalItem) {
          setVocabulary(prev => prev.map(item => item.id === id ? originalItem : item));
        }
        return false;
    }
  }, [user, toast, vocabulary]);

  const addFolder = useCallback(async (folderName: string): Promise<boolean> => {
    if (!user) return false;
    if (folders.includes(folderName)) {
        toast({ variant: "destructive", title: "Thư mục đã tồn tại" });
        return false;
    }
    try {
        await dbAddFolder(folderName, user.uid);
        setFolders(prev => [...prev, folderName].sort());
        toast({ title: "Đã thêm thư mục", description: `Thư mục "${folderName}" đã được tạo.`});
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
    setFolders(prev => prev.filter(f => f !== folderName));
    setVocabulary(prev => prev.filter(item => item.folder !== folderName));
    try {
        await dbDeleteFolder(folderName, user.uid);
        await dbDeleteVocabularyByFolder(folderName, user.uid);
         toast({
              variant: "default",
              title: "Đã xóa thư mục",
              description: `Thư mục "${folderName}" và nội dung của nó đã được xóa.`,
          });
    } catch (error) {
        console.error("Error deleting folder:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa thư mục." });
        setFolders(originalFolders);
        setVocabulary(originalVocabulary);
    }
  }, [user, toast, folders, vocabulary]);

  const updateFolder = useCallback(async (oldName: string, newName: string): Promise<boolean> => {
    if (!user) return false;
     if (folders.includes(newName)) {
        toast({ variant: "destructive", title: "Tên thư mục đã được sử dụng." });
        return false;
    }
    try {
        await dbUpdateFolder(oldName, newName, user.uid);
        await dbUpdateVocabularyFolder(oldName, newName, user.uid);
        setFolders(prev => prev.map(f => (f === oldName ? newName : f)).sort());
        setVocabulary(prev => prev.map(v => v.folder === oldName ? {...v, folder: newName} : v));
        toast({ title: "Đã cập nhật thư mục" });
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
    addManyVocabularyItems,
    removeVocabularyItem,
    updateVocabularyItem,
    isLoadingInitialData,
    addFolder,
    removeFolder,
    updateFolder
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
