'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate details for a vocabulary word,
 * including IPA, Pinyin, translation, and example sentences. It supports translation
 * between English, Chinese, and Vietnamese.
 *
 * - generateVocabularyDetails - A function that triggers the vocabulary details generation flow.
 * - GenerateVocabularyDetailsInput - The input type for the generateVocabularyDetails function.
 * - GenerateVocabularyDetailsOutput - The return type for the generateVocabularyDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVocabularyDetailsInputSchema = z.object({
  word: z.string().describe('The vocabulary word to generate details for.'),
  sourceLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The source language of the word.'),
  targetLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The language to translate the word into.'),
});
export type GenerateVocabularyDetailsInput = z.infer<
  typeof GenerateVocabularyDetailsInputSchema
>;

const GenerateVocabularyDetailsOutputSchema = z.object({
  translation: z.string().describe('The translated word.'),
  ipa: z.string().optional().describe('The IPA transcription of the word if the source or target is English.'),
  pinyin: z.string().optional().describe('The Pinyin transcription of the word if the source or target is Chinese.'),
  examples: z.array(z.object({
    source: z.string().describe('The example sentence in the source language.'),
    target: z.string().describe('The translated example sentence in the target language.')
  })).optional().describe('A list of example sentences.'),
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
  Your task is to provide details for a vocabulary word.
  Translate the word from the source language to the target language.
  - If English is the source or target, provide the IPA.
  - If Chinese is the source or target, provide the Pinyin.
  - Provide 2-3 example sentences in the source language and their translations in the target language.

  Word: {{{word}}}
  Source Language: {{{sourceLanguage}}}
  Target Language: {{{targetLanguage}}}

  Make sure to return a valid JSON object.
  `,
});

const generateVocabularyDetailsFlow = ai.defineFlow(
  {
    name: 'generateVocabularyDetailsFlow',
    inputSchema: GenerateVocabularyDetailsInputSchema,
    outputSchema: GenerateVocabularyDetailsOutputSchema,
  },
  async input => {
    // Prevent self-translation
    if (input.sourceLanguage === input.targetLanguage) {
      const examples = [{ source: "Example source.", target: "Example target." }];
      if (input.sourceLanguage === 'english') {
        return { translation: input.word, ipa: '...', examples };
      }
      if (input.sourceLanguage === 'chinese') {
        return { translation: input.word, pinyin: '...', examples };
      }
      return { translation: input.word, examples };
    }
    const {output} = await generateVocabularyDetailsPrompt(input);
    return output!;
  }
);
