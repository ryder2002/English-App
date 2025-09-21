'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate Pinyin for a Chinese word.
 *
 * - generatePinyin - A function that triggers the Pinyin generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GeneratePinyinInputSchema = z.object({
  word: z.string().describe('The Chinese word to generate Pinyin for.'),
});
type GeneratePinyinInput = z.infer<typeof GeneratePinyinInputSchema>;

const GeneratePinyinOutputSchema = z.object({
  pinyin: z.string().optional().describe("The Pinyin transcription for the Chinese word."),
});
type GeneratePinyinOutput = z.infer<typeof GeneratePinyinOutputSchema>;

export async function generatePinyin(input: GeneratePinyinInput): Promise<GeneratePinyinOutput> {
  return generatePinyinFlow(input);
}

const generatePinyinPrompt = ai.definePrompt({
  name: 'generatePinyinPrompt',
  input: {schema: GeneratePinyinInputSchema},
  output: {schema: GeneratePinyinOutputSchema},
  prompt: `You are a linguistic expert specializing in Chinese phonetics.
Provide ONLY the Pinyin transcription for the given Chinese word.

Word: {{{word}}}

Return a valid JSON object with only the "pinyin" field.
  `,
});

const generatePinyinFlow = ai.defineFlow(
  {
    name: 'generatePinyinFlow',
    inputSchema: GeneratePinyinInputSchema,
    outputSchema: GeneratePinyinOutputSchema,
  },
  async input => {
    const {output} = await generatePinyinPrompt(input);
    return {
        pinyin: output?.pinyin,
    };
  }
);
