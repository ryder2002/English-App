'use server';
/**
 * @fileOverview An AI chatbot that answers language-related questions using Gemini.
 *
 * - interactWithLanguageChatbot - A function that handles the chatbot interaction.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InteractWithLanguageChatbotInputSchema = z.object({
  query: z.string().describe('The user query related to language learning.'),
});
type InteractWithLanguageChatbotInput = z.infer<
  typeof InteractWithLanguageChatbotInputSchema
>;

const InteractWithLanguageChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user query.'),
});
type InteractWithLanguageChatbotOutput = z.infer<
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

SPECIAL INSTRUCTION:
If the user's query asks for the pronunciation of a word (e.g., "phát âm từ 'hello' như thế nào", "how to pronounce '你好'"), you MUST wrap the word in a <speak> tag with the word and its language.
The language attribute should be one of 'english', 'chinese', or 'vietnamese'.

Examples:
- User asks for pronunciation of "hello": Your response should contain "<speak word='hello' lang='english'>hello</speak>"
- User asks for pronunciation of "你好": Your response should contain "<speak word='你好' lang='chinese'>nǐ hǎo</speak>" (The text inside the tag can be the pinyin for better display).
- User asks for pronunciation of "phở": Your response should contain "<speak word='phở' lang='vietnamese'>phở</speak>"

Use this format ONLY when pronunciation is explicitly requested. For all other queries, respond normally.

Please respond to the user's query. Use Markdown for formatting to make the response professional, readable, and well-structured.
- Use **bold** with asterisks (**) to highlight important terms or key points.
- Use bullet points with a hyphen (-). CRUCIAL: Each bullet point MUST be on a new line.
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
