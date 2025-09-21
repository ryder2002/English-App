import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
  getDoc,
  Timestamp
} from "firebase/firestore";
import { addMemberToFolder } from "./folder-service";
import type { Invitation } from "@/lib/types";

const INVITATIONS_COLLECTION = "invitations";
const USERS_COLLECTION = "users"; // Assuming you have a users collection

// Not a real service, just a helper to find a user by email
export const getUserByEmail = async (email: string): Promise<{uid: string, email: string} | null> => {
    // In a real app, this would be a secure API endpoint.
    // For this prototype, we'll query Firestore directly, which is NOT secure for user data.
    // This assumes a 'users' collection exists where each document ID is the UID
    // and contains an 'email' field. This is not standard with Firebase Auth.
    // This is a major simplification for the prototype.
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const userDoc = snapshot.docs[0];
    return { uid: userDoc.id, ...userDoc.data() } as {uid: string, email: string};
}


export const sendInvitation = async (
  folderId: string,
  folderName: string,
  fromUserEmail: string,
  toUserId: string,
  toUserEmail: string,
): Promise<void> => {

  // Check if invitation already exists
    const q = query(
        collection(db, INVITATIONS_COLLECTION),
        where("folderId", "==", folderId),
        where("toUserId", "==", toUserId)
    );
    const existingInvitation = await getDocs(q);
    if (!existingInvitation.empty) {
        throw new Error("An invitation for this folder has already been sent to this user.");
    }

  const invitationData = {
    folderId,
    folderName,
    fromUserEmail,
    toUserId,
    toUserEmail,
    status: "pending",
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(db, INVITATIONS_COLLECTION), invitationData);
};

export const getInvitations = async (userId: string): Promise<Invitation[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, INVITATIONS_COLLECTION),
    where("toUserId", "==", userId),
    where("status", "==", "pending")
  );
  const querySnapshot = await getDocs(q);
  const invitations: Invitation[] = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString()
  } as Invitation));
  return invitations;
};

export const respondToInvitation = async (
  invitationId: string,
  status: "accepted" | "declined"
): Promise<void> => {
  const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
  const invitationSnap = await getDoc(invitationRef);

  if (!invitationSnap.exists()) {
    throw new Error("Invitation not found.");
  }

  await updateDoc(invitationRef, { status });

  if (status === "accepted") {
    const invitation = invitationSnap.data();
    await addMemberToFolder(invitation.folderId, invitation.toUserId);
  }
};
