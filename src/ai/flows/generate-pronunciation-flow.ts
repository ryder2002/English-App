'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate pronunciation for a word.
 *
 * - generatePronunciation - A function that triggers the pronunciation generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Language } from '@/lib/types';

const GeneratePronunciationInputSchema = z.object({
  word: z.string().describe('The word to generate pronunciation for.'),
  language: z.enum(['english', 'chinese']).describe('The source language of the word.'),
});
type GeneratePronunciationInput = z.infer<typeof GeneratePronunciationInputSchema>;

const GeneratePronunciationOutputSchema = z.object({
  pronunciation: z.string().optional().describe("The IPA (for English) or Pinyin (for Chinese) transcription."),
});
type GeneratePronunciationOutput = z.infer<typeof GeneratePronunciationOutputSchema>;

export async function generatePronunciation(input: GeneratePronunciationInput): Promise<GeneratePronunciationOutput> {
  return generatePronunciationFlow(input);
}

const generatePronunciationPrompt = ai.definePrompt({
  name: 'generatePronunciationPrompt',
  input: {schema: GeneratePronunciationInputSchema},
  output: {schema: GeneratePronunciationOutputSchema},
  prompt: `You are a linguistic expert. Provide only the pronunciation for the given word.

Word: {{{word}}}
Source Language: {{{language}}}

Provide only the pronunciation:
- For English, provide the IPA transcription.
- For Chinese, provide the Pinyin transcription.

Return a valid JSON object with only the "pronunciation" field.
  `,
});

const generatePronunciationFlow = ai.defineFlow(
  {
    name: 'generatePronunciationFlow',
    inputSchema: GeneratePronunciationInputSchema,
    outputSchema: GeneratePronunciationOutputSchema,
  },
  async input => {
    const {output} = await generatePronunciationPrompt(input);
    return {
        pronunciation: output?.pronunciation,
    };
  }
);
