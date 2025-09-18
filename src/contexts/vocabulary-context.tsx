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
  isDataReady: boolean;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(
  undefined
);

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start as true initially
  const [isDataReady, setIsDataReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        if (!user) {
            setVocabulary([]);
            setFolders([]);
            setIsDataReady(true);
            setIsLoading(false); // Unlock loading state if no user
            return;
        };

        setIsLoading(true);
        setIsDataReady(false);
        try {
            const [vocabData, folderData] = await Promise.all([
                getVocabulary(user.uid),
                getFolders(user.uid)
            ]);
            setVocabulary(vocabData);
            
            if (folderData.length === 0) {
              const defaultFolder = "Cơ bản";
              await dbAddFolder(defaultFolder, user.uid);
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
  }, [user, toast]);
  

  const addVocabularyItem = async (item: Omit<VocabularyItem, "id" | "createdAt">) => {
    if (!user) return;
    setIsLoading(true);
    try {
        if (!folders.includes(item.folder)) {
            await dbAddFolder(item.folder, user.uid);
            setFolders(prev => [...prev, item.folder].sort());
        }
        const newItem = await dbAddVocabularyItem(item, user.uid);
        setVocabulary((prev) => [newItem, ...prev]);
    } catch (error) {
         console.error("Lỗi khi thêm từ vựng:", error);
         toast({ variant: "destructive", title: "Lỗi thêm từ vựng" });
    } finally {
        setIsLoading(false);
    }
  };

  const removeVocabularyItem = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
        await dbDeleteVocabularyItem(id);
        setVocabulary((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
        console.error("Lỗi khi xóa từ vựng:", error);
        toast({ variant: "destructive", title: "Lỗi xóa từ vựng" });
    } finally {
        setIsLoading(false);
    }
  }
  
  const updateVocabularyItem = async (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => {
    if (!user) return;
    setIsLoading(true);
    try {
        if (updates.folder && !folders.includes(updates.folder)) {
           await dbAddFolder(updates.folder, user.uid);
           setFolders(prev => [...prev, updates.folder!].sort());
        }
        await dbUpdateVocabularyItem(id, updates);
        setVocabulary(prev => prev.map(item => item.id === id ? { ...item, ...updates } as VocabularyItem : item));
    } catch (error) {
        console.error("Lỗi khi cập nhật từ vựng:", error);
        toast({ variant: "destructive", title: "Lỗi cập nhật từ vựng" });
    } finally {
        setIsLoading(false);
    }
  }
  
  const addFolder = async (folderName: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
        if (!folders.find(f => f.toLowerCase() === folderName.toLowerCase())) {
            await dbAddFolder(folderName, user.uid);
            setFolders(prev => [...prev, folderName].sort());
        } else {
            toast({ variant: "destructive", title: "Thư mục đã tồn tại" });
        }
    } catch (error) {
        console.error("Lỗi khi thêm thư mục:", error);
        toast({ variant: "destructive", title: "Lỗi thêm thư mục" });
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
    } catch (error) {
        console.error("Lỗi khi xóa thư mục:", error);
        toast({ variant: "destructive", title: "Lỗi xóa thư mục" });
    } finally {
        setIsLoading(false);
    }
  }

  const updateFolder = async (oldName: string, newName: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
        await dbUpdateFolder(oldName, newName, user.uid);
        await dbUpdateVocabularyFolder(oldName, newName, user.uid);
        setFolders(prev => prev.map(f => (f === oldName ? newName : f)).sort());
        setVocabulary(prev => prev.map(item => item.folder === oldName ? {...item, folder: newName} : item));
    } catch (error) {
        console.error("Lỗi khi cập nhật thư mục:", error);
        toast({ variant: "destructive", title: "Lỗi cập nhật thư mục" });
    } finally {
        setIsLoading(false);
    }
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
