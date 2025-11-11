/**
 * @fileOverview AI-powered pronunciation assessment for speaking homework
 * using OpenRouter API with Google Gemma models.
 */

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
    errorType: z.string().optional().describe("Type of error: 'None', 'Mispronunciation', 'Omission', or 'Insertion'."),
  })),
  feedback: z.string().optional().describe("General feedback and tips for improvement."),
});

export type PronunciationAssessment = z.infer<typeof PronunciationAssessmentSchema>;

interface AssessmentInput {
  referenceText: string;
  transcribedText: string;
}

/**
 * Assesses pronunciation quality by comparing transcribed text with reference text
 * @param referenceText - The expected text to be spoken
 * @param transcribedText - The actual transcribed speech from the user
 * @returns Detailed pronunciation assessment with scores and feedback
 */
export async function assessSpeech(
  referenceText: string,
  transcribedText: string
): Promise<PronunciationAssessment> {
  const prompt = `As an expert English pronunciation evaluator, please assess the following speech submission.

Reference Text (Expected): "${referenceText}"
User's Transcribed Speech: "${transcribedText}"

Provide a detailed pronunciation assessment in JSON format with:
1. accuracyScore (0-100): How accurately the words were pronounced compared to the reference
2. fluencyScore (0-100): How smoothly and naturally the speech flows, considering pauses and hesitations
3. completenessScore (0-100): Percentage of reference text that was actually spoken
4. prosodyScore (0-100): Natural rhythm, intonation, and stress patterns
5. overallScore (0-100): Combined weighted score of all metrics
6. words: Array of word-by-word analysis with:
   - word: the actual word spoken
   - accuracyScore: pronunciation accuracy for this word (0-100)
   - errorType: "None", "Mispronunciation", "Omission", or "Insertion"
7. feedback: Constructive feedback with specific tips for improvement

Return ONLY valid JSON matching this exact structure:
{
  "accuracyScore": number,
  "fluencyScore": number,
  "completenessScore": number,
  "prosodyScore": number,
  "overallScore": number,
  "words": [
    {
      "word": "string",
      "accuracyScore": number,
      "errorType": "None" | "Mispronunciation" | "Omission" | "Insertion"
    }
  ],
  "feedback": "string"
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://cnenglish.io.vn',
        'X-Title': process.env.OPENROUTER_SITE_NAME || 'CN English Learning',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_PRIMARY_MODEL || 'google/gemma-2-27b-it:free',
        messages: [
          {
            role: 'system',
            content: 'You are an expert English pronunciation evaluator. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    const content = data.choices[0].message.content;
    
    // Parse and validate the response
    let assessment: any;
    try {
      assessment = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('AI returned invalid JSON');
    }

    // Validate against schema
    const validatedAssessment = PronunciationAssessmentSchema.parse(assessment);
    
    return validatedAssessment;
  } catch (error) {
    console.error('Error in assessSpeech:', error);
    
    // Return a default assessment in case of error
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
      feedback: 'Unable to complete assessment due to technical error. Please try again.',
    };
  }
}
