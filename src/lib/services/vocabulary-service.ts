
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
} from "firebase/firestore";

const VOCABULARY_COLLECTION = "vocabulary";

export const getVocabulary = async (): Promise<VocabularyItem[]> => {
  const querySnapshot = await getDocs(collection(db, VOCABULARY_COLLECTION));
  const vocabulary: VocabularyItem[] = [];
  querySnapshot.forEach((doc) => {
    vocabulary.push({ id: doc.id, ...doc.data() } as VocabularyItem);
  });
  return vocabulary.sort((a, b) => b.id.localeCompare(a.id)); // Sort by creation time desc
};

export const addVocabularyItem = async (
  item: Omit<VocabularyItem, "id">
): Promise<VocabularyItem> => {
  const docRef = await addDoc(collection(db, VOCABULARY_COLLECTION), item);
  return { id: docRef.id, ...item };
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

export const deleteVocabularyByFolder = async (folderName: string): Promise<void> => {
    const q = query(collection(db, VOCABULARY_COLLECTION), where("folder", "==", folderName));
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

export const updateVocabularyFolder = async (oldName: string, newName: string): Promise<void> => {
    const q = query(collection(db, VOCABULARY_COLLECTION), where("folder", "==", oldName));
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
