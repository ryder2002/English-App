'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Language } from '@/lib/types';
import { validateEnglishWordsFlow } from './validate-english-words';

const GenerateBatchVocabularyDetailsInputSchema = z.object({
  words: z.array(z.string()).describe('A list of vocabulary words to generate details for.'),
  sourceLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The source language of the words.'),
  targetLanguage: z
    .enum(['english', 'chinese', 'vietnamese'])
    .describe('The language to translate the words into.'),
    folder: z.string().describe("The folder to add the vocabulary to.")
});
type GenerateBatchVocabularyDetailsInput = z.infer<
  typeof GenerateBatchVocabularyDetailsInputSchema
>;

const WordDetailSchema = z.object({
    word: z.string().describe("The original word from the input list."),
    language: z.enum(['english', 'chinese', 'vietnamese']).describe("The source language of the word."),
    partOfSpeech: z.string().optional().describe("The part of speech of the word (e.g., N, V, Adj)."),
    vietnameseTranslation: z.string().describe("The Vietnamese translation of the word."),
    folder: z.string().describe("The folder to add the vocabulary to."),
    ipa: z.string().optional().describe("The IPA transcription for the English word, enclosed in slashes."),
    pinyin: z.string().optional().describe("The Pinyin transcription for the Chinese word."),
});

const GenerateBatchVocabularyDetailsOutputSchema = z.object({
    processedWords: z.array(WordDetailSchema),
    invalidWords: z.array(z.string()),
});
type GenerateBatchVocabularyDetailsOutput = z.infer<
  typeof GenerateBatchVocabularyDetailsOutputSchema
>;

export async function generateBatchVocabularyDetails(
  input: GenerateBatchVocabularyDetailsInput
): Promise<GenerateBatchVocabularyDetailsOutput> {
  return generateBatchVocabularyDetailsFlow(input);
}


const generateBatchDetailsPrompt = ai.definePrompt({
    name: 'generateBatchDetailsPrompt',
    input: { schema: z.object({ 
        words: z.array(z.string()),
        sourceLanguage: z.string(),
        targetLanguage: z.string(),
        folder: z.string(),
     }) },
    output: { schema: z.array(WordDetailSchema) },
    prompt: `You are a highly efficient multilingual expert. Your task is to process a batch of vocabulary words and return a structured JSON array.

For each word in the input list, provide the following details:
1. 'word': The original word.
2. 'language': The source language provided ({{{sourceLanguage}}}).
3. 'partOfSpeech': The grammatical part of speech. Use standard abbreviations (e.g., N, V, Adj, Adv, Prep). If the input is a phrasal verb (e.g., "put on", "give up"), use "Phrasal verb". For other phrases, determine the core part of speech. This field is optional but highly recommended. For Vietnamese words, this can be omitted if not applicable.
4. 'vietnameseTranslation': The most common translation of the word into Vietnamese.
    - If the source language is Vietnamese, this field should be the same as the original word.
    - If the target language is Vietnamese, this is the direct translation.
    - If translating between English and Chinese, you MUST still provide a Vietnamese translation for the source word.
5. 'folder': The folder name provided ({{{folder}}}).
6. 'ipa': The International Phonetic Alphabet (IPA) transcription, enclosed in slashes (e.g., /həˈloʊ/). Provide this ONLY if the source language is 'english'. Otherwise, omit this field.
7. 'pinyin': The Pinyin transcription. Provide this ONLY if the source language is 'chinese'. Otherwise, omit this field.

Input Words: {{{json words}}}
Source Language: {{{sourceLanguage}}}
Target Language: {{{targetLanguage}}}

Process all words and return a single, valid JSON array of objects, with each object conforming to the schema. Do not skip any words.
  `,
});


const generateBatchVocabularyDetailsFlow = ai.defineFlow(
  {
    name: 'generateBatchVocabularyDetailsFlow',
    inputSchema: GenerateBatchVocabularyDetailsInputSchema,
    outputSchema: GenerateBatchVocabularyDetailsOutputSchema,
  },
  async (input) => {
    const { words, sourceLanguage, targetLanguage, folder } = input;

    if (sourceLanguage === 'vietnamese' && targetLanguage === 'vietnamese') {
        const processed = words.map(word => ({
            word: word,
            language: 'vietnamese' as 'vietnamese',
            vietnameseTranslation: word,
            partOfSpeech: 'từ',
            folder: folder,
        }));
        return { processedWords: processed, invalidWords: [] };
    }

    let wordsToProcess: string[];
    let invalidWords: string[] = [];

    if (sourceLanguage === 'english') {
        const singleWords = words.filter(w => !w.includes(' '));
        const phrases = words.filter(w => w.includes(' '));

        if (singleWords.length > 0) {
            const validationResult = await validateEnglishWordsFlow({ words: singleWords });
            const validWordsSet = new Set(validationResult.validatedWords.map(w => w.toLowerCase()));
            const validSingleWords = singleWords.filter(w => validWordsSet.has(w.toLowerCase()));
            const invalidSingleWords = singleWords.filter(w => !validWordsSet.has(w.toLowerCase()));
            invalidWords.push(...invalidSingleWords);
            wordsToProcess = [...validSingleWords, ...phrases];
        } else {
            wordsToProcess = phrases;
        }
    } else {
        wordsToProcess = words;
    }

    if (wordsToProcess.length === 0) {
        return { processedWords: [], invalidWords };
    }
    
    const { output } = await generateBatchDetailsPrompt({ ...input, words: wordsToProcess });

    if (!output) {
      console.error('Batch generation failed: AI returned no output.');
      throw new Error('Failed to generate vocabulary details for the batch.');
    }
    
    const outputWords = new Set(output.map(item => item.word.toLowerCase()));
    const missingWords = wordsToProcess.filter(inputWord => !outputWords.has(inputWord.toLowerCase()));

    if (missingWords.length > 0) {
        console.warn(`AI did not return details for some words: ${missingWords.join(', ')}`);
    }

    // Combine initially invalid words with words the AI failed to process
    const finalInvalidWords = [...invalidWords, ...missingWords];
    
    return { processedWords: output, invalidWords: finalInvalidWords };
  }
);
