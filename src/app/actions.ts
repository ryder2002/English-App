"use server";

import {
  generateVocabularyDetails,
  type GenerateVocabularyDetailsInput,
} from "@/ai/flows/generate-vocabulary-details";
import {
  interactWithLanguageChatbot,
  type InteractWithLanguageChatbotInput,
} from "@/ai/flows/interact-with-language-chatbot";
import type { Language, VocabularyItem } from "@/lib/types";

export async function getVocabularyDetailsAction(
  word: string,
  language: Language
): Promise<Omit<VocabularyItem, "id" | "word" | "language">> {
  const input: GenerateVocabularyDetailsInput = { word, language };
  const details = await generateVocabularyDetails(input);

  return {
    ipa: details.ipa,
    pinyin: details.pinyin,
    vietnameseTranslation: details.vietnameseTranslation,
  };
}

export async function getChatbotResponseAction(
  query: string
): Promise<string> {
  const input: InteractWithLanguageChatbotInput = { query };
  const result = await interactWithLanguageChatbot(input);
  return result.response;
}
