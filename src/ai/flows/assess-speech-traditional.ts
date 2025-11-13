/**
 * @fileOverview Traditional text comparison for pronunciation assessment
 * No AI - Simple string comparison with word-level accuracy
 */

export interface WordComparison {
  word: string;
  isCorrect: boolean;
  matchType: 'exact' | 'similar' | 'missing' | 'extra';
}

export interface TraditionalAssessment {
  overallScore: number;
  accuracyScore: number;
  completenessScore: number;
  referenceWords: string[];
  transcribedWords: string[];
  wordComparisons: WordComparison[];
  correctCount: number;
  incorrectCount: number;
  missingCount: number;
  extraCount: number;
  feedback: string;
}

/**
 * Normalize text for comparison (lowercase, remove punctuation)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()]/g, '')
    .trim();
}

/**
 * Calculate similarity between two words (0-1)
 */
function calculateSimilarity(word1: string, word2: string): number {
  const w1 = normalizeText(word1);
  const w2 = normalizeText(word2);
  
  if (w1 === w2) return 1.0;
  
  // Simple Levenshtein distance
  const maxLen = Math.max(w1.length, w2.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(w1, w2);
  return 1 - (distance / maxLen);
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) track[0][i] = i;
  for (let j = 0; j <= str2.length; j++) track[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  
  return track[str2.length][str1.length];
}

/**
 * Compare reference text with transcribed text (traditional method)
 */
export function assessSpeechTraditional(
  referenceText: string,
  transcribedText: string
): TraditionalAssessment {
  console.log('📊 Traditional assessment starting...', {
    referenceLength: referenceText.length,
    transcribedLength: transcribedText.length
  });

  // Split into words
  const referenceWords = referenceText
    .split(/\s+/)
    .filter(w => w.length > 0);
  
  const transcribedWords = transcribedText
    .split(/\s+/)
    .filter(w => w.length > 0);

  const wordComparisons: WordComparison[] = [];
  let correctCount = 0;
  let incorrectCount = 0;
  let missingCount = 0;

  // Compare each reference word with transcribed words
  const usedIndices = new Set<number>();
  
  for (let refIndex = 0; refIndex < referenceWords.length; refIndex++) {
    const refWord = referenceWords[refIndex];
    let bestMatch: { index: number; similarity: number; word: string } | null = null;
    
    // Find best matching transcribed word
    for (let transIndex = 0; transIndex < transcribedWords.length; transIndex++) {
      if (usedIndices.has(transIndex)) continue;
      
      const transWord = transcribedWords[transIndex];
      const similarity = calculateSimilarity(refWord, transWord);
      
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { index: transIndex, similarity, word: transWord };
      }
    }

    if (bestMatch && bestMatch.similarity >= 0.8) {
      // Consider it correct if 80%+ similar
      usedIndices.add(bestMatch.index);
      const isExact = bestMatch.similarity === 1.0;
      
      wordComparisons.push({
        word: refWord,
        isCorrect: isExact,
        matchType: isExact ? 'exact' : 'similar'
      });
      
      if (isExact) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    } else {
      // Word is missing or very different
      wordComparisons.push({
        word: refWord,
        isCorrect: false,
        matchType: 'missing'
      });
      missingCount++;
    }
  }

  // Count extra words (words in transcribed but not in reference)
  const extraCount = transcribedWords.length - usedIndices.size;

  // Calculate scores
  const totalWords = referenceWords.length;
  const accuracyScore = totalWords > 0 
    ? Math.round((correctCount / totalWords) * 100)
    : 0;
  
  const completenessScore = totalWords > 0
    ? Math.round(((correctCount + incorrectCount) / totalWords) * 100)
    : 0;
  
  const overallScore = Math.round((accuracyScore * 0.7) + (completenessScore * 0.3));

  // Generate feedback
  let feedback = '';
  if (overallScore >= 80) {
    feedback = 'Excellent pronunciation! Most words are correct.';
  } else if (overallScore >= 60) {
    feedback = 'Good effort! Some words need improvement.';
  } else if (overallScore >= 40) {
    feedback = 'Fair pronunciation. Practice more to improve accuracy.';
  } else {
    feedback = 'Needs improvement. Try speaking more clearly and slowly.';
  }

  if (missingCount > 0) {
    feedback += ` ${missingCount} word(s) were not detected.`;
  }
  if (extraCount > 0) {
    feedback += ` ${extraCount} extra word(s) were added.`;
  }

  const result: TraditionalAssessment = {
    overallScore,
    accuracyScore,
    completenessScore,
    referenceWords,
    transcribedWords,
    wordComparisons,
    correctCount,
    incorrectCount,
    missingCount,
    extraCount,
    feedback
  };

  console.log('✅ Traditional assessment completed:', {
    overallScore,
    correctCount,
    incorrectCount,
    missingCount
  });

  return result;
}
