import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";

const FOLDERS_COLLECTION = "folders";

export const getFolders = async (userId: string): Promise<string[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, FOLDERS_COLLECTION),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  const folders: string[] = querySnapshot.docs.map((doc) => doc.data().name);
  return folders.sort();
};

export const addFolder = async (folderName: string, userId: string): Promise<void> => {
  if (!userId) {
    throw new Error("User ID is required to add a folder.");
  }
  await addDoc(collection(db, FOLDERS_COLLECTION), {
    name: folderName,
    userId,
    createdAt: serverTimestamp(),
  });
};

export const updateFolder = async (
  oldName: string,
  newName: string,
  userId: string
): Promise<void> => {
  if (!userId) return;
  const q = query(
    collection(db, FOLDERS_COLLECTION),
    where("userId", "==", userId),
    where("name", "==", oldName)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    throw new Error("Folder not found to update.");
  }
  const folderDoc = doc(db, FOLDERS_COLLECTION, querySnapshot.docs[0].id);
  await updateDoc(folderDoc, { name: newName });
};

export const deleteFolder = async (
  folderName: string,
  userId: string
): Promise<void> => {
  if (!userId) return;
  const q = query(
    collection(db, FOLDERS_COLLECTION),
    where("userId", "==", userId),
    where("name", "==", folderName)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    throw new Error("Folder not found to delete.");
  }
  await deleteDoc(doc(db, FOLDERS_COLLECTION, querySnapshot.docs[0].id));
};


export const clearFolders = async (userId: string): Promise<void> => {
  if (!userId) return;
  const q = query(
    collection(db, FOLDERS_COLLECTION),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return;

  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};
