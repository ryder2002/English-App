"use server";

import {
  generateVocabularyDetails,
  type GenerateVocabularyDetailsOutput,
} from "@/ai/flows/generate-vocabulary-details";
import {
  generateQuickVocabularyDetails,
} from "@/ai/flows/generate-quick-vocabulary-details";
import {
  generateBatchVocabularyDetails,
} from "@/ai/flows/generate-batch-vocabulary-details";
import {
  interactWithLanguageChatbot,
} from "@/ai/flows/interact-with-language-chatbot";
import { generateIpa } from "@/ai/flows/generate-ipa-flow";
import { generatePinyin } from "@/ai/flows/generate-pinyin-flow";
import type { Language } from "@/lib/types";

// NOTE: Audio generation actions have been removed.
// Text-to-Speech is now handled on the client-side using the Web Speech API.

// Define input/output types here as they are not exported from flows
type GenerateQuickVocabularyDetailsInput = {
    word: string;
    sourceLanguage: Language;
    targetLanguage: Language;
}
type GenerateQuickVocabularyDetailsOutput = {
    translation: string;
    ipa?: string;
    pinyin?: string;
}

type GenerateBatchVocabularyDetailsInput = {
    words: string[];
    sourceLanguage: Language;
    targetLanguage: Language;
    folder: string;
}
type GenerateBatchVocabularyDetailsOutput = {
    word: string;
    language: Language;
    vietnameseTranslation: string;
    folder: string;
    ipa?: string;
    pinyin?: string;
}[];

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

type InteractWithLanguageChatbotInput = {
    query: string;
    history: Message[];
};


export async function getVocabularyDetailsAction(
  word: string,
  sourceLanguage: Language,
  targetLanguage: Language,
): Promise<GenerateQuickVocabularyDetailsOutput> {
    const input: GenerateQuickVocabularyDetailsInput = { 
        word, 
        sourceLanguage,
        targetLanguage,
    };
    const details = await generateQuickVocabularyDetails(input);

    return {
        translation: details.translation,
        ipa: details.ipa,
        pinyin: details.pinyin,
    };
}

export async function dictionaryLookupAction(
  input: { word: string; sourceLanguage: Language; targetLanguage: Language; }
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
  query: string,
  history: Message[],
): Promise<string> {
  const input: InteractWithLanguageChatbotInput = { query, history };
  const result = await interactWithLanguageChatbot(input);
  return result.response;
}

export async function getIpaAction(word: string): Promise<string | undefined> {
    try {
        const result = await generateIpa({ word });
        return result.ipa;
    } catch (e) {
        console.error("Error generating IPA in getIpaAction", e);
        return undefined;
    }
}

export async function getPinyinAction(word: string): Promise<string | undefined> {
    try {
        const result = await generatePinyin({ word });
        return result.pinyin;
    } catch (e) {
        console.error("Error generating Pinyin in getPinyinAction", e);
        return undefined;
    }
}
