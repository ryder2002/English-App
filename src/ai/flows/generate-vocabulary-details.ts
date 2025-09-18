'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate IPA (International Phonetic Alphabet) for English words,
 * Pinyin for Chinese words, and Vietnamese translation for vocabulary words.
 *
 * - generateVocabularyDetails - A function that triggers the vocabulary details generation flow.
 * - GenerateVocabularyDetailsInput - The input type for the generateVocabularyDetails function.
 * - GenerateVocabularyDetailsOutput - The return type for the generateVocabularyDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVocabularyDetailsInputSchema = z.object({
  word: z.string().describe('The vocabulary word to generate details for.'),
  language: z
    .enum(['english', 'chinese'])
    .describe('The language of the vocabulary word.'),
});
export type GenerateVocabularyDetailsInput = z.infer<
  typeof GenerateVocabularyDetailsInputSchema
>;

const GenerateVocabularyDetailsOutputSchema = z.object({
  ipa: z.string().optional().describe('The IPA transcription of the word.'),
  pinyin: z.string().optional().describe('The Pinyin transcription of the word.'),
  vietnameseTranslation: z
    .string()
    .describe('The Vietnamese translation of the word.'),
});
export type GenerateVocabularyDetailsOutput = z.infer<
  typeof GenerateVocabularyDetailsOutputSchema
>;

export async function generateVocabularyDetails(
  input: GenerateVocabularyDetailsInput
): Promise<GenerateVocabularyDetailsOutput> {
  return generateVocabularyDetailsFlow(input);
}

const generateVocabularyDetailsPrompt = ai.definePrompt({
  name: 'generateVocabularyDetailsPrompt',
  input: {schema: GenerateVocabularyDetailsInputSchema},
  output: {schema: GenerateVocabularyDetailsOutputSchema},
  prompt: `You are a multilingual language expert.
  Your task is to generate the IPA (International Phonetic Alphabet) for English words, Pinyin for Chinese words, and Vietnamese translation for vocabulary words.

  Word: {{{word}}}
  Language: {{{language}}}

  Output the IPA only if the language is English. Output the Pinyin only if the language is Chinese.
  Always output the Vietnamese translation.

  Make sure to return a valid JSON object. If the language is English, the JSON object should have "ipa" and "vietnameseTranslation" fields. If the language is Chinese, the JSON object should have "pinyin" and "vietnameseTranslation" fields.
  `,
});

const generateVocabularyDetailsFlow = ai.defineFlow(
  {
    name: 'generateVocabularyDetailsFlow',
    inputSchema: GenerateVocabularyDetailsInputSchema,
    outputSchema: GenerateVocabularyDetailsOutputSchema,
  },
  async input => {
    const {output} = await generateVocabularyDetailsPrompt(input);
    return output!;
  }
);
