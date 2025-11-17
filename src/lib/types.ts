export type Language = "english" | "chinese" | "vietnamese";

export interface VocabularyItem {
  id: string;
  word: string;
  language: Language;
  vietnameseTranslation: string;
  folder: string;
  partOfSpeech?: string;
  ipa?: string;
  pinyin?: string;
  example?: string;
  createdAt: string; // ISO 8601 date string
  audioSrc?: string; // This field is no longer populated by the server. TTS is client-side.
}

export interface Folder {
  id: string;
  name: string;
  userId: number;
  parentId: string | null;
  createdAt: string; // ISO 8601 date string
  children?: Folder[]; // For hierarchical display
}

export type TranslationDirection = "en-vi" | "vi-en";
export type QuizDirection = TranslationDirection | "random";
