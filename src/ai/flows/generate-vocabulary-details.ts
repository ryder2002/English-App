'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate details for a vocabulary word,
 * including multiple definitions (with parts of speech), translations, and example sentences.
 * It supports translation between English, Chinese, and Vietnamese.
 *
 * - generateVocabularyDetails - A function that triggers the vocabulary details generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateIpa } from './generate-ipa-flow';
import { generatePinyin } from './generate-pinyin-flow';


const GenerateVocabularyDetailsInputSchema = z.object({
  word: z.string().describe('The vocabulary word to generate details for.'),
  sourceLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The source language of the word.'),
  targetLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The language to translate the word into.'),
});
type GenerateVocabularyDetailsInput = z.infer<
  typeof GenerateVocabularyDetailsInputSchema
>;

const DefinitionSchema = z.object({
    partOfSpeech: z.string().describe("The part of speech of the word (e.g., noun, verb, adjective)."),
    meaning: z.string().describe("The definition of the word in the source language."),
    translation: z.string().describe("The translation of the meaning in the target language."),
});

const GenerateVocabularyDetailsOutputSchema = z.object({
  exists: z.boolean().describe("Whether the word exists in the source language."),
  pronunciation: z.string().optional().describe("The IPA (for English) or Pinyin (for Chinese) transcription."),
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
  output: {schema: z.object({
      exists: z.boolean(),
      definitions: z.array(z.object({
        partOfSpeech: z.string(),
        meaning: z.string(),
        translation: z.string(),
      })),
      examples: z.array(z.object({
        source: z.string(),
        target: z.string(),
      })).optional(),
  })},
  prompt: `You are a multilingual language expert and a strict validator. Your task is to provide comprehensive details for a vocabulary word, but ONLY if the word is real and valid in the source language.

Word: {{{word}}}
Source Language: {{{sourceLanguage}}}
Target Language: {{{targetLanguage}}}

CRITICAL STEP 1: VALIDATION
- First, determine if '{{{word}}}' is a real, valid word in '{{{sourceLanguage}}}'.
- If the word is NOT real (e.g., it's gibberish, a typo, or from another language), you MUST set 'exists' to 'false' and return immediately with empty 'definitions' and 'examples' arrays.

CRITICAL STEP 2: PROVIDE DETAILS (only if the word is valid)
- If 'exists' is 'true', provide the following:
  1.  A list of definitions for the word, covering all relevant parts of speech (e.g., noun, verb, adjective). For the source language 'vietnamese', provide the definition in Vietnamese.
  2.  For each definition:
      - The part of speech.
      - The meaning in the source language.
      - The translation of the meaning in the target language.
  3.  Provide 2-3 example sentences in the source language and their translations in the target language.

Do NOT include pronunciation in your response. It will be fetched separately.

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
        exists: true,
        pronunciation: "",
        definitions: [{
            partOfSpeech: "từ", 
            meaning: input.word,
            translation: input.word,
        }],
        examples: []
      };
    }
    const {output} = await generateVocabularyDetailsPrompt(input);

    if (!output) {
      throw new Error("Failed to get details from AI.");
    }
    
    if (!output.exists) {
        return {
            exists: false,
            pronunciation: '',
            definitions: [],
            examples: [],
        }
    }

    let pronunciation: string | undefined = undefined;
    if (input.sourceLanguage === 'english') {
        const ipaResult = await generateIpa({ word: input.word });
        pronunciation = ipaResult.ipa;
    } else if (input.sourceLanguage === 'chinese') {
        const pinyinResult = await generatePinyin({ word: input.word });
        pronunciation = pinyinResult.pinyin;
    }

    return {
        exists: true,
        ...output,
        pronunciation,
    };
  }
);
