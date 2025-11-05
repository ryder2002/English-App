'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { retryWithBackoff } from '@/lib/ai-retry';

const ValidateEnglishWordsInputSchema = z.object({
  words: z.array(z.string()).describe('A list of English words to validate.'),
});

const ValidateEnglishWordsOutputSchema = z.object({
  validatedWords: z.array(z.string()).describe('A list of words that are valid English words.'),
});

// Define prompt outside of flow to avoid duplicate registration warnings
const validationPrompt = ai.definePrompt({
  name: 'validateWordsPrompt',
  input: { schema: z.object({ words: z.array(z.string()) }) },
  output: { schema: ValidateEnglishWordsOutputSchema },
  prompt: `You are an English language validator. Given a list of words, identify which ones are valid English words (including common nouns, verbs, adjectives, etc.). Ignore slang, made-up words, or typos.

Input Words: {{{json words}}}

Return a JSON object containing a single key 'validatedWords' with an array of the words that are valid. If no words are valid, return an empty array.
`,
});

export const validateEnglishWordsFlow = ai.defineFlow(
  {
    name: 'validateEnglishWordsFlow',
    inputSchema: ValidateEnglishWordsInputSchema,
    outputSchema: ValidateEnglishWordsOutputSchema,
  },
  async (input) => {
    const { words } = input;

    try {
      const { output } = await retryWithBackoff(
        () => validationPrompt({ words }),
        {
          maxRetries: 3,
          initialDelayMs: 1000,
        }
      );

      if (!output) {
        throw new Error('Word validation failed: AI returned no output.');
      }

      return output;
    } catch (error: any) {
      // If retry fails, return empty array as fallback
      console.error('Word validation failed after retries:', error);
      return { validatedWords: [] };
    }
  }
);
