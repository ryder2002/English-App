export type Language = "english" | "chinese" | "vietnamese";

export interface VocabularyItem {
  id: string;
  word: string;
  language: Language;
  vietnameseTranslation: string;
  folderId: string; // Changed from folder
  ipa?: string;
  pinyin?: string;
  createdAt: string; // ISO 8601 date string
  audioSrc?: string; // This field is no longer populated by the server. TTS is client-side.
}

export interface Folder {
  id: string;
  name: string;
  ownerId: string;
  members: string[]; // List of user IDs
}

export interface Invitation {
    id: string;
    folderId: string;
    folderName: string;
    fromUserEmail: string;
    toUserEmail: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string;
}
