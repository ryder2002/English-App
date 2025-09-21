import { db } from "@/lib/firebase";
import type { VocabularyItem, Folder } from "@/lib/types";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

const VOCABULARY_COLLECTION = "vocabulary";

export const getVocabulary = async (userId: string, folders: Folder[]): Promise<VocabularyItem[]> => {
  if (!userId || folders.length === 0) return [];

  const folderIds = folders.map(f => f.id);
  
  // Firestore 'in' queries are limited to 30 elements. We need to batch them.
  const vocabulary: VocabularyItem[] = [];
  const batchSize = 30;

  for (let i = 0; i < folderIds.length; i += batchSize) {
      const folderIdBatch = folderIds.slice(i, i + batchSize);
      if(folderIdBatch.length > 0) {
        const q = query(
            collection(db, VOCABULARY_COLLECTION),
            where("folderId", "in", folderIdBatch)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString();
            vocabulary.push({ id: doc.id, ...data, createdAt } as VocabularyItem);
        });
      }
  }

  return vocabulary.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const cleanData = (data: { [key: string]: any }) => {
  const cleanedData = { ...data };
  Object.keys(cleanedData).forEach((key) => {
    if (cleanedData[key] === undefined) {
      delete cleanedData[key];
    }
  });
  return cleanedData;
};

export const addVocabularyItem = async (
  item: Omit<VocabularyItem, "id" | "createdAt">,
): Promise<VocabularyItem> => {
  const now = new Date();
  const newDocData = cleanData({
    ...item,
    createdAt: serverTimestamp(),
  });

  const docRef = await addDoc(collection(db, VOCABULARY_COLLECTION), newDocData);
  return {
    id: docRef.id,
    ...item,
    createdAt: now.toISOString(),
  } as VocabularyItem;
};

export const addManyVocabularyItems = async (
  items: Omit<VocabularyItem, "id" | "createdAt">[],
): Promise<VocabularyItem[]> => {
  const batch = writeBatch(db);
  const newItems: VocabularyItem[] = [];
  const now = new Date();

  items.forEach((item) => {
    const docRef = doc(collection(db, VOCABULARY_COLLECTION));
    const newDocData = cleanData({
      ...item,
      createdAt: serverTimestamp(),
    });
    batch.set(docRef, newDocData);
    newItems.push({
      id: docRef.id,
      ...item,
      createdAt: now.toISOString(),
    } as VocabularyItem);
  });

  await batch.commit();
  return newItems;
};

export const updateVocabularyItem = async (
  id: string,
  updates: Partial<Omit<VocabularyItem, "id">>
): Promise<void> => {
  const itemDoc = doc(db, VOCABULARY_COLLECTION, id);
  const cleanUpdates = cleanData(updates);
  await updateDoc(itemDoc, cleanUpdates);
};

export const deleteVocabularyItem = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, VOCABULARY_COLLECTION, id));
};

export const deleteVocabularyByFolder = async (folderId: string): Promise<void> => {
  const q = query(
    collection(db, VOCABULARY_COLLECTION),
    where("folderId", "==", folderId)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return;
  }

  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};


export const clearVocabulary = async (userId: string): Promise<void> => {
    // This is more complex now. We need to find all folders for the user,
    // then delete all vocab in those folders. This is a heavy operation.
    // For now, this function will be disabled for safety in a shared context.
    console.warn("clearVocabulary is disabled in shared context.");
}
