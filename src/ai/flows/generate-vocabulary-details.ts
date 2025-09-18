'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate details for a vocabulary word,
 * including multiple definitions (with parts of speech), translations, and example sentences.
 * It supports translation between English, Chinese, and Vietnamese.
 *
 * - generateVocabularyDetails - A function that triggers the vocabulary details generation flow.
 * - GenerateVocabularyDetailsInput - The input type for the generateVocabularyDetails function.
 * - GenerateVocabularyDetailsOutput - The return type for the generateVocabularyDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVocabularyDetailsInputSchema = z.object({
  word: z.string().describe('The vocabulary word to generate details for.'),
  sourceLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The source language of the word.'),
  targetLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The language to translate the word into.'),
});
export type GenerateVocabularyDetailsInput = z.infer<
  typeof GenerateVocabularyDetailsInputSchema
>;

const DefinitionSchema = z.object({
    partOfSpeech: z.string().describe("The part of speech of the word (e.g., noun, verb, adjective)."),
    meaning: z.string().describe("The definition of the word in the source language."),
    translation: z.string().describe("The translation of the meaning in the target language."),
    pronunciation: z.string().optional().describe("The IPA (for English) or Pinyin (for Chinese) transcription.")
});

const GenerateVocabularyDetailsOutputSchema = z.object({
  definitions: z.array(DefinitionSchema).describe("A list of definitions for the word, covering different parts of speech."),
  examples: z.array(z.object({
    source: z.string().describe('The example sentence in the source language.'),
    target: z.string().describe('The translated example sentence in the target language.')
  })).optional().describe('A list of example sentences.'),
});
export type GenerateVocabularyDetailsOutput = z.infer<
  typeof GenerateVocabularyDetailsOutputSchema
>;

export async function generateVocabularyDetails(
  input: GenerateVocabularyDetailsInput
): Promise<GenerateVocabularyDetailsOutput> {
  return generateVocabularyDetailsFlow(input);
}

const generateVocabularyDetailsPrompt = ai.definePrompt({
  name: 'generateVocabularyDetailsPrompt',
  input: {schema: GenerateVocabularyDetailsInputSchema},
  output: {schema: GenerateVocabularyDetailsOutputSchema},
  prompt: `You are a multilingual language expert. Your task is to provide comprehensive details for a vocabulary word.

Word: {{{word}}}
Source Language: {{{sourceLanguage}}}
Target Language: {{{targetLanguage}}}

Provide the following:
1.  A list of definitions for the word, covering all relevant parts of speech (e.g., noun, verb, adjective).
2.  For each definition:
    - The part of speech.
    - The meaning in the source language.
    - The translation of the meaning in the target language.
    - The pronunciation (IPA for English, Pinyin for Chinese). If the source language is Vietnamese, this field can be omitted.
3.  Provide 2-3 example sentences in the source language and their translations in the target language.

Make sure to return a valid JSON object.
  `,
});

const generateVocabularyDetailsFlow = ai.defineFlow(
  {
    name: 'generateVocabularyDetailsFlow',
    inputSchema: GenerateVocabularyDetailsInputSchema,
    outputSchema: GenerateVocabularyDetailsOutputSchema,
  },
  async input => {
    // Prevent self-translation
    if (input.sourceLanguage === input.targetLanguage) {
      return {
        definitions: [{
            partOfSpeech: "noun",
            meaning: "An example meaning.",
            translation: input.word,
            pronunciation: "..."
        }],
        examples: [{ source: "Example source.", target: "Example target." }]
      };
    }
    const {output} = await generateVocabularyDetailsPrompt(input);
    return output!;
  }
);
