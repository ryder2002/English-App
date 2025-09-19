
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
} from "firebase/firestore";

const FOLDERS_COLLECTION = "folders";

// Represents the structure of a folder document in Firestore
interface FolderDoc {
  id: string;
  name: string;
  userId: string;
}

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
    // Correctly query for a folder with the specific name and userId
    const q = query(
        collection(db, FOLDERS_COLLECTION), 
        where("name", "==", folderName), 
        where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    // Only add the folder if it does not already exist
    if (querySnapshot.empty) {
        await addDoc(collection(db, FOLDERS_COLLECTION), { name: folderName, userId });
    } else {
        // Optional: throw an error or log that it already exists, but for now, we just don't re-add it.
        console.log(`Folder "${folderName}" already exists for this user.`);
    }
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
        // In a robust app, you'd use a transaction or a batched write
        // to delete the folder and its contents together.
        const batch = writeBatch(db);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
};

export const clearFolders = async (userId: string): Promise<void> => {
    if (!userId) return;
    const q = query(collection(db, FOLDERS_COLLECTION), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return;

    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}
