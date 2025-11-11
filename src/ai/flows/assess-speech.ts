import { generate } from '@genkit-ai/ai';
import { defineFlow, runFlow } from '@genkit-ai/flow';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { z } from 'zod';

const PronunciationAssessmentSchema = z.object({
  accuracyScore: z.number().min(0).max(100).describe("Accuracy of pronunciation compared to the reference text."),
  fluencyScore: z.number().min(0).max(100).describe("Fluency of the speech, including pauses and hesitations."),
  completenessScore: z.number().min(0).max(100).describe("How much of the reference text was spoken."),
  prosodyScore: z.number().min(0).max(100).describe("Naturalness of the speech rhythm and intonation."),
  overallScore: z.number().min(0).max(100).describe("Overall score combining all metrics."),
  words: z.array(z.object({
    word: z.string(),
    accuracyScore: z.number(),
    errorType: z.string().optional().describe("Type of error, e.g., 'mispronunciation', 'omission', 'insertion'."),
  })),
  feedback: z.string().optional().describe("General feedback and tips for improvement."),
});

export const assessSpeechFlow = defineFlow(
  {
    name: 'assessSpeechFlow',
    inputSchema: z.object({ referenceText: z.string(), transcribedText: z.string() }),
    outputSchema: PronunciationAssessmentSchema,
  },
  async ({ referenceText, transcribedText }) => {
    const prompt = 
      As an expert English pronunciation evaluator, please assess the provided speech.
      Reference text: ""
      User's transcribed text: ""

      Provide a detailed assessment including:
      1.  An overall score (0-100).
      2.  Scores for accuracy, fluency, completeness, and prosody (0-100).
      3.  A word-by-word analysis, highlighting any errors (mispronunciation, omission, insertion).
      4.  Provide constructive feedback and tips for improvement based on the errors.

      Return the assessment in JSON format.
    ;

    const llmResponse = await generate(gemini15Flash, {
      prompt,
      config: {
        temperature: 0.3,
      },
      output: {
        format: 'json',
        schema: PronunciationAssessmentSchema,
      },
    });

    if (!llmResponse.output) {
      throw new Error('Failed to generate pronunciation assessment');
    }

    return llmResponse.output;
  }
);

export async function assessSpeech(referenceText: string, transcribedText: string) {
  return await runFlow(assessSpeechFlow, { referenceText, transcribedText });
}
