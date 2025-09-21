'use server';

/**
 * @fileOverview This file defines a Genkit flow to quickly generate essential details for a vocabulary word.
 * It focuses on speed by fetching only the primary translation and pronunciation.
 *
 * - generateQuickVocabularyDetails - A function that triggers the quick vocabulary details generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Language } from '@/lib/types';
import { generateIpa } from './generate-ipa-flow';
import { generatePinyin } from './generate-pinyin-flow';

const GenerateQuickVocabularyDetailsInputSchema = z.object({
  word: z.string().describe('The vocabulary word to generate details for.'),
  sourceLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The source language of the word.'),
  targetLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The language to translate the word into.'),
});
type GenerateQuickVocabularyDetailsInput = z.infer<
  typeof GenerateQuickVocabularyDetailsInputSchema
>;

const GenerateQuickVocabularyDetailsOutputSchema = z.object({
  translation: z.string().describe("The most common translation of the word in the target language."),
  ipa: z.string().optional().describe("The IPA transcription for an English word."),
  pinyin: z.string().optional().describe("The Pinyin transcription for a Chinese word."),
});
type GenerateQuickVocabularyDetailsOutput = z.infer<
  typeof GenerateQuickVocabularyDetailsOutputSchema
>;

export async function generateQuickVocabularyDetails(
  input: GenerateQuickVocabularyDetailsInput
): Promise<GenerateQuickVocabularyDetailsOutput> {
  return generateQuickVocabularyDetailsFlow(input);
}

const generateQuickTranslationPrompt = ai.definePrompt({
  name: 'generateQuickTranslationPrompt',
  input: {schema: z.object({
      word: z.string(),
      sourceLanguage: z.string(),
      targetLanguage: z.string(),
  })},
  output: {schema: z.object({
    translation: z.string(),
  })},
  prompt: `You are a highly efficient multilingual translator. Provide only the single, most common translation for a given word.

Word: {{{word}}}
Source Language: {{{sourceLanguage}}}
Target Language: {{{targetLanguage}}}

Return a valid JSON object with only the "translation" field.
  `,
});

const generateQuickVocabularyDetailsFlow = ai.defineFlow(
  {
    name: 'generateQuickVocabularyDetailsFlow',
    inputSchema: GenerateQuickVocabularyDetailsInputSchema,
    outputSchema: GenerateQuickVocabularyDetailsOutputSchema,
  },
  async input => {
    // Prevent self-translation for non-Vietnamese
    if (input.sourceLanguage === input.targetLanguage && input.sourceLanguage !== 'vietnamese') {
      return {
        translation: input.word,
      };
    }
    
    // When source is Vietnamese, we translate to English by default to get IPA
    const translationTarget = input.sourceLanguage === 'vietnamese' ? 'english' : input.targetLanguage;

    const { output: translationOutput } = await generateQuickTranslationPrompt({
        word: input.word,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: translationTarget,
    });
    
    if (!translationOutput) {
        throw new Error("Failed to get translation from AI.");
    }
    
    let ipa: string | undefined = undefined;
    let pinyin: string | undefined = undefined;

    if (input.sourceLanguage === 'english') {
      const ipaResult = await generateIpa({ word: input.word });
      ipa = ipaResult.ipa;
    } else if (input.sourceLanguage === 'chinese') {
      const pinyinResult = await generatePinyin({ word: input.word });
      pinyin = pinyinResult.pinyin;
    } else if (input.sourceLanguage === 'vietnamese') {
      // If the original word is Vietnamese, we get the IPA of its English translation
      const ipaResult = await generateIpa({ word: translationOutput.translation });
      ipa = ipaResult.ipa;
    }

    return {
        translation: translationOutput.translation,
        ipa: ipa,
        pinyin: pinyin,
    };
  }
);
