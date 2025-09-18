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
  setIsLoading: (isLoading: boolean) => void;
  isDataReady: boolean;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(
  undefined
);

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        if (!user) {
            // Clear data when user logs out
            setVocabulary([]);
            setFolders([]);
            setIsDataReady(false);
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
            // Add a default folder if none exist
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
    const newItem = await dbAddVocabularyItem(item, user.uid);
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
    if (!user) return;
    if (!folders.includes(folderName)) {
        await dbAddFolder(folderName, user.uid);
        setFolders(prev => [folderName, ...prev]);
    }
  }

  const removeFolder = async (folderName: string) => {
    if (!user) return;
    await dbDeleteFolder(folderName, user.uid);
    await dbDeleteVocabularyByFolder(folderName, user.uid);
    setFolders(prev => prev.filter(f => f !== folderName));
    setVocabulary(prev => prev.filter(item => item.folder !== folderName));
  }

  const updateFolder = async (oldName: string, newName: string) => {
    if (!user) return;
    await dbUpdateFolder(oldName, newName, user.uid);
    await dbUpdateVocabularyFolder(oldName, newName, user.uid);
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
