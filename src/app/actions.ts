"use server";

import {
  generateVocabularyDetails,
  type GenerateVocabularyDetailsInput,
  type GenerateVocabularyDetailsOutput,
} from "@/ai/flows/generate-vocabulary-details";
import {
  interactWithLanguageChatbot,
  type InteractWithLanguageChatbotInput,
} from "@/ai/flows/interact-with-language-chatbot";
import type { Language } from "@/lib/types";

export async function getVocabularyDetailsAction(
  word: string,
  language: Language
): Promise<GenerateVocabularyDetailsOutput> {
    const input: GenerateVocabularyDetailsInput = { 
        word, 
        sourceLanguage: language,
        targetLanguage: 'vietnamese',
    };
    const details = await generateVocabularyDetails(input);

    return {
        ipa: details.ipa,
        pinyin: details.pinyin,
        translation: details.translation,
        examples: details.examples,
    };
}

export async function dictionaryLookupAction(
  input: GenerateVocabularyDetailsInput
): Promise<GenerateVocabularyDetailsOutput> {
  const details = await generateVocabularyDetails(input);
  return details;
}


export async function getChatbotResponseAction(
  query: string
): Promise<string> {
  const input: InteractWithLanguageChatbotInput = { query };
  const result = await interactWithLanguageChatbot(input);
  return result.response;
}
