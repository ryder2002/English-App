"use client";

import type { VocabularyItem, Folder } from "@/lib/types";
import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react";
import { 
    getVocabulary,
    addVocabularyItem as vocabServiceAdd,
    updateVocabularyItem as vocabServiceUpdate,
    deleteVocabularyItem as vocabServiceDelete,
} from "@/lib/services/vocabulary-service-client";
import {
    getFolders,
    createFolder as folderServiceCreate,
    updateFolder as folderServiceUpdate,
    deleteFolder as folderServiceDelete
} from "@/lib/services/folder-service-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./auth-context";

interface VocabularyContextType {
  vocabulary: VocabularyItem[];
  folderObjects: Folder[];
  isLoadingInitialData: boolean;
  addVocabularyItem: (item: Omit<VocabularyItem, 'id' | 'createdAt'>) => Promise<VocabularyItem | null>;
  removeVocabularyItem: (id: string) => Promise<void>;
  updateVocabularyItem: (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => Promise<void>;
  addFolder: (name: string, parentId?: string | null) => Promise<Folder | null>;
  removeFolder: (id: string) => Promise<void>;
  updateFolder: (id: string, newName: string) => Promise<void>;
  buildFolderTree: () => Folder[];
  refreshData: () => Promise<void>;
}

export const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth() ?? {}; // Use optional chaining for safety
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [folderObjects, setFolderObjects] = useState<Folder[]>([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const { toast } = useToast();

  const refreshData = useCallback(async () => {
    // Only fetch data if there is a logged-in user.
    if (!user) {
      setVocabulary([]);
      setFolderObjects([]);
      setIsLoadingInitialData(false); // Stop loading if no user
      return;
    }
    
    // CRITICAL: For admin, we should use separate admin APIs if needed
    // But for now, /api/folders and /api/vocabulary already filter by userId
    // So admin and users will get their own data based on their userId
    
    setIsLoadingInitialData(true);
    try {
      const [vocabData, folderData] = await Promise.all([
        getVocabulary(),
        getFolders(),
      ]);
      
      // CRITICAL: Double-check that data belongs to current user (safety check)
      // API already filters by userId, but we can't verify here because VocabularyItem
      // interface doesn't include userId. We trust the API filter is correct.
      // Additional safety: filter by folder ownership in components
      const userOwnedVocabulary = vocabData;
      
      const userOwnedFolders = folderData.filter(folder => {
        // Verify folder belongs to current user
        if (folder.userId !== user.id) {
          console.error(`[VocabularyContext ERROR] Folder ${folder.id} has userId ${folder.userId} but current user is ${user.id}!`);
          return false;
        }
        return true;
      });
      
      setVocabulary(userOwnedVocabulary);
      setFolderObjects(userOwnedFolders);
      
      // Debug logging
      if (user.role === 'admin') {
        console.log(`[VocabularyContext] Admin ${user.id} loaded ${userOwnedVocabulary.length} vocabulary items and ${userOwnedFolders.length} folders`);
      } else {
        console.log(`[VocabularyContext] User ${user.id} loaded ${userOwnedVocabulary.length} vocabulary items and ${userOwnedFolders.length} folders`);
      }
    } catch (error) {
      console.error("Failed to fetch vocabulary data:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu từ vựng. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingInitialData(false);
    }
  }, [user, toast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addVocabularyItem = async (item: Omit<VocabularyItem, 'id' | 'createdAt'>) => {
    const newItem = await vocabServiceAdd(item);
    if (newItem) {
      setVocabulary(prev => [...prev, newItem]);
      toast({ title: "Thành công", description: "Đã thêm từ vựng mới." });
    }
    return newItem;
  };

  const removeVocabularyItem = async (id: string) => {
    const success = await vocabServiceDelete(id);
    if (success) {
      setVocabulary(prev => prev.filter(item => item.id !== id));
      toast({ title: "Thành công", description: "Đã xóa từ vựng." });
    }
  };

  const updateVocabularyItem = async (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => {
    const success = await vocabServiceUpdate(id, updates);
    if (success) {
      await refreshData(); // Refresh to get the latest data
      toast({ title: "Thành công", description: "Đã cập nhật từ vựng." });
    }
  };

  const addFolder = async (name: string, parentId?: string | null) => {
    const newFolder = await folderServiceCreate(name, parentId);
    if (newFolder) {
      setFolderObjects(prev => [...prev, newFolder]);
    }
    return newFolder;
  };

  const removeFolder = async (id: string) => {
    const success = await folderServiceDelete(id);
    if (success) {
      // Refresh data to sync with database
      // This will remove the deleted folder and all its children (cascade delete)
      // as well as vocabulary items in those folders
      await refreshData();
      
      toast({ title: "Thành công", description: "Đã xóa thư mục." });
    } else {
      toast({
        title: "Lỗi",
        description: "Không thể xóa thư mục. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const updateFolder = async (id: string, newName: string) => {
    const success = await folderServiceUpdate(id, newName);
    if (success) {
      setFolderObjects(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
      toast({ title: "Thành công", description: "Đã đổi tên thư mục." });
    }
  };

  const buildFolderTree = useCallback(() => {
    const folderMap: Record<string, Folder> = {};
    const roots: Folder[] = [];

    folderObjects.forEach(folder => {
      folderMap[folder.id] = { ...folder, children: [] };
    });

    folderObjects.forEach(folder => {
      if (folder.parentId && folderMap[folder.parentId]) {
        folderMap[folder.parentId].children?.push(folderMap[folder.id]);
      } else {
        roots.push(folderMap[folder.id]);
      }
    });

    return roots;
  }, [folderObjects]);

  const value = {
    vocabulary,
    folderObjects,
    isLoadingInitialData,
    addVocabularyItem,
    removeVocabularyItem,
    updateVocabularyItem,
    addFolder,
    removeFolder,
    updateFolder,
    buildFolderTree,
    refreshData,
  };

  return (
    <VocabularyContext.Provider value={value}>
      {children}
    </VocabularyContext.Provider>
  );
}

export function useVocabulary() {
  const context = useContext(VocabularyContext);
  if (context === undefined) {
    throw new Error('useVocabulary must be used within a VocabularyProvider');
  }
  return context;
}
