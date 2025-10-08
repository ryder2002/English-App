'use server';

import {z} from 'zod';
import type { Language } from '@/lib/types';
import { generateBatchVocabularyDetails } from './generate-batch-vocabulary-details';

const GenerateQuickVocabularyDetailsInputSchema = z.object({
  word: z.string().describe('The vocabulary word to generate details for.'),
  sourceLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The source language of the word.'),
  targetLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The language to translate the word into.'),
});
type GenerateQuickVocabularyDetailsInput = z.infer<
  typeof GenerateQuickVocabularyDetailsInputSchema
>;

const GenerateQuickVocabularyDetailsOutputSchema = z.object({
  translation: z.string().describe("The most common translation of the word in the target language."),
  partOfSpeech: z.string().optional().describe("The grammatical part of speech of the word (e.g., N, V, Adj)."),
  ipa: z.string().optional().describe("The IPA transcription for an English word."),
  pinyin: z.string().optional().describe("The Pinyin transcription for a Chinese word."),
});
export type GenerateQuickVocabularyDetailsOutput = z.infer<
  typeof GenerateQuickVocabularyDetailsOutputSchema
>;

export async function generateQuickVocabularyDetails(
  input: GenerateQuickVocabularyDetailsInput
): Promise<Partial<GenerateQuickVocabularyDetailsOutput>> {
    const { word, sourceLanguage, targetLanguage } = input;
    
    const batchResult = await generateBatchVocabularyDetails({
        words: [word],
        sourceLanguage,
        targetLanguage,
        folder: "temp", // Folder is a required parameter for the batch flow
    });

    if (batchResult.invalidWords && batchResult.invalidWords.length > 0) {
        throw new Error(`The word "${word}" is invalid and no details could be fetched.`);
    }

    const details = batchResult.processedWords?.[0];

    if (!details) {
        console.warn(`Could not generate quick details for the word: ${word}.`);
        return {};
    }

    return {
        translation: details.vietnameseTranslation,
        partOfSpeech: details.partOfSpeech,
        ipa: details.ipa,
        pinyin: details.pinyin,
    };
}
