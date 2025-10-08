
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpellingCorrectionRequest = z.object({
  word: z.string(),
});

const SpellingCorrectionResponse = z.object({
  suggestions: z.array(z.string()),
});

const spellingCorrectionPrompt = ai.definePrompt({
    name: 'spellingCorrectionPrompt',
    input: { schema: SpellingCorrectionRequest },
    output: { schema: SpellingCorrectionResponse },
    prompt: `Check the spelling of the English word: "{{word}}". If it is misspelled, provide a list of up to 3 likely corrections. If the word is spelled correctly, provide an empty list.`,
    config: {
        temperature: 0.1,
    }
});

const getSpellingCorrectionFlow = ai.defineFlow(
  {
    name: 'getSpellingCorrectionFlow',
    inputSchema: SpellingCorrectionRequest,
    outputSchema: SpellingCorrectionResponse,
  },
  async ({ word }) => {
    const { output } = await spellingCorrectionPrompt({ word });

    if (!output) {
        console.error('Error getting spelling correction from AI');
        return { suggestions: [] };
    }

    const filteredSuggestions = output.suggestions.filter(s => s.toLowerCase() !== word.toLowerCase());
    return { suggestions: filteredSuggestions };
  }
);

export async function getSpellingCorrection(
  input: z.infer<typeof SpellingCorrectionRequest>
): Promise<z.infer<typeof SpellingCorrectionResponse>> {
  return getSpellingCorrectionFlow(input);
}
