'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { retryWithBackoff } from '@/lib/ai-retry';

const ValidateEnglishWordsInputSchema = z.object({
  words: z
    .array(z.string())
    .describe('A list of English words or phrases (including collocations, idioms, phrasal verbs) to validate.'),
});

const ValidateEnglishWordsOutputSchema = z.object({
  validatedWords: z.array(z.string()).describe('A list of words that are valid English words.'),
});

// Define prompt outside of flow to avoid duplicate registration warnings
const validationPrompt = ai.definePrompt({
  name: 'validateWordsPrompt',
  input: { schema: z.object({ words: z.array(z.string()) }) },
  output: { schema: ValidateEnglishWordsOutputSchema },
  prompt: `You are an English language validator. Given a list of English words or phrases, identify which ones are valid natural English expressions.

Consider the following as VALID if they are commonly used in English:
- Single words (nouns, verbs, adjectives, adverbs, etc.)
- Phrasal verbs (e.g., "put on", "give up")
- Collocations and multi-word noun/verb phrases (e.g., "meet the demand", "take responsibility")
- Idioms and fixed expressions (e.g., "break the ice")

Treat obvious typos, non-English text, and made-up terms as INVALID.

Input Items: {{{json words}}}

Return a JSON object with a single key 'validatedWords' containing an array of the inputs that are valid. If none are valid, return an empty array.`,
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
