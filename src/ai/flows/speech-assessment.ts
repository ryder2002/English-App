/**
 * AI-powered pronunciation assessment using OpenRouter API
 */

import { z } from 'zod';

export const PronunciationAssessmentSchema = z.object({
  accuracyScore: z.number().min(0).max(100),
  fluencyScore: z.number().min(0).max(100),
  completenessScore: z.number().min(0).max(100),
  prosodyScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  words: z.array(z.object({
    word: z.string(),
    accuracyScore: z.number(),
    errorType: z.string().optional(),
  })),
  feedback: z.string().optional(),
});

export type PronunciationAssessment = z.infer<typeof PronunciationAssessmentSchema>;

export async function assessSpeech(
  referenceText: string,
  transcribedText: string
): Promise<PronunciationAssessment> {
  const prompt = `As an expert English pronunciation evaluator, assess this speech:

Reference: "${referenceText}"
Transcribed: "${transcribedText}"

Return JSON with accuracyScore, fluencyScore, completenessScore, prosodyScore, overallScore (all 0-100), words array (word, accuracyScore, errorType), and feedback.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || '',
        'X-Title': process.env.OPENROUTER_SITE_NAME || 'English App',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_PRIMARY_MODEL || 'google/gemma-2-27b-it:free',
        messages: [
          { role: 'system', content: 'You are an English pronunciation evaluator. Respond with JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    const assessment = JSON.parse(content);
    return PronunciationAssessmentSchema.parse(assessment);
  } catch (error) {
    console.error('Assessment error:', error);
    return {
      accuracyScore: 50,
      fluencyScore: 50,
      completenessScore: 50,
      prosodyScore: 50,
      overallScore: 50,
      words: transcribedText.split(' ').map(word => ({
        word,
        accuracyScore: 50,
        errorType: 'None',
      })),
      feedback: 'Assessment unavailable due to technical error.',
    };
  }
}
