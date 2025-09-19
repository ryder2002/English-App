"use server";

import {
  generateVocabularyDetails,
  type GenerateVocabularyDetailsInput,
  type GenerateVocabularyDetailsOutput,
} from "@/ai/flows/generate-vocabulary-details";
import {
  generateBatchVocabularyDetails,
  type GenerateBatchVocabularyDetailsInput,
  type GenerateBatchVocabularyDetailsOutput,
} from "@/ai/flows/generate-batch-vocabulary-details";
import {
  interactWithLanguageChatbot,
  type InteractWithLanguageChatbotInput,
} from "@/ai/flows/interact-with-language-chatbot";
import { textToSpeech, type TextToSpeechInput } from "@/ai/flows/text-to-speech";
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
        definitions: details.definitions,
        examples: details.examples,
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

export async function getAudioForWordAction(text: string, language: string): Promise<string> {
    const input: TextToSpeechInput = { text, language };
    const result = await textToSpeech(input);
    return result.audioDataUri;
}
