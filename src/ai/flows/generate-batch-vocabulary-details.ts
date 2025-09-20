'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate details for a batch of vocabulary words.
 *
 * - generateBatchVocabularyDetails - A function that triggers the batch vocabulary details generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Language, VocabularyItem } from '@/lib/types';


const GenerateBatchVocabularyDetailsInputSchema = z.object({
  words: z.array(z.string()).describe('A list of vocabulary words to generate details for.'),
  sourceLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The source language of the words.'),
  targetLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The language to translate the words into.'),
    folder: z.string().describe("The folder to add the vocabulary to.")
});
type GenerateBatchVocabularyDetailsInput = z.infer<
  typeof GenerateBatchVocabularyDetailsInputSchema
>;

const WordDetailSchema = z.object({
    word: z.string(),
    language: z.enum(['english', 'chinese', 'vietnamese']),
    vietnameseTranslation: z.string(),
    folder: z.string(),
    ipa: z.string().optional(),
    pinyin: z.string().optional(),
})

const GenerateBatchVocabularyDetailsOutputSchema = z.array(WordDetailSchema);
type GenerateBatchVocabularyDetailsOutput = z.infer<
  typeof GenerateBatchVocabularyDetailsOutputSchema
>;

export async function generateBatchVocabularyDetails(
  input: GenerateBatchVocabularyDetailsInput
): Promise<GenerateBatchVocabularyDetailsOutput> {
  return generateBatchVocabularyDetailsFlow(input);
}


const singleWordPrompt = ai.definePrompt({
    name: 'singleWordPrompt',
    input: { schema: z.object({ 
        word: z.string(),
        sourceLanguage: z.string(),
        targetLanguage: z.string(),
     }) },
    output: { schema: z.object({
        translation: z.string().describe("The translation of the word in the target language."),
        pronunciation: z.string().optional().describe("The IPA (for English) or Pinyin (for Chinese) transcription. Omit if not applicable.")
    }) },
    prompt: `You are a multilingual language expert. Provide the translation and pronunciation for a single word.

Word: {{{word}}}
Source Language: {{{sourceLanguage}}}
Target Language: {{{targetLanguage}}}

Provide the following:
1.  The translation of the word in the target language.
2.  The pronunciation (IPA for English, Pinyin for Chinese).

Return a valid JSON object.
  `,
});


const generateBatchVocabularyDetailsFlow = ai.defineFlow(
  {
    name: 'generateBatchVocabularyDetailsFlow',
    inputSchema: GenerateBatchVocabularyDetailsInputSchema,
    outputSchema: GenerateBatchVocabularyDetailsOutputSchema,
  },
  async (input) => {
    const { words, sourceLanguage, targetLanguage, folder } = input;

    // Handle self-translation case
    if (sourceLanguage === targetLanguage) {
        return words.map(word => ({
            word: word,
            language: sourceLanguage as Language,
            vietnameseTranslation: word,
            folder: folder,
        }));
    }

    const promises = words.map(async (word) => {
      try {
        const { output: details } = await singleWordPrompt({
            word,
            sourceLanguage,
            targetLanguage,
        });

        if (!details) {
            return null;
        }
        
        let vietnameseTranslation: string;
        if (targetLanguage === 'vietnamese') {
            vietnameseTranslation = details.translation;
        } else if (sourceLanguage === 'vietnamese') {
            vietnameseTranslation = word;
        } else {
            const vietnameseResult = await singleWordPrompt({ word, sourceLanguage, targetLanguage: 'vietnamese'});
            vietnameseTranslation = vietnameseResult.output?.translation || word;
        }

        return {
            word,
            language: sourceLanguage as Language,
            vietnameseTranslation: vietnameseTranslation,
            folder,
            ipa: sourceLanguage === 'english' ? details.pronunciation : undefined,
            pinyin: sourceLanguage === 'chinese' ? details.pronunciation : undefined,
        }
      } catch (error) {
        console.error(`Failed to process word: ${word}`, error);
        return null; // Return null for failed words
      }
    });

    const results = await Promise.all(promises);
    
    // Filter out any null results from failed API calls
    return results.filter((result): result is Omit<VocabularyItem, 'id' | 'createdAt' | 'audioSrc'> => result !== null);
  }
);
