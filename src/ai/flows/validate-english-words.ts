'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ValidateEnglishWordsInputSchema = z.object({
  words: z.array(z.string()).describe('A list of English words to validate.'),
});

const ValidateEnglishWordsOutputSchema = z.object({
  validatedWords: z.array(z.string()).describe('A list of words that are valid English words.'),
});

export const validateEnglishWordsFlow = ai.defineFlow(
  {
    name: 'validateEnglishWordsFlow',
    inputSchema: ValidateEnglishWordsInputSchema,
    outputSchema: ValidateEnglishWordsOutputSchema,
  },
  async (input) => {
    const { words } = input;

    const validationPrompt = ai.definePrompt({
      name: 'validateWordsPrompt',
      input: { schema: z.object({ words: z.array(z.string()) }) },
      output: { schema: ValidateEnglishWordsOutputSchema },
      prompt: `You are an English language validator. Given a list of words, identify which ones are valid English words (including common nouns, verbs, adjectives, etc.). Ignore slang, made-up words, or typos.

Input Words: {{{json words}}}

Return a JSON object containing a single key 'validatedWords' with an array of the words that are valid. If no words are valid, return an empty array.
`,
    });

    const { output } = await validationPrompt({ words });

    if (!output) {
      throw new Error('Word validation failed: AI returned no output.');
    }

    return output;
  }
);
