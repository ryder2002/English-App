'use server';
/**
 * @fileOverview An AI chatbot that answers language-related questions using Gemini.
 *
 * - interactWithLanguageChatbot - A function that handles the chatbot interaction.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getRelevantDocs } from '@/lib/ai-rag';
import { generateVocabularyDetails } from './generate-vocabulary-details';
import { generateIpa } from './generate-ipa-flow';
import { generatePinyin } from './generate-pinyin-flow';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});
type Message = z.infer<typeof MessageSchema>;

const InteractWithLanguageChatbotInputSchema = z.object({
  query: z.string().describe('The latest user query related to language learning.'),
  history: z.array(MessageSchema).describe('The history of the conversation so far.'),
  contextDocs: z.array(z.object({ title: z.string(), path: z.string(), snippet: z.string() })).optional(),
  useRag: z.boolean().optional(),
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
  prompt: `You are a helpful and friendly AI language learning assistant specialized in English and Chinese. Your primary goal is to help users learn and practice English and Chinese languages.

IMPORTANT: Tone & Greetings:
- Adopt a warm, friendly, and patient tone. Be encouraging and polite.
- When a conversation is new or the user's message is a greeting ("hi", "hello", "xin chào"), start with a friendly greeting and ask how you can help. Example: "Chào bạn 👋! Mình là trợ lý AI, mình có thể giúp gì cho bạn hôm nay?"
- Use positive reinforcement: praise good attempts and offer next steps (e.g., "Tốt lắm! Hãy thử..."), and give simple, digestible instructions.

Pronoun policy (Vietnamese):
- When responding in Vietnamese, DO NOT use the formal pronoun "tôi" for the assistant. Instead, use the friendly first-person pronoun "tớ" (or "mình" if preferred) and address the user as "cậu" or "bạn". Prefer "cậu" for a casual tone.
- In English/Chinese responses, natural pronouns (I/you/我/你) are fine.

IMPORTANT RESTRICTIONS:
- You MUST ONLY respond to queries related to English and Chinese language learning, vocabulary, grammar, pronunciation, culture, or general language study tips.
- You MUST ONLY USE the information provided in the website documentation context below to answer the user's question. Do not invent facts or use external sources outside this website.
- If a user asks about topics unrelated to English or Chinese language learning, politely redirect them back to language learning topics.
- Always respond in the same language as the user's query. If the user asks in Vietnamese, you MUST respond in Vietnamese. If they ask in English, respond in English. If they ask in Chinese, respond in Chinese.

WEBSITE DOCUMENTATION CONTEXT (RAG):
{{#if contextDocs}}
{{#each contextDocs}}
- "{{title}}" ({{path}}):
{{{snippet}}}
{{/each}}
{{else}}
- NO CONTEXT DOCUMENTS FOUND
{{/if}}

SPECIAL CREATOR INFORMATION:
If the user asks about "Công Nhất", "nhất", "creator", "developer", "who made this", "who created this app/website", or similar questions about the creator:
- Respond that "Công Nhất" is the person who created and developed this English and Chinese learning application.
- You can say something like: "Công Nhất là người sáng tạo và phát triển ứng dụng học tiếng Anh và tiếng Trung này."

PRONUNCIATION INSTRUCTIONS:
If the user's query asks for the pronunciation of a word (e.g., "phát âm từ 'hello' như thế nào", "how to pronounce '你好'"), you MUST wrap the word in a <speak> tag with the word and its language.
The language attribute should be one of 'english', 'chinese', or 'vietnamese'.

RESPONSE FORMATTING:
Please respond to the user's query. Use Markdown for formatting to make the response professional, readable, and well-structured.
- Use **bold** with asterisks (**) to highlight important terms or key points.
- Use bullet points with a hyphen (-). CRUCIAL: Each bullet point MUST be on a new line.
- Use newlines (\n) for paragraph breaks.

Conversation History:
{{#each history}}
- **{{role}}**: {{{content}}}
{{/each}}

Latest User Query: {{{query}}}`,
});

const interactWithLanguageChatbotFlow = ai.defineFlow(
  {
    name: 'interactWithLanguageChatbotFlow',
    inputSchema: InteractWithLanguageChatbotInputSchema,
    outputSchema: InteractWithLanguageChatbotOutputSchema,
  },
  async input => {
    // Pronunciation helper functions
    const detectLanguageOfWord = (word: string) => {
      if (/[\u4e00-\u9fff]/.test(word)) return 'chinese';
      if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(word)) return 'vietnamese';
      // default to english
      return 'english';
    };

    const isPronunciationRequest = (q: string) => {
      return /phát\s*âm|cách\s*đọc|phát\s*âm\s*từ|how\s*to\s*pronounce|pronounce|pronunciation|IPA|发音|怎么读|拼音/.test(q.toLowerCase());
    };

    const extractQuotedOrLastWord = (q: string) => {
      const quoted = q.match(/["'“”`]+([^"'“”`]+)["'“”`]+/);
      if (quoted) return quoted[1].trim();
      // Try patterns like "phát âm từ X" or "phát âm X"
      const vnMatch = q.match(/phát\s*âm(?:\s*từ)?\s*([\w\u00C0-\u024F\-]+|[\u4e00-\u9fff]+)/i);
      if (vnMatch) return vnMatch[1].trim();
      const enMatch = q.match(/(?:pronounce|pronunciation|how to pronounce)\s*([\w\-']+)[\?\.]?/i);
      if (enMatch) return enMatch[1].trim();
      // Fallback: last word
      const parts = q.split(/\s+/).filter(Boolean);
      return parts.length ? parts[parts.length - 1].replace(/[?!.]$/, '') : undefined;
    };

    // If pronunciation request detected, handle here
    if (isPronunciationRequest(input.query)) {
      const word = extractQuotedOrLastWord(input.query);
      if (word) {
        try {
          const { prisma } = await import('@/lib/prisma').then(m => ({ prisma: m.prisma }));
          const found = await prisma.vocabulary.findFirst({ where: { OR: [{ word: { equals: word, mode: 'insensitive' } }, { vietnameseTranslation: { contains: word, mode: 'insensitive' } }, { ipa: { contains: word, mode: 'insensitive' } }] }, take: 1 });

          let language = found?.language as string | undefined;
          if (!language) language = detectLanguageOfWord(word);

          let speakTag = '';
          let ipaText = '';
          let pinyinText = '';

          if (language === 'chinese') {
            if (found?.pinyin) pinyinText = found.pinyin;
            else {
              try {
                const pinyinRes = await generatePinyin({ word });
                pinyinText = pinyinRes.pinyin || '';
              } catch (e) {
                console.warn('Failed to generate pinyin for', word, e);
              }
            }
            speakTag = `<speak word='${found?.word ?? word}' lang='chinese'>${pinyinText || found?.word || word}</speak>`;
          } else if (language === 'english') {
            if (found?.ipa) ipaText = found.ipa;
            else {
              try {
                const ipaRes = await generateIpa({ word });
                ipaText = ipaRes.ipa || '';
              } catch (e) {
                console.warn('Failed to generate IPA for', word, e);
              }
            }
            speakTag = `<speak word='${found?.word ?? word}' lang='english'>${found?.word ?? word}</speak>`;
          } else {
            // vietnamese or other
            // fallback to client TTS for vietnamese -- use the word itself
            speakTag = `<speak word='${found?.word ?? word}' lang='vietnamese'>${found?.word ?? word}</speak>`;
          }

          const resultLines = [] as string[];
          resultLines.push(speakTag);
          if (ipaText) resultLines.push(`**IPA**: ${ipaText}`);
          if (pinyinText) resultLines.push(`**Pinyin**: ${pinyinText}`);

          // Also include a friendly instruction/note
          resultLines.push('\nBạn có muốn nghe phát âm chậm hơn hoặc ví dụ sử dụng từ này không?');

          // Pronoun postprocessing like earlier
          const isVn = (text: string) => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
          let respText = resultLines.join('\n');
          if (isVn(input.query) || isVn(respText)) {
            respText = respText.replace(/\bTôi\b/g, 'Tớ').replace(/\btôi\b/g, 'tớ');
            respText = respText.replace(/\bBạn\b/g, 'Cậu').replace(/\bbạn\b/g, 'cậu');
          }

          return { response: respText } as any;

        } catch (e) {
          console.error('Pronunciation handling error', e);
          // continue to normal flow
        }
      }
    }

    // Implement RAG retrieval (skip if useRag explicitly false)
    const useRag = input.useRag ?? true;
    let docs: { title: string; path: string; snippet: string }[] = [];
    if (useRag) {
      docs = await getRelevantDocs(input.query, 3);
    }

    // If we found vocabulary matches (path starts with db:vocabulary), use the vocabulary details flow to get authoritative data
    const vocabDoc = docs.find(d => d.path.startsWith('db:vocabulary:'));
    if (vocabDoc) {
      // extract id
      const idMatch = vocabDoc.path.match(/db:vocabulary:(\d+)/);
      if (idMatch) {
        const vocabId = parseInt(idMatch[1], 10);
        try {
          // fetch vocab item
          const v = await import('@/lib/prisma').then(m => m.prisma.vocabulary.findUnique({ where: { id: vocabId } }));
          if (v) {
            // call generateVocabularyDetails to produce a structured answer
            const details = await generateVocabularyDetails({ word: v.word, sourceLanguage: v.language as any, targetLanguage: 'vietnamese' });
            // Construct a helpful assistant response using details
            const lines = [] as string[];
            if (!details.exists) {
              lines.push('Không tìm thấy từ trong cơ sở dữ liệu.');
            } else {
              lines.push(`**${v.word}** (${v.language})`);
              if (details.pronunciation) lines.push(`Pronunciation: ${details.pronunciation}`);
              for (const def of details.definitions) {
                lines.push(`- *${def.partOfSpeech}*: ${def.meaning} — ${def.translation}`);
              }
              if (details.examples && details.examples.length) {
                lines.push('**Examples:**');
                for (const ex of details.examples) {
                  lines.push(`- ${ex.source} -> ${ex.target}`);
                }
              }
            }
            // Apply Vietnamese pronoun replacements if needed
            let responseText = lines.join('\n');
            const isVietnameseLocal = (text: string) => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
            if (isVietnameseLocal(input.query) || isVietnameseLocal(responseText)) {
              responseText = responseText.replace(/\bTôi\b/g, 'Tớ').replace(/\btôi\b/g, 'tớ');
              responseText = responseText.replace(/\bBạn\b/g, 'Cậu').replace(/\bbạn\b/g, 'cậu');
            }
            return { response: responseText } as any;
          }
        } catch (e) {
          console.error('Failed to fetch vocab details', e);
          // continue to normal flow
        }
      }
    }

    const promptInput = { ...input, contextDocs: docs };

    const { retryWithBackoff } = await import('@/lib/ai-retry');
    
    try {
      const promptResult = await retryWithBackoff(
        () => interactWithLanguageChatbotPrompt(promptInput as any),
        {
          maxRetries: 3,
          initialDelayMs: 1000,
        }
      );
      
      if (!promptResult || !promptResult.output) {
        throw new Error('Chatbot returned no response');
      }

      // Post-process to enforce Vietnamese informal pronouns
      let responseText = promptResult.output.response;
      const isVietnamese = (text: string) => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
      if (isVietnamese(input.query) || isVietnamese(responseText)) {
        // Replace formal 'tôi' -> 'tớ'
        responseText = responseText.replace(/\bTôi\b/g, 'Tớ').replace(/\btôi\b/g, 'tớ');
        // Replace 'bạn' with 'cậu' where appropriate (simple replacement)
        responseText = responseText.replace(/\bBạn\b/g, 'Cậu').replace(/\bbạn\b/g, 'cậu');
      }
      
      return { response: responseText };
    } catch (error: any) {
      console.error('Chatbot failed after retries:', error);
      throw new Error('Không thể kết nối đến dịch vụ AI. Vui lòng thử lại sau.');
    }
  }
);
