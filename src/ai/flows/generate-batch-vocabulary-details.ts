'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Language } from '@/lib/types';
import { validateEnglishWordsFlow } from './validate-english-words';
import { parseWordsWithDefinitions, type ParsedWordDefinition } from '@/lib/parse-word-with-definition';

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
export type GenerateBatchVocabularyDetailsInput = z.infer<
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
export type GenerateBatchVocabularyDetailsOutput = z.infer<
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

IMPORTANT: Some words may include synonym information in the format "word (synonym: synonym_word)". When you see this:
- Extract the main word (before the parentheses)
- Use the synonym as additional context to provide a more accurate translation
- Return ONLY the main word in the 'word' field
- The 'vietnameseTranslation' should be the Vietnamese translation of the main word, NOT the synonym

For each word in the input list, provide the following details:
1. 'word': The original word (without any synonym notation).
2. 'language': The source language provided ({{{sourceLanguage}}}).
3. 'partOfSpeech': The grammatical part of speech. Use standard abbreviations (e.g., N, V, Adj, Adv, Prep). If the input is a phrasal verb (e.g., "put on", "give up"), use "Phrasal verb". For other phrases, determine the core part of speech. This field is optional but highly recommended. For Vietnamese words, this can be omitted if not applicable.
4. 'vietnameseTranslation': The most common translation of the word into Vietnamese.
    - If the source language is Vietnamese, this field should be the same as the original word.
    - If the target language is Vietnamese, this is the direct translation.
    - If translating between English and Chinese, you MUST still provide a Vietnamese translation for the source word.
    - If synonym context is provided, use it to give a more accurate translation.
5. 'folder': The folder name provided ({{{folder}}}).
6. 'ipa': The International Phonetic Alphabet (IPA) transcription, enclosed in slashes (e.g., /həˈloʊ/). Provide this ONLY if the source language is 'english'. Otherwise, omit this field.
7. 'pinyin': The Pinyin transcription. Provide this ONLY if the source language is 'chinese'. Otherwise, omit this field.

Input Words: {{{json words}}}
Source Language: {{{sourceLanguage}}}
Target Language: {{{targetLanguage}}}

Examples:
- Input: "hello (synonym: hi)" → Output word: "hello", vietnameseTranslation: "xin chào"
- Input: "run (synonym: jog)" → Output word: "run", vietnameseTranslation: "chạy"
- Input: "world" → Output word: "world", vietnameseTranslation: "thế giới"

Process all words and return a single, valid JSON array of objects, with each object conforming to the schema. Do not skip any words.
  `,
});


const generateBatchVocabularyDetailsFlow = ai.defineFlow(
  {
    name: 'generateBatchVocabularyDetailsFlow',
    inputSchema: GenerateBatchVocabularyDetailsInputSchema,
    outputSchema: GenerateBatchVocabularyDetailsOutputSchema,
  },
  async (input): Promise<GenerateBatchVocabularyDetailsOutput> => {
    const { words, sourceLanguage, targetLanguage, folder } = input;

    // Parse từng dòng, lấy word, synonym, raw
    const parsedWords: ParsedWordDefinition[] = parseWordsWithDefinitions(words.join('\n'));

    // Validate từ gốc và tất cả synonyms
    let validWords: ParsedWordDefinition[] = [];
    let invalidWords: string[] = [];
    if (sourceLanguage === 'english') {
      // Gom tất cả từ chính và synonyms để gửi sang AI validator
      const allWordsToValidate = parsedWords.flatMap(p => [p.word, ...(p.synonyms || [])]);
      const validationResult = await validateEnglishWordsFlow({ words: allWordsToValidate });
      const validWordsSet = new Set(validationResult.validatedWords.map(w => w.toLowerCase()));
      for (const item of parsedWords) {
        // Nếu bất kỳ từ nào trong [word, ...synonyms] hợp lệ thì chấp nhận cả dòng
        const candidates = [item.word, ...(item.synonyms || [])];
        if (candidates.some(w => validWordsSet.has(w.toLowerCase()))) {
          validWords.push(item);
        } else {
          invalidWords.push(item.raw);
        }
      }
    } else {
      validWords = parsedWords;
    }

    // Chuẩn bị gửi cho AI: từ gốc kèm ngữ cảnh đồng nghĩa (nhiều synonyms)
    const wordsForProcessing: string[] = [];
    validWords.forEach(p => {
      wordsForProcessing.push(p.word);
      if (p.synonyms && p.synonyms.length > 0) {
        wordsForProcessing.push(...p.synonyms);
      }
    });

    let aiGeneratedWords: any[] = [];
    if (wordsForProcessing.length > 0) {
      const { output } = await generateBatchDetailsPrompt({ ...input, words: wordsForProcessing });
      if (!output) {
        console.error('Batch generation failed: AI returned no output.');
      } else {
        // Map lại để hiển thị raw, nghĩa TV của từ gốc, IPA của cả từ gốc và tất cả synonyms
        aiGeneratedWords = validWords.map((item, idx) => {
          const main = output.find(o => o.word.toLowerCase() === item.word.toLowerCase());
          let ipa = main?.ipa || '';
          if (item.synonyms && item.synonyms.length > 0) {
            const ipaList = [ipa];
            item.synonyms.forEach(syn => {
              const synObj = output.find(o => o.word.toLowerCase() === syn.toLowerCase());
              if (synObj?.ipa) ipaList.push(synObj.ipa);
            });
            ipa = ipaList.filter(Boolean).join(', ');
          }
          return {
            ...main,
            word: item.raw,
            ipa,
          };
        });
      }
    }
    return { processedWords: aiGeneratedWords, invalidWords };
  }
);
