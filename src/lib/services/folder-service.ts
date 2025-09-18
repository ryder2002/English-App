
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

export const getFolders = async (): Promise<string[]> => {
  const querySnapshot = await getDocs(collection(db, FOLDERS_COLLECTION));
  const folders = querySnapshot.docs.map((doc) => doc.data().name as string);
  return folders;
};

export const addFolder = async (folderName: string): Promise<void> => {
    // Check if folder already exists
    const q = query(collection(db, FOLDERS_COLLECTION), where("name", "==", folderName));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        await addDoc(collection(db, FOLDERS_COLLECTION), { name: folderName });
    }
};

export const updateFolder = async (oldName: string, newName: string): Promise<void> => {
    // Find the folder document by oldName
    const q = query(collection(db, FOLDERS_COLLECTION), where("name", "==", oldName));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const folderDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, FOLDERS_COLLECTION, folderDoc.id), { name: newName });
    }
};

export const deleteFolder = async (folderName: string): Promise<void> => {
    const q = query(collection(db, FOLDERS_COLLECTION), where("name", "==", folderName));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const folderDoc = querySnapshot.docs[0];
        await deleteDoc(doc(db, FOLDERS_COLLECTION, folderDoc.id));
    }
};
