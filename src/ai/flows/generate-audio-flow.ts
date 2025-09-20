'use server';
/**
 * @fileOverview A Genkit flow to generate audio from text using the unofficial Google Translate API.
 *
 * - generateAudio - A function that handles the text-to-speech conversion.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Language } from '@/lib/types';
import { translate } from '@vitalets/google-translate-api';
import { HttpsProxyAgent } from 'https-proxy-agent';


const GenerateAudioInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  language: z.enum(['english', 'chinese', 'vietnamese']).describe('The language of the text.'),
});
type GenerateAudioInput = z.infer<typeof GenerateAudioInputSchema>;

const GenerateAudioOutputSchema = z.object({
  audioSrc: z.string().describe('The base64 encoded audio data URI.'),
});
type GenerateAudioOutput = z.infer<typeof GenerateAudioOutputSchema>;


export async function generateAudio(input: GenerateAudioInput): Promise<GenerateAudioOutput> {
  return generateAudioFlow(input);
}


const langToISO: Record<Language, string> = {
    english: 'en',
    chinese: 'zh-CN',
    vietnamese: 'vi',
};

const generateAudioFlow = ai.defineFlow(
  {
    name: 'generateAudioFlow',
    inputSchema: GenerateAudioInputSchema,
    outputSchema: GenerateAudioOutputSchema,
  },
  async ({ text, language }) => {
    
    // This is a workaround for the Google Translate API library which may have issues in certain server environments.
    const agent = process.env.https_proxy
      ? new HttpsProxyAgent(process.env.https_proxy)
      : undefined;

    try {
      const { audio } = await translate(text, { 
        to: langToISO[language],
        fetchOptions: { agent } as any,
      });

      if (!audio) {
          throw new Error('No audio was returned from the translate API.');
      }
      
      // The audio is already base64 encoded by the library, but we need to format it as a data URI.
      return {
        audioSrc: `data:audio/mpeg;base64,${audio}`,
      };

    } catch (e: any) {
        console.error("Error generating audio with google-translate-api", e);
        // Add a more descriptive error message
        const errorMessage = e.message.includes('Too many requests')
            ? 'The translation API has received too many requests. Please wait a moment and try again.'
            : 'An unexpected error occurred while generating audio.';
        throw new Error(errorMessage);
    }
  }
);