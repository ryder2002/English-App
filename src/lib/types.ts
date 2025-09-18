export type Language = "english" | "chinese";

export interface VocabularyItem {
  id: string;
  word: string;
  language: Language;
  ipa?: string;
  pinyin?: string;
  vietnameseTranslation: string;
  folder: string;
}
