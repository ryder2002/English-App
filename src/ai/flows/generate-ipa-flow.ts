'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate the IPA for an English word.
 *
 * - generateIpa - A function that triggers the IPA generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateIpaInputSchema = z.object({
  word: z.string().describe('The English word to generate IPA for.'),
});
type GenerateIpaInput = z.infer<typeof GenerateIpaInputSchema>;

const GenerateIpaOutputSchema = z.object({
  ipa: z.string().optional().describe("The IPA transcription for the English word, enclosed in slashes."),
});
type GenerateIpaOutput = z.infer<typeof GenerateIpaOutputSchema>;

export async function generateIpa(input: GenerateIpaInput): Promise<GenerateIpaOutput> {
  return generateIpaFlow(input);
}

const generateIpaPrompt = ai.definePrompt({
  name: 'generateIpaPrompt',
  input: {schema: GenerateIpaInputSchema},
  output: {schema: GenerateIpaOutputSchema},
  prompt: `You are a linguistic expert specializing in phonetics.
Provide ONLY the International Phonetic Alphabet (IPA) transcription for the given English word, enclosed in slashes.

Example for 'hello': /həˈloʊ/

Word: {{{word}}}

Return a valid JSON object with only the "ipa" field.
  `,
});

const generateIpaFlow = ai.defineFlow(
  {
    name: 'generateIpaFlow',
    inputSchema: GenerateIpaInputSchema,
    outputSchema: GenerateIpaOutputSchema,
  },
  async input => {
    const {output} = await generateIpaPrompt(input);
    return {
        ipa: output?.ipa,
    };
  }
);
