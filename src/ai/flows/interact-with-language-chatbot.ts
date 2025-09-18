'use server';
/**
 * @fileOverview An AI chatbot that answers language-related questions using Gemini.
 *
 * - interactWithLanguageChatbot - A function that handles the chatbot interaction.
 * - InteractWithLanguageChatbotInput - The input type for the interactWithLanguageChatbot function.
 * - InteractWithLanguageChatbotOutput - The return type for the interactWithLanguageChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InteractWithLanguageChatbotInputSchema = z.object({
  query: z.string().describe('The user query related to language learning.'),
});
export type InteractWithLanguageChatbotInput = z.infer<
  typeof InteractWithLanguageChatbotInputSchema
>;

const InteractWithLanguageChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user query.'),
});
export type InteractWithLanguageChatbotOutput = z.infer<
  typeof InteractWithLanguageChatbotOutputSchema
>;

export async function interactWithLanguageChatbot(
  input: InteractWithLanguageChatbotInput
): Promise<InteractWithLanguageChatbotOutput> {
  return interactWithLanguageChatbotFlow(input);
}

const interactWithLanguageChatbotPrompt = ai.definePrompt({
  name: 'interactWithLanguageChatbotPrompt',
  input: {schema: InteractWithLanguageChatbotInputSchema},
  output: {schema: InteractWithLanguageChatbotOutputSchema},
  prompt: `You are a helpful and friendly AI language learning assistant. Your goal is to provide clear, concise, and easy-to-understand explanations.

IMPORTANT: Always respond in the same language as the user's query. If the user asks in Vietnamese, you MUST respond in Vietnamese.

Please respond to the user's query. Use Markdown for formatting to make the response professional, readable, and well-structured.
- Use **Bold** for emphasis.
- Use bullet points with a hyphen (-) for lists. DO NOT use asterisks (*).
- Use newlines for paragraph breaks.

User Query: {{{query}}}`,
});

const interactWithLanguageChatbotFlow = ai.defineFlow(
  {
    name: 'interactWithLanguageChatbotFlow',
    inputSchema: InteractWithLanguageChatbotInputSchema,
    outputSchema: InteractWithLanguageChatbotOutputSchema,
  },
  async input => {
    const {output} = await interactWithLanguageChatbotPrompt(input);
    return output!;
  }
);
