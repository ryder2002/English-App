'use server';

/**
 * @fileOverview This file defines a Genkit flow to quickly generate essential details for a vocabulary word.
 * It leverages the more comprehensive batch generation flow for a single word to ensure consistency.
 *
 * - generateQuickVocabularyDetails - A function that triggers the quick vocabulary details generation flow.
 */

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
): Promise<GenerateQuickVocabularyDetailsOutput> {
    const { word, sourceLanguage, targetLanguage } = input;
    
    // Use the batch generation flow for a single word to keep all AI logic consistent.
    const batchResult = await generateBatchVocabularyDetails({
        words: [word],
        sourceLanguage,
        targetLanguage,
        folder: "temp", // A temporary folder name is required by the batch flow but not used here.
    });

    const details = batchResult[0];

    if (!details) {
        throw new Error(`Failed to generate quick details for the word: ${word}`);
    }

    return {
        translation: details.vietnameseTranslation,
        partOfSpeech: details.partOfSpeech,
        ipa: details.ipa,
        pinyin: details.pinyin,
    };
}
