
import { db } from "@/lib/firebase";
import type { VocabularyItem } from "@/lib/types";
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
} from "firebase/firestore";

const VOCABULARY_COLLECTION = "vocabulary";

export const getVocabulary = async (userId: string): Promise<VocabularyItem[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, VOCABULARY_COLLECTION),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  const vocabulary: VocabularyItem[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const createdAt = (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString();
    vocabulary.push({ id: doc.id, ...data, createdAt } as VocabularyItem);
  });
  // Manual sort on the client-side
  return vocabulary.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  });
};

const cleanData = (data: { [key: string]: any }) => {
    const cleanedData = { ...data };
    Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined) {
            delete cleanedData[key];
        }
    });
    return cleanedData;
}

export const addVocabularyItem = async (
  item: Omit<VocabularyItem, "id" | "createdAt">,
  userId: string
): Promise<VocabularyItem> => {
  if (!userId) {
    throw new Error("User ID is required to add an item.");
  }
  const newDocData = cleanData({
    ...item,
    userId,
    createdAt: new Date(),
  });

  const docRef = await addDoc(collection(db, VOCABULARY_COLLECTION), newDocData);
  return { 
    id: docRef.id, 
    ...item,
    createdAt: (newDocData.createdAt as Date).toISOString()
  } as VocabularyItem;
};

export const addManyVocabularyItems = async (
  items: Omit<VocabularyItem, "id" | "createdAt">[],
  userId: string
): Promise<VocabularyItem[]> => {
  if (!userId) {
    throw new Error("User ID is required to add items.");
  }
  const batch = writeBatch(db);
  const newItems: VocabularyItem[] = [];
  const now = new Date();

  items.forEach(item => {
      const docRef = doc(collection(db, VOCABULARY_COLLECTION));
      const newDocData = cleanData({
          ...item,
          userId,
          createdAt: now,
      });
      batch.set(docRef, newDocData);
      newItems.push({ id: docRef.id, ...item, createdAt: now.toISOString() });
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

export const deleteVocabularyByFolder = async (folderName: string, userId: string): Promise<void> => {
    if (!userId) return;
    const q = query(
      collection(db, VOCABULARY_COLLECTION),
      where("folder", "==", folderName),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return;
    }

    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
}

export const updateVocabularyFolder = async (oldName: string, newName: string, userId: string): Promise<void> => {
    if (!userId) return;
    const q = query(
        collection(db, VOCABULARY_COLLECTION), 
        where("folder", "==", oldName),
        where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return;
    }

    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
        batch.update(doc.ref, { folder: newName });
    });

    await batch.commit();
}

export const clearVocabulary = async (userId: string): Promise<void> => {
    if (!userId) return;
    const q = query(collection(db, VOCABULARY_COLLECTION), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return;

    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}
