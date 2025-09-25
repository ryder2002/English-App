'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate details for a batch of vocabulary words
 * by processing the entire list in a single, optimized AI call.
 *
 * - generateBatchVocabularyDetails - A function that triggers the batch vocabulary details generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Language } from '@/lib/types';

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
    word: z.string().describe("The original word from the input list."),
    language: z.enum(['english', 'chinese', 'vietnamese']).describe("The source language of the word."),
    partOfSpeech: z.string().optional().describe("The part of speech of the word (e.g., N, V, Adj)."),
    vietnameseTranslation: z.string().describe("The Vietnamese translation of the word."),
    folder: z.string().describe("The folder to add the vocabulary to."),
    ipa: z.string().optional().describe("The IPA transcription for the English word, enclosed in slashes."),
    pinyin: z.string().optional().describe("The Pinyin transcription for the Chinese word."),
});

const GenerateBatchVocabularyDetailsOutputSchema = z.array(WordDetailSchema);
type GenerateBatchVocabularyDetailsOutput = z.infer<
  typeof GenerateBatchVocabularyDetailsOutputSchema
>;

export async function generateBatchVocabularyDetails(
  input: GenerateBatchVocabularyDetailsInput
): Promise<GenerateBatchVocabularyDetailsOutput> {
  return generateBatchVocabularyDetailsFlow(input);
}


const generateBatchDetailsPrompt = ai.definePrompt({
    name: 'generateBatchDetailsPrompt',
    input: { schema: z.object({ 
        words: z.array(z.string()),
        sourceLanguage: z.string(),
        targetLanguage: z.string(),
        folder: z.string(),
     }) },
    output: { schema: GenerateBatchVocabularyDetailsOutputSchema },
    prompt: `You are a highly efficient multilingual expert. Your task is to process a batch of vocabulary words and return a structured JSON array.

For each word in the input list, provide the following details:
1. 'word': The original word.
2. 'language': The source language provided ({{{sourceLanguage}}}).
3. 'partOfSpeech': The grammatical part of speech. Use abbreviations (e.g., N, V, Adj, Adv, Prep). If it's a phrase, determine the core part of speech. For Vietnamese words, this can be omitted.
4. 'vietnameseTranslation': The translation of the word into Vietnamese.
    - If the source language is Vietnamese, this field should be the same as the original word.
    - If the target language is Vietnamese, this is the direct translation.
    - If translating between English and Chinese, you MUST still provide a Vietnamese translation for the source word.
5. 'folder': The folder name provided ({{{folder}}}).
6. 'ipa': The International Phonetic Alphabet (IPA) transcription, enclosed in slashes (e.g., /həˈloʊ/). Provide this ONLY if the source language is 'english'. Otherwise, omit this field.
7. 'pinyin': The Pinyin transcription. Provide this ONLY if the source language is 'chinese'. Otherwise, omit this field.

Input Words: {{{json words}}}
Source Language: {{{sourceLanguage}}}
Target Language: {{{targetLanguage}}}

Process all words and return a single, valid JSON array of objects, with each object conforming to the schema. Do not skip any words.
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

    // Handle self-translation case directly to avoid unnecessary AI calls
    if (sourceLanguage === 'vietnamese' && targetLanguage === 'vietnamese') {
        return words.map(word => ({
            word: word,
            language: 'vietnamese',
            vietnameseTranslation: word,
            partOfSpeech: 'từ',
            folder: folder,
        }));
    }
    
    const { output } = await generateBatchDetailsPrompt(input);

    if (!output) {
      console.error('Batch generation failed: AI returned no output.');
      throw new Error('Failed to generate vocabulary details for the batch.');
    }
    
    // Ensure all words from input are present in the output, to prevent silent failures
    const outputWords = new Set(output.map(item => item.word.toLowerCase()));
    const missingWords = words.filter(inputWord => !outputWords.has(inputWord.toLowerCase()));

    if (missingWords.length > 0) {
        console.warn(`AI did not return details for some words: ${missingWords.join(', ')}`);
    }

    return output;
  }
);
