
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
} from "firebase/firestore";

const FOLDERS_COLLECTION = "folders";

export const getFolders = async (userId: string): Promise<string[]> => {
  if (!userId) return [];
  const q = query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const folders = querySnapshot.docs.map((doc) => doc.data().name as string);
  return folders.sort();
};

export const addFolder = async (folderName: string, userId: string): Promise<void> => {
    if (!userId) {
      throw new Error("User ID is required to add a folder.");
    }
    const q = query(collection(db, FOLDERS_COLLECTION), where("name", "==", folderName), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        // Folder already exists, no need to add.
        return;
    }
    await addDoc(collection(db, FOLDERS_COLLECTION), { name: folderName, userId });
};

export const updateFolder = async (oldName: string, newName: string, userId: string): Promise<void> => {
    if (!userId) return;
    const q = query(collection(db, FOLDERS_COLLECTION), where("name", "==", oldName), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const folderDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, FOLDERS_COLLECTION, folderDoc.id), { name: newName });
    }
};

export const deleteFolder = async (folderName: string, userId: string): Promise<void> => {
    if (!userId) return;
    const q = query(collection(db, FOLDERS_COLLECTION), where("name", "==", folderName), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const folderDoc = querySnapshot.docs[0];
        await deleteDoc(doc(db, FOLDERS_COLLECTION, folderDoc.id));
    }
};
