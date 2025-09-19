export type Language = "english" | "chinese" | "vietnamese";

export interface VocabularyItem {
  id: string;
  word: string;
  language: Language;
  vietnameseTranslation: string;
  folder: string;
  ipa?: string;
  pinyin?: string;
  createdAt: string; // ISO 8601 date string
  audioSrc?: string; // Base64 encoded WAV audio data URI
}
