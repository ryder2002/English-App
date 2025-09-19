"use server";

import {
  generateVocabularyDetails,
  type GenerateVocabularyDetailsInput,
  type GenerateVocabularyDetailsOutput,
} from "@/ai/flows/generate-vocabulary-details";
import {
  generateQuickVocabularyDetails,
  type GenerateQuickVocabularyDetailsInput,
  type GenerateQuickVocabularyDetailsOutput,
} from "@/ai/flows/generate-quick-vocabulary-details";
import {
  generateBatchVocabularyDetails,
  type GenerateBatchVocabularyDetailsInput,
  type GenerateBatchVocabularyDetailsOutput,
} from "@/ai/flows/generate-batch-vocabulary-details";
import {
  interactWithLanguageChatbot,
  type InteractWithLanguageChatbotInput,
} from "@/ai/flows/interact-with-language-chatbot";
import type { Language } from "@/lib/types";

export async function getVocabularyDetailsAction(
  word: string,
  language: Language
): Promise<GenerateQuickVocabularyDetailsOutput> {
    const input: GenerateQuickVocabularyDetailsInput = { 
        word, 
        sourceLanguage: language,
        targetLanguage: 'vietnamese',
    };
    const details = await generateQuickVocabularyDetails(input);

    return {
        translation: details.translation,
        pronunciation: details.pronunciation,
    };
}

export async function dictionaryLookupAction(
  input: GenerateVocabularyDetailsInput
): Promise<GenerateVocabularyDetailsOutput> {
  const details = await generateVocabularyDetails(input);
  return details;
}

export async function batchAddVocabularyAction(
  input: GenerateBatchVocabularyDetailsInput
): Promise<GenerateBatchVocabularyDetailsOutput> {
  const details = await generateBatchVocabularyDetails(input);
  return details;
}

export async function getChatbotResponseAction(
  query: string
): Promise<string> {
  const input: InteractWithLanguageChatbotInput = { query };
  const result = await interactWithLanguageChatbot(input);
  return result.response;
}
