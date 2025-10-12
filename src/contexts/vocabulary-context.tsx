
"use client";

import type { VocabularyItem, Folder } from "@/lib/types";
import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react";
import { 
    getVocabulary,
    addVocabularyItem as dbAddVocabularyItem,
    addManyVocabularyItems as dbAddManyVocabularyItems,
    updateVocabularyItem as dbUpdateVocabularyItem,
    deleteVocabularyItem as dbDeleteVocabularyItem,
} from "@/lib/services/vocabulary-service-client";
import {
    getFolders,
    createFolder as dbAddFolder,
    updateFolder as dbUpdateFolder,
    deleteFolder as dbDeleteFolder
} from "@/lib/services/folder-service-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./auth-context";

interface VocabularyContextType {
  vocabulary: VocabularyItem[];
  folders: string[];
  folderObjects: Folder[];
  addVocabularyItem: (item: Omit<VocabularyItem, 'id' | 'createdAt' | 'userId'>) => Promise<boolean>;
  addManyVocabularyItems: (items: Omit<VocabularyItem, 'id' | 'createdAt' | 'userId'>[]) => Promise<void>;
  removeVocabularyItem: (id: string) => Promise<void>;
  updateVocabularyItem: (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>) => Promise<boolean>;
  addFolder: (folderName: string, parentId?: string | null) => Promise<boolean>;
  removeFolder: (folderId: string) => Promise<void>;
  updateFolder: (folderId: string, newName: string) => Promise<boolean>;
  isLoadingInitialData: boolean;
  buildFolderTree: () => Folder[];
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

export function VocabularyProvider({ children }: { children: ReactNode }) {
  const authContext = useAuth();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [folderObjects, setFolderObjects] = useState<Folder[]>([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const { toast } = useToast();

  // Early return if auth context is not available
  if (!authContext) {
    return <div>Loading auth...</div>;
  }

  const auth = authContext;

  const { user } = auth;

  useEffect(() => {
    const fetchData = async () => {
      if (!auth || !user) {
        setVocabulary([]);
        setFolders([]);
        setFolderObjects([]);
        setIsLoadingInitialData(false);
        return;
      }
      setIsLoadingInitialData(true);
      try {
        const [vocabData, folderData] = await Promise.all([
          getVocabulary(),
          getFolders(),
        ]);
        setVocabulary(vocabData);
        setFolderObjects(folderData);
        setFolders(folderData.map(f => f.name)); // Convert to string array for backward compatibility
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
  }, [auth, user, toast]);

  const addVocabularyItem = useCallback(async (item: Omit<VocabularyItem, "id" | "createdAt" | "userId">): Promise<boolean> => {
    if (!auth || !user) return false;
    try {
        const newItem = await dbAddVocabularyItem(item);
        if (newItem) {
          setVocabulary((prev) => [newItem, ...prev]);
          return true;
        }
        return false;
    } catch (error) {
         console.error("Error adding vocabulary item:", error);
         toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm từ vựng." });
         return false;
    }
  }, [auth, user, toast]);
  
  const addManyVocabularyItems = useCallback(async (items: Omit<VocabularyItem, 'id' | 'createdAt' | 'userId'>[]) => {
    if (!auth || !user) return;
    try {
        const newItems = await dbAddManyVocabularyItems(items);
        setVocabulary((prev) => [...newItems, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
         console.error("Error batch adding vocabulary items:", error);
         toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm từ vựng hàng loạt." });
    }
  }, [auth, user, toast]);

  const removeVocabularyItem = useCallback(async (id: string) => {
    if (!auth || !user) return;
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
  }, [auth, user, toast, vocabulary]);
  
  const updateVocabularyItem = useCallback(async (id: string, updates: Partial<Omit<VocabularyItem, 'id'>>): Promise<boolean> => {
    if (!auth || !user) return false;
    
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
  }, [auth, user, toast, vocabulary]);

  const addFolder = useCallback(async (folderName: string, parentId?: string | null): Promise<boolean> => {
    if (!auth || !user) return false;
    
    // Check if folder with same name exists under same parent
    const duplicateExists = folderObjects.some(
      f => f.name === folderName && f.parentId === (parentId || null)
    );
    
    if (duplicateExists) {
        toast({ variant: "destructive", title: "Thư mục đã tồn tại trong thư mục cha này" });
        return false;
    }
    
    try {
        const newFolder = await dbAddFolder(folderName, parentId);
        if (newFolder) {
          setFolderObjects(prev => [...prev, newFolder]);
          setFolders(prev => [...prev, folderName].sort());
          toast({ title: "Đã thêm thư mục", description: `Thư mục "${folderName}" đã được tạo.`});
          return true;
        }
        return false;
    } catch (error) {
        console.error("Error adding folder:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm thư mục." });
        return false;
    }
  }, [auth, user, toast, folderObjects, dbAddFolder]);
  
  const removeFolder = useCallback(async (folderId: string) => {
    if (!auth || !user) return;
    
    const folderToDelete = folderObjects.find(f => f.id === folderId);
    if (!folderToDelete) return;
    
    const originalFolderObjects = folderObjects;
    const originalFolders = folders;
    const originalVocabulary = vocabulary;
    
    // Collect all folders to be deleted (including subfolders)
    const collectFolderIds = (parentId: string): string[] => {
      const children = folderObjects.filter(f => f.parentId === parentId);
      let ids = [parentId];
      children.forEach(child => {
        ids = ids.concat(collectFolderIds(child.id));
      });
      return ids;
    };
    
    const folderIdsToDelete = collectFolderIds(folderId);
    const folderNamesToDelete = folderObjects
      .filter(f => folderIdsToDelete.includes(f.id))
      .map(f => f.name);
    
    setFolderObjects(prev => prev.filter(f => !folderIdsToDelete.includes(f.id)));
    setFolders(prev => prev.filter(f => !folderNamesToDelete.includes(f)));
    setVocabulary(prev => prev.filter(item => !folderNamesToDelete.includes(item.folder)));
    
    try {
        await dbDeleteFolder(folderId);
        toast({
          variant: "default",
          title: "Đã xóa thư mục",
          description: `Thư mục "${folderToDelete.name}" và các thư mục con đã được xóa.`,
        });
    } catch (error) {
        console.error("Error deleting folder:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa thư mục." });
        setFolderObjects(originalFolderObjects);
        setFolders(originalFolders);
        setVocabulary(originalVocabulary);
    }
  }, [auth, user, toast, folderObjects, folders, vocabulary, dbDeleteFolder]);

  const updateFolder = useCallback(async (folderId: string, newName: string): Promise<boolean> => {
    if (!auth || !user) return false;
    
    const folderToUpdate = folderObjects.find(f => f.id === folderId);
    if (!folderToUpdate) return false;
    
    const oldName = folderToUpdate.name;
    
    // Check if new name already exists under same parent
    const duplicateExists = folderObjects.some(
      f => f.name === newName && f.parentId === folderToUpdate.parentId && f.id !== folderId
    );
    
    if (duplicateExists) {
      toast({ variant: "destructive", title: "Tên thư mục đã được sử dụng trong thư mục cha này." });
      return false;
    }
    
    try {
        await dbUpdateFolder(folderId, newName);
        setFolderObjects(prev => prev.map(f => f.id === folderId ? {...f, name: newName} : f));
        setFolders(prev => prev.map(f => (f === oldName ? newName : f)).sort());
        setVocabulary(prev => prev.map(v => v.folder === oldName ? {...v, folder: newName} : v));
        toast({ title: "Đã cập nhật thư mục" });
        return true;
    } catch (error) {
        console.error("Error updating folder:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật thư mục." });
        return false;
    }
  }, [auth, user, toast, folderObjects, dbUpdateFolder]);

  const buildFolderTree = useCallback((): Folder[] => {
    const folderMap = new Map<string, Folder>();
    const rootFolders: Folder[] = [];
    
    // Create a map of all folders with children arrays
    folderObjects.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });
    
    // Build the tree structure
    folderObjects.forEach(folder => {
      const folderNode = folderMap.get(folder.id)!;
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children!.push(folderNode);
        }
      } else {
        rootFolders.push(folderNode);
      }
    });
    
    return rootFolders;
  }, [folderObjects]);

  const contextValue = {
    vocabulary,
    folders,
    folderObjects,
    addVocabularyItem,
    addManyVocabularyItems,
    removeVocabularyItem,
    updateVocabularyItem,
    isLoadingInitialData,
    addFolder,
    removeFolder,
    updateFolder,
    buildFolderTree
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
