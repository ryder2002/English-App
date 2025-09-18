export type Language = "english" | "chinese";

export interface VocabularyItem {
  id: string;
  word: string;
  language: Language;
  vietnameseTranslation: string;
  folder: string;
  ipa?: string;
  pinyin?: string;
}
