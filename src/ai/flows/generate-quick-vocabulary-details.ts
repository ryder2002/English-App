'use server';

/**
 * @fileOverview This file defines a Genkit flow to quickly generate essential details for a vocabulary word.
 * It focuses on speed by fetching only the primary translation and pronunciation.
 *
 * - generateQuickVocabularyDetails - A function that triggers the quick vocabulary details generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Language } from '@/lib/types';

const GenerateQuickVocabularyDetailsInputSchema = z.object({
  word: z.string().describe('The vocabulary word to generate details for.'),
  sourceLanguage: z
    .enum(['english', 'chinese'])
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
  pronunciation: z.string().optional().describe("The IPA (for English) or Pinyin (for Chinese) transcription. Omit if not applicable."),
});
type GenerateQuickVocabularyDetailsOutput = z.infer<
  typeof GenerateQuickVocabularyDetailsOutputSchema
>;

export async function generateQuickVocabularyDetails(
  input: GenerateQuickVocabularyDetailsInput
): Promise<GenerateQuickVocabularyDetailsOutput> {
  return generateQuickVocabularyDetailsFlow(input);
}

const generateQuickVocabularyDetailsPrompt = ai.definePrompt({
  name: 'generateQuickVocabularyDetailsPrompt',
  input: {schema: GenerateQuickVocabularyDetailsInputSchema},
  output: {schema: z.object({
    translation: z.string(),
    pronunciation: z.string().optional(),
  })},
  prompt: `You are a highly efficient multilingual translator. Provide only the most essential details for a given word.

Word: {{{word}}}
Source Language: {{{sourceLanguage}}}
Target Language: {{{targetLanguage}}}

Provide the following and nothing more:
1.  The single, most common translation of the word in the target language.
2.  The pronunciation (IPA for English, Pinyin for Chinese). Omit this field if the source language is Vietnamese.

Return a valid JSON object.
  `,
});

const generateQuickVocabularyDetailsFlow = ai.defineFlow(
  {
    name: 'generateQuickVocabularyDetailsFlow',
    inputSchema: GenerateQuickVocabularyDetailsInputSchema,
    outputSchema: GenerateQuickVocabularyDetailsOutputSchema,
  },
  async input => {
    // Prevent self-translation
    if (input.sourceLanguage === input.targetLanguage) {
      return {
        translation: input.word,
        pronunciation: "",
      };
    }
    
    const { output } = await generateQuickVocabularyDetailsPrompt(input);

    return {
        translation: output!.translation,
        pronunciation: output!.pronunciation,
    };
  }
);
