
"use client";

import type { VocabularyItem } from "@/lib/types";
import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react";
import { 
    getVocabulary,
    addVocabularyItem as dbAddVocabularyItem,
    addManyVocabularyItems as dbAddManyVocabularyItems,
    updateVocabularyItem as dbUpdateVocabularyItem,
    deleteVocabularyItem as dbDeleteVocabularyItem,
    deleteVocabularyByFolder as dbDeleteVocabularyByFolder,
    updateVocabularyFolder as dbUpdateVocabularyFolder,
    clearVocabulary as dbClearVocabulary
} from "@/lib/services/vocabulary-service";
import {
    getFolders,
    addFolder as dbAddFolder,
    updateFolder as dbUpdateFolder,
    deleteFolder as dbDeleteFolder,
    clearFolders as dbClearFolders
} from "@/lib/services/folder-service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./auth-context";

interface VocabularyContextType {
  vocabulary: VocabularyItem[];
  folders: string[];
  addVocabularyItem: (item: Omit<VocabularyItem, 'id' | 'createdAt'>) => Promise<boolean>;
  addManyVocabularyItems: (items: Omit<VocabularyItem, 'id' | 'createdAt'>[], folder: string) => Promise<void>;
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
  
  const addFolder = useCallback(async (folderName: string): Promise<boolean> => {
    if (!user) return false;
    if (folders.find(f => f.toLowerCase() === folderName.toLowerCase())) {
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

        if (vocabData.length === 0 || folderData.length === 0) {
            await dbClearVocabulary(user.uid);
            await dbClearFolders(user.uid);

            const sampleFolders = ["Chủ đề chung", "Động vật", "Thức ăn"];
            for (const folder of sampleFolders) {
                await dbAddFolder(folder, user.uid);
            }
            
            const sampleWords: Omit<VocabularyItem, 'id' | 'createdAt'>[] = [
                { word: "hello", language: "english", vietnameseTranslation: "xin chào", folder: "Chủ đề chung", ipa: "/həˈloʊ/" },
                { word: "你好", language: "chinese", vietnameseTranslation: "xin chào", folder: "Chủ đề chung", pinyin: "nǐ hǎo" },
                { word: "dog", language: "english", vietnameseTranslation: "con chó", folder: "Động vật", ipa: "/dɔːɡ/" },
                { word: "猫", language: "chinese", vietnameseTranslation: "con mèo", folder: "Động vật", pinyin: "māo" },
                { word: "apple", language: "english", vietnameseTranslation: "quả táo", folder: "Thức ăn", ipa: "/ˈæp.əl/" },
            ];
            
            await dbAddManyVocabularyItems(sampleWords, user.uid);
            
            [vocabData, folderData] = await Promise.all([
                getVocabulary(user.uid),
                getFolders(user.uid),
            ]);
        }
        
        const uniqueFolders = [...new Set(folderData)];
        setFolders(uniqueFolders.sort());
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
            if (!folderAdded) {
                 toast({ variant: "destructive", title: "Lỗi tạo thư mục", description: `Không thể tạo thư mục mới "${item.folder}".` });
                 return false; 
            }
        }

        const cleanedItem = { ...item };
        if (cleanedItem.ipa === undefined) delete (cleanedItem as Partial<typeof cleanedItem>).ipa;
        if (cleanedItem.pinyin === undefined) delete (cleanedItem as Partial<typeof cleanedItem>).pinyin;

        const newItem = await dbAddVocabularyItem(cleanedItem, user.uid);
        setVocabulary((prev) => [newItem, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        return true;
    } catch (error) {
         console.error("Error adding vocabulary item:", error);
         toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm từ vựng." });
         return false;
    }
  }, [user, toast, folders, addFolder]);
  
  const addManyVocabularyItems = useCallback(async (items: Omit<VocabularyItem, 'id' | 'createdAt'>[], folder: string) => {
    if (!user) return;
    try {
        if (!folders.includes(folder)) {
            const folderAdded = await addFolder(folder);
            if (!folderAdded) {
                toast({ variant: "destructive", title: "Lỗi tạo thư mục", description: `Không thể tạo thư mục mới "${folder}".` });
                return; 
            }
        }
        
        const newItems = await dbAddManyVocabularyItems(items, user.uid);
        setVocabulary((prev) => [...newItems, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
         console.error("Error batch adding vocabulary items:", error);
         toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm từ vựng hàng loạt." });
    }
  }, [user, toast, folders, addFolder]);

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
  }, [user, toast, folders, addFolder]);

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
    if (folders.find(f => f.toLowerCase() === newName.toLowerCase() && f.toLowerCase() !== oldName.toLowerCase())) {
        toast({ variant: "destructive", title: "Tên thư mục đã được sử dụng." });
        return false;
    }
    try {
        await dbUpdateFolder(oldName, newName, user.uid);
        await dbUpdateVocabularyFolder(oldName, newName, user.uid);

        setFolders(prev => prev.map(f => (f === oldName ? newName : f)).sort());
        setVocabulary(prev => prev.map(item => item.folder === oldName ? {...item, folder: newName} : item));
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

    