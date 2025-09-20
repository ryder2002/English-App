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
import { generateAudio } from "@/ai/flows/generate-audio-flow";
import { generatePronunciation } from "@/ai/flows/generate-pronunciation-flow";
import type { Language } from "@/lib/types";

// Define input/output types here as they are not exported from flows
type GenerateQuickVocabularyDetailsInput = {
    word: string;
    sourceLanguage: Language;
    targetLanguage: Language;
}
type GenerateQuickVocabularyDetailsOutput = {
    translation: string;
    pronunciation?: string;
    audioSrc?: string;
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
    audioSrc?: string;
}[];

type InteractWithLanguageChatbotInput = {
    query: string;
};


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
        audioSrc: details.audioSrc,
    };
}

export async function dictionaryLookupAction(
  input: { word: string; sourceLanguage: Language; targetLanguage: Language; }
): Promise<GenerateVocabularyDetailsOutput> {
  const details = await generateVocabularyDetails(input);
  return details;
}

export async function quickDictionaryLookupAction(
  input: { word: string; sourceLanguage: Language; targetLanguage: Language; }
): Promise<GenerateQuickVocabularyDetailsOutput> {
    const details = await generateQuickVocabularyDetails(input);
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

export async function getAudioAction(text: string, language: Language): Promise<string | undefined> {
    try {
        const result = await generateAudio({ text, language });
        return result.audioSrc;
    } catch(e) {
        console.error("Error generating audio in getAudioAction", e);
        return undefined;
    }
}

export async function getPronunciationAction(word: string, language: 'english' | 'chinese'): Promise<string | undefined> {
    try {
        const result = await generatePronunciation({ word, language });
        return result.pronunciation;
    } catch (e) {
        console.error("Error generating pronunciation in getPronunciationAction", e);
        return undefined;
    }
}
