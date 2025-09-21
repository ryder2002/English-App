"use server";

import {
  generateVocabularyDetails,
  type GenerateVocabularyDetailsOutput,
} from "@/ai/flows/generate-vocabulary-details";
import {
  generateQuickVocabularyDetails,
} from "@/ai/flows/generate-quick-vocabulary-details";
import {
  generateBatchVocabularyDetails,
} from "@/ai/flows/generate-batch-vocabulary-details";
import {
  interactWithLanguageChatbot,
} from "@/ai/flows/interact-with-language-chatbot";
import { generatePronunciation } from "@/ai/flows/generate-pronunciation-flow";
import type { Language } from "@/lib/types";
import { sendInvitation, getInvitations, respondToInvitation, getUserByEmail } from "@/lib/services/invitation-service";

// NOTE: Audio generation actions have been removed.
// Text-to-Speech is now handled on the client-side using the Web Speech API.

// Define input/output types here as they are not exported from flows
type GenerateQuickVocabularyDetailsInput = {
    word: string;
    sourceLanguage: Language;
    targetLanguage: Language;
}
type GenerateQuickVocabularyDetailsOutput = {
    translation: string;
    pronunciation?: string;
}

type GenerateBatchVocabularyDetailsInput = {
    words: string[];
    sourceLanguage: Language;
    targetLanguage: Language;
    folderId: string;
}
type GenerateBatchVocabularyDetailsOutput = {
    word: string;
    language: Language;
    vietnameseTranslation: string;
    folderId: string;
    ipa?: string;
    pinyin?: string;
}[];

type InteractWithLanguageChatbotInput = {
    query: string;
};


export async function getVocabularyDetailsAction(
  word: string,
  sourceLanguage: Language,
  targetLanguage: Language,
): Promise<GenerateQuickVocabularyDetailsOutput> {
    const input: GenerateQuickVocabularyDetailsInput = { 
        word, 
        sourceLanguage,
        targetLanguage,
    };
    const details = await generateQuickVocabularyDetails(input);

    return {
        translation: details.translation,
        pronunciation: details.pronunciation,
    };
}

export async function dictionaryLookupAction(
  input: { word: string; sourceLanguage: Language; targetLanguage: Language; }
): Promise<GenerateVocabularyDetailsOutput> {
  const details = await generateVocabularyDetails(input);
  return details;
}

export async function batchAddVocabularyAction(
  input: GenerateBatchVocabularyDetailsInput
): Promise<GenerateBatchVocabularyDetailsOutput> {
  const details = await generateBatchVocabularyDetails(input);
  return details;
}

export async function getChatbotResponseAction(
  query: string
): Promise<string> {
  const input: InteractWithLanguageChatbotInput = { query };
  const result = await interactWithLanguageChatbot(input);
  return result.response;
}

export async function getPronunciationAction(word: string, language: 'english' | 'chinese'): Promise<string | undefined> {
    try {
        const result = await generatePronunciation({ word, language });
        return result.pronunciation;
    } catch (e) {
        console.error("Error generating pronunciation in getPronunciationAction", e);
        return undefined;
    }
}

export async function sendInvitationAction(folderId: string, folderName: string, fromUserEmail: string, toUserEmail: string) {
    // Verify user to be invited exists
    const toUser = await getUserByEmail(toUserEmail);
    if (!toUser) {
        throw new Error("User with that email does not exist.");
    }
    return await sendInvitation(folderId, folderName, fromUserEmail, toUser.uid, toUserEmail);
}

export async function getInvitationsAction(userId: string) {
    return await getInvitations(userId);
}

export async function respondToInvitationAction(invitationId: string, status: 'accepted' | 'declined') {
    return await respondToInvitation(invitationId, status);
}
