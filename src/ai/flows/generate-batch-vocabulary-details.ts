'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate details for a batch of vocabulary words.
 *
 * - generateBatchVocabularyDetails - A function that triggers the batch vocabulary details generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Language, VocabularyItem } from '@/lib/types';
import { generateIpa } from './generate-ipa-flow';
import { generatePinyin } from './generate-pinyin-flow';


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


const translationPrompt = ai.definePrompt({
    name: 'translationPrompt',
    input: { schema: z.object({ 
        word: z.string(),
        sourceLanguage: z.string(),
        targetLanguage: z.string(),
     }) },
    output: { schema: z.object({
        translation: z.string().describe("The translation of the word in the target language."),
    }) },
    prompt: `You are a multilingual language expert. Provide the translation for a single word.

Word: {{{word}}}
Source Language: {{{sourceLanguage}}}
Target Language: {{{targetLanguage}}}

Return a valid JSON object with only the translation.
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
        const { output: translationDetails } = await translationPrompt({
            word,
            sourceLanguage,
            targetLanguage,
        });

        if (!translationDetails) {
            return null;
        }

        let ipa: string | undefined = undefined;
        let pinyin: string | undefined = undefined;

        if (sourceLanguage === 'english') {
            const ipaResult = await generateIpa({ word });
            ipa = ipaResult.ipa;
        } else if (sourceLanguage === 'chinese') {
            const pinyinResult = await generatePinyin({ word });
            pinyin = pinyinResult.pinyin;
        }
        
        let vietnameseTranslation: string;
        if (targetLanguage === 'vietnamese') {
            vietnameseTranslation = translationDetails.translation;
        } else if (sourceLanguage === 'vietnamese') {
            vietnameseTranslation = word;
        } else {
            // This case handles EN -> CN or CN -> EN. We still need a Vietnamese translation.
            const vietnameseResult = await translationPrompt({ word, sourceLanguage, targetLanguage: 'vietnamese'});
            vietnameseTranslation = vietnameseResult.output?.translation || word;
        }

        return {
            word,
            language: sourceLanguage as Language,
            vietnameseTranslation: vietnameseTranslation,
            folder,
            ipa,
            pinyin,
        }
      } catch (error) {
        console.error(`Failed to process word: ${word}`, error);
        return null; // Return null for failed words
      }
    });

    const results = await Promise.all(promises);
    
    // Filter out any null results from failed API calls
    return results.filter((result): result is Omit<VocabularyItem, 'id' | 'createdAt' | 'audioSrc' | 'userId'> => result !== null);
  }
);
