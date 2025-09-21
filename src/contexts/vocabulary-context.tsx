"use client";

import type { VocabularyItem, Folder } from "@/lib/types";
import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react";
import { 
    getVocabulary,
    addVocabularyItem as dbAddVocabularyItem,
    addManyVocabularyItems as dbAddManyVocabularyItems,
    updateVocabularyItem as dbUpdateVocabularyItem,
    deleteVocabularyItem as dbDeleteVocabularyItem,
    deleteVocabularyByFolder as dbDeleteVocabularyByFolder,
} from "@/lib/services/vocabulary-service";
import {
    getFolders,
    addFolder as dbAddFolder,
    updateFolder as dbUpdateFolder,
    deleteFolder as dbDeleteFolder,
    addMemberToFolder as dbAddMemberToFolder,
} from "@/lib/services/folder-service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./auth-context";

interface VocabularyContextType {
  vocabulary: VocabularyItem[];
  folders: Folder[];
  addVocabularyItem: (item: Omit<VocabularyItem, 'id' | 'createdAt'>) => Promise<boolean>;
  addManyVocabularyItems: (items: Omit<VocabularyItem, 'id' | 'createdAt'>[]) => Promise<void>;
  removeVocabularyItem: (id: string) => Promise<void>;
  updateVocabularyItem: (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => Promise<boolean>;
  addFolder: (folderName: string) => Promise<Folder | null>;
  removeFolder: (folderId: string, folderName: string) => Promise<void>;
  updateFolder: (folderId: string, newName: string) => Promise<boolean>;
  addMemberToFolder: (folderId: string, memberId: string) => Promise<void>;
  isLoadingInitialData: boolean;
  refetchData: () => Promise<void>;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const { toast } = useToast();

  const refetchData = useCallback(async () => {
    if (!user) return;
    setIsLoadingInitialData(true);
    try {
      const folderData = await getFolders(user.uid);
      setFolders(folderData);
      const vocabData = await getVocabulary(user.uid, folderData);
      setVocabulary(vocabData);
    } catch (error) {
       console.error("Error refetching data:", error);
       toast({
           variant: "destructive",
           title: "Lỗi tải lại dữ liệu",
           description: "Không thể làm mới dữ liệu từ vựng và thư mục.",
       });
    } finally {
      setIsLoadingInitialData(false);
    }
  }, [user, toast]);
  
  const addFolder = useCallback(async (folderName: string): Promise<Folder | null> => {
    if (!user) return null;
    if (folders.find(f => f.name.toLowerCase() === folderName.toLowerCase())) {
        toast({ variant: "destructive", title: "Thư mục đã tồn tại" });
        return null;
    }
    try {
        const newFolder = await dbAddFolder(folderName, user.uid);
        setFolders(prev => [...prev, newFolder].sort((a,b) => a.name.localeCompare(b.name)));
        toast({ title: "Đã thêm thư mục", description: `Thư mục "${folderName}" đã được tạo.`});
        return newFolder;
    } catch (error) {
        console.error("Error adding folder:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm thư mục." });
        return null;
    }
  }, [user, toast, folders]);

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
        const folderData = await getFolders(user.uid);
        setFolders(folderData);
        if (folderData.length > 0) {
            const vocabData = await getVocabulary(user.uid, folderData);
            setVocabulary(vocabData);
        } else {
            setVocabulary([]);
        }

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
        const newItem = await dbAddVocabularyItem(item);
        setVocabulary((prev) => [newItem, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        return true;
    } catch (error) {
         console.error("Error adding vocabulary item:", error);
         toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm từ vựng." });
         return false;
    }
  }, [user, toast]);
  
  const addManyVocabularyItems = useCallback(async (items: Omit<VocabularyItem, 'id' | 'createdAt'>[]) => {
    if (!user) return;
    try {
        const newItems = await dbAddManyVocabularyItems(items);
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

  const removeFolder = useCallback(async (folderId: string, folderName: string) => {
    if (!user) return;
    const originalFolders = folders;
    const originalVocabulary = vocabulary;
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setVocabulary(prev => prev.filter(item => item.folderId !== folderId));
    try {
        await dbDeleteFolder(folderId);
        await dbDeleteVocabularyByFolder(folderId);
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

  const updateFolder = useCallback(async (folderId: string, newName: string): Promise<boolean> => {
    if (!user) return false;
    if (folders.find(f => f.name.toLowerCase() === newName.toLowerCase() && f.id !== folderId)) {
        toast({ variant: "destructive", title: "Tên thư mục đã được sử dụng." });
        return false;
    }
    try {
        await dbUpdateFolder(folderId, newName);
        setFolders(prev => prev.map(f => (f.id === folderId ? {...f, name: newName} : f)).sort((a,b) => a.name.localeCompare(b.name)));
        toast({ title: "Đã cập nhật thư mục" });
        return true;
    } catch (error) {
        console.error("Error updating folder:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật thư mục." });
        return false;
    }
  }, [user, toast, folders]);

  const addMemberToFolder = useCallback(async (folderId: string, memberId: string) => {
    if (!user) return;
    try {
      await dbAddMemberToFolder(folderId, memberId);
      setFolders(prev => prev.map(f => f.id === folderId ? {...f, members: [...f.members, memberId]} : f));
    } catch (error) {
      console.error("Error adding member to folder:", error);
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm thành viên." });
    }
  }, [user, toast]);

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
    addMemberToFolder,
    refetchData
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
