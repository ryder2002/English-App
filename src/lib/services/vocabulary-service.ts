
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
} from "firebase/firestore";

const VOCABULARY_COLLECTION = "vocabulary";

export const getVocabulary = async (userId: string): Promise<VocabularyItem[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, VOCABULARY_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  const vocabulary: VocabularyItem[] = [];
  querySnapshot.forEach((doc) => {
    vocabulary.push({ id: doc.id, ...doc.data() } as VocabularyItem);
  });
  return vocabulary;
};

export const addVocabularyItem = async (
  item: Omit<VocabularyItem, "id" | "createdAt">,
  userId: string
): Promise<VocabularyItem> => {
  if (!userId) {
    throw new Error("User ID is required to add an item.");
  }
  const newDocData = {
    ...item,
    userId,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, VOCABULARY_COLLECTION), newDocData);
  return { 
    id: docRef.id, 
    ...newDocData,
  };
};

export const updateVocabularyItem = async (
  id: string,
  updates: Partial<Omit<VocabularyItem, "id">>
): Promise<void> => {
  const itemDoc = doc(db, VOCABULARY_COLLECTION, id);
  await updateDoc(itemDoc, updates);
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
