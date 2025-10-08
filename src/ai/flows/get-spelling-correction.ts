
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpellingCorrectionRequest = z.object({
  word: z.string(),
});

const SpellingCorrectionResponse = z.object({
  suggestions: z.array(z.string()),
});

// This is the actual Genkit flow, but it's not exported directly.
const getSpellingCorrectionFlow = ai.defineFlow(
  {
    name: 'getSpellingCorrectionFlow',
    inputSchema: SpellingCorrectionRequest,
    outputSchema: SpellingCorrectionResponse,
  },
  async ({ word }) => {
    const prompt = `Check the spelling of the English word: "${word}". If it is misspelled, provide a list of up to 3 likely corrections. If the word is spelled correctly, provide an empty list. Respond ONLY with a valid JSON object with a key named 'suggestions'. For example: {"suggestions":["suggestion1", "suggestion2"]}.`;

    const llmResponse = await ai.getGenerator('gemini-pro')!.generate({ 
        prompt: prompt,
        config: {
            temperature: 0.1,
        }
    });

    try {
      const jsonString = llmResponse.text();
      const cleanedJsonString = jsonString.replace(/```json\n|\n```/g, '').trim();
      const parsedResponse = JSON.parse(cleanedJsonString);
      
      const validationResult = SpellingCorrectionResponse.safeParse(parsedResponse);

      if (validationResult.success) {
          const filteredSuggestions = validationResult.data.suggestions.filter(s => s.toLowerCase() !== word.toLowerCase());
          return { suggestions: filteredSuggestions };
      } else {
          console.error('LLM output did not match schema:', validationResult.error);
          return { suggestions: [] };
      }

    } catch (e) {
      console.error('Error parsing LLM response for spelling correction:', e, 'Raw response:', llmResponse.text());
      return { suggestions: [] };
    }
  }
);

// This is the exported wrapper function that the rest of the app will call.
export async function getSpellingCorrection(
  input: z.infer<typeof SpellingCorrectionRequest>
): Promise<z.infer<typeof SpellingCorrectionResponse>> {
  return getSpellingCorrectionFlow(input);
}
