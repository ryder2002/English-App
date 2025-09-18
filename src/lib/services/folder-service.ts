
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

// NOTE: Firestore does not store empty folders. A folder is represented by the 'folder' field in vocabulary items.
// This service manages folder names by interacting with a separate 'folders' collection
// to allow for folder creation even before words are added to them.

export const getFolders = async (userId: string): Promise<string[]> => {
  if (!userId) return [];
  const q = query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const folders = querySnapshot.docs.map((doc) => doc.data().name as string);
  return folders;
};

export const addFolder = async (folderName: string, userId: string): Promise<void> => {
    if (!userId) return;
    // Check if folder already exists for this user
    const q = query(collection(db, FOLDERS_COLLECTION), where("name", "==", folderName), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        await addDoc(collection(db, FOLDERS_COLLECTION), { name: folderName, userId });
    }
};

export const updateFolder = async (oldName: string, newName: string, userId: string): Promise<void> => {
    if (!userId) return;
    // Find the folder document by oldName and userId
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
