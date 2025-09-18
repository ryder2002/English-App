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
    // This effect handles fetching the initial data when the user logs in,
    // and clearing data when the user logs out.
    const fetchData = async () => {
        if (!user) {
            // If there's no user, clear the state and stop loading.
            setVocabulary([]);
            setFolders([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const [vocabData, folderData] = await Promise.all([
                getVocabulary(user.uid),
                getFolders(user.uid)
            ]);
            
            setVocabulary(vocabData);
            
            if (folderData.length === 0) {
              // If the user has no folders, create a default one.
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
            // CRITICAL: Always set loading to false after fetching is complete.
            setIsLoading(false);
        }
    };
    
    fetchData();
  }, [user, toast]);
  

  const addVocabularyItem = async (item: Omit<VocabularyItem, "id" | "createdAt">) => {
    if (!user) return;
    setIsLoading(true);
    try {
        // If the folder for the new item doesn't exist, create it first.
        if (!folders.includes(item.folder)) {
            await dbAddFolder(item.folder, user.uid);
            setFolders(prev => [...prev, item.folder].sort());
        }
        const newItem = await dbAddVocabularyItem(item, user.uid);
        // Add new item to the top of the list for better UX.
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
    // Optimistically remove the item from UI, but keep it in a temp variable to add it back if the DB call fails.
    const originalVocabulary = [...vocabulary];
    setVocabulary((prev) => prev.filter((item) => item.id !== id));
    try {
        await dbDeleteVocabularyItem(id);
    } catch (error) {
        console.error("Lỗi khi xóa từ vựng:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa từ vựng." });
        setVocabulary(originalVocabulary); // Revert UI change on failure
    }
  }
  
  const updateVocabularyItem = async (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => {
    if (!user) return;
    setIsLoading(true);
    try {
        // If the item is moved to a new folder that doesn't exist, create it.
        if (updates.folder && !folders.includes(updates.folder)) {
           await dbAddFolder(updates.folder, user.uid);
           setFolders(prev => [...prev, updates.folder!].sort());
        }
        await dbUpdateVocabularyItem(id, updates);
        // Update the item in the local state.
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
        // This transaction should be atomic on the backend, but we do it in two steps on the client.
        await dbDeleteFolder(folderName, user.uid);
        await dbDeleteVocabularyByFolder(folderName, user.uid);
        
        // Update local state
        setFolders(prev => prev.filter(f => f !== folderName));
        setVocabulary(prev => prev.filter(item => item.folder !== folderName));
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
        // This also needs to be atomic, but is handled in two steps on client.
        await dbUpdateFolder(oldName, newName, user.uid);
        await dbUpdateVocabularyFolder(oldName, newName, user.uid);

        // Update local state
        setFolders(prev => prev.map(f => (f === oldName ? newName : f)).sort());
        setVocabulary(prev => prev.map(item => item.folder === oldName ? {...item, folder: newName} : item));
    } catch (error) {
        console.error("Lỗi khi cập nhật thư mục:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật thư mục." });
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
