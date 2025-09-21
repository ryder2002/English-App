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
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import type { Folder } from "@/lib/types";

const FOLDERS_COLLECTION = "folders";

// Get all folders where the user is a member (owner or shared with)
export const getFolders = async (userId: string): Promise<Folder[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, FOLDERS_COLLECTION),
    where("members", "array-contains", userId)
  );
  const querySnapshot = await getDocs(q);
  const folders: Folder[] = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Folder));
  return folders.sort((a, b) => a.name.localeCompare(b.name));
};

export const getFolderById = async (folderId: string): Promise<Folder | null> => {
    const docRef = doc(db, FOLDERS_COLLECTION, folderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Folder;
    }
    return null;
}


export const addFolder = async (folderName: string, userId: string): Promise<Folder> => {
  if (!userId) {
    throw new Error("User ID is required to add a folder.");
  }
  const newFolderData = {
    name: folderName,
    ownerId: userId,
    members: [userId], // Owner is the first member
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), newFolderData);
  return { id: docRef.id, ...newFolderData } as Folder;
};

// This function now adds a member to the folder's member list
export const addMemberToFolder = async (folderId: string, memberId: string): Promise<void> => {
    const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
    const folderSnap = await getDoc(folderRef);
    if (!folderSnap.exists()) {
        throw new Error("Folder not found.");
    }
    const folderData = folderSnap.data() as Folder;
    if (!folderData.members.includes(memberId)) {
        await updateDoc(folderRef, {
            members: [...folderData.members, memberId]
        });
    }
}

export const updateFolder = async (folderId: string, newName: string): Promise<void> => {
    const folderDoc = doc(db, FOLDERS_COLLECTION, folderId);
    await updateDoc(folderDoc, { name: newName });
};

export const deleteFolder = async (folderId: string): Promise<void> => {
    // Note: This only deletes the folder document.
    // Associated vocabulary items should be handled separately, perhaps with a batched write.
    await deleteDoc(doc(db, FOLDERS_COLLECTION, folderId));
};

export const clearFolders = async (userId: string): Promise<void> => {
  if (!userId) return;
  // This is more complex now. We should only clear folders owned by the user.
  const q = query(
    collection(db, FOLDERS_COLLECTION),
    where("ownerId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return;

  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};
