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
  createdAt: string; // ISO 8601 date string
  audioSrc?: string; // This field is no longer populated by the server. TTS is client-side.
}
