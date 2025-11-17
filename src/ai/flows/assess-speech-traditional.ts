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
 * Normalize text for comparison (lowercase, remove punctuation, trim whitespace)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()\-–—]/g, '') // Remove punctuation and dashes
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
}

/**
 * Check if a word is a filler word (should be ignored in comparison)
 */
function isFillerWord(word: string): boolean {
  const fillers = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean', 'sort of', 'kind of'];
  return fillers.includes(normalizeText(word));
}

/**
 * Calculate similarity between two words (0-1) with improved tolerance
 */
function calculateSimilarity(word1: string, word2: string): number {
  const w1 = normalizeText(word1);
  const w2 = normalizeText(word2);
  
  if (w1 === w2) return 1.0;
  
  // Handle empty strings
  if (w1.length === 0 || w2.length === 0) return 0.0;
  
  // Check for common speech recognition errors
  if (arePhoneticallySimilar(w1, w2)) return 0.9;
  
  // Simple Levenshtein distance with improved scoring
  const maxLen = Math.max(w1.length, w2.length);
  const distance = levenshteinDistance(w1, w2);
  
  // More forgiving scoring for longer words
  const lengthBonus = maxLen > 5 ? 0.1 : 0;
  const similarity = Math.max(0, 1 - (distance / maxLen) + lengthBonus);
  
  return Math.min(1.0, similarity);
}

/**
 * Check if two words are phonetically similar (common speech recognition errors)
 */
function arePhoneticallySimilar(word1: string, word2: string): boolean {
  const phoneticPairs = [
    ['there', 'their', 'theyre'],
    ['to', 'too', 'two'],
    ['your', 'youre'],
    ['its', 'its'],
    ['hear', 'here'],
    ['no', 'know'],
    ['write', 'right'],
    ['see', 'sea'],
    ['for', 'four'],
    ['ate', 'eight'],
  ];
  
  for (const group of phoneticPairs) {
    if (group.includes(word1) && group.includes(word2)) {
      return true;
    }
  }
  
  return false;
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

  // Split into words and filter out filler words
  const referenceWords = referenceText
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => normalizeText(w))
    .filter(w => w.length > 0);
  
  const transcribedWords = transcribedText
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => normalizeText(w))
    .filter(w => !isFillerWord(w) && w.length > 0);

  const wordComparisons: WordComparison[] = [];
  let correctCount = 0;
  let incorrectCount = 0;
  let missingCount = 0;

  // Compare each reference word with transcribed words using improved matching
  const usedIndices = new Set<number>();
  const similarityThreshold = 0.7; // Lowered from 0.8 for more forgiving matching
  
  for (let refIndex = 0; refIndex < referenceWords.length; refIndex++) {
    const refWord = referenceWords[refIndex];
    let bestMatch: { index: number; similarity: number; word: string } | null = null;
    
    // Find best matching transcribed word within a reasonable window
    const searchStart = Math.max(0, refIndex - 3);
    const searchEnd = Math.min(transcribedWords.length, refIndex + 4);
    
    for (let transIndex = searchStart; transIndex < searchEnd; transIndex++) {
      if (usedIndices.has(transIndex)) continue;
      
      const transWord = transcribedWords[transIndex];
      const similarity = calculateSimilarity(refWord, transWord);
      
      // Bonus for matching in nearby position
      const positionBonus = Math.abs(refIndex - transIndex) <= 1 ? 0.05 : 0;
      const adjustedSimilarity = Math.min(1.0, similarity + positionBonus);
      
      if (!bestMatch || adjustedSimilarity > bestMatch.similarity) {
        bestMatch = { index: transIndex, similarity: adjustedSimilarity, word: transWord };
      }
    }

    if (bestMatch && bestMatch.similarity >= similarityThreshold) {
      // Consider it correct if above threshold
      usedIndices.add(bestMatch.index);
      const isExact = bestMatch.similarity >= 0.95;
      
      wordComparisons.push({
        word: refWord,
        isCorrect: true, // Consider similar words as correct
        matchType: isExact ? 'exact' : 'similar'
      });
      
      correctCount++;
    } else if (bestMatch && bestMatch.similarity >= 0.5) {
      // Partially correct - close but not quite
      usedIndices.add(bestMatch.index);
      wordComparisons.push({
        word: refWord,
        isCorrect: false,
        matchType: 'similar'
      });
      incorrectCount++;
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

  // Calculate scores with improved weighting
  const totalWords = referenceWords.length;
  
  // Accuracy: percentage of correct words
  const accuracyScore = totalWords > 0 
    ? Math.round((correctCount / totalWords) * 100)
    : 0;
  
  // Completeness: percentage of attempted words (correct + similar)
  const attemptedWords = correctCount + incorrectCount;
  const completenessScore = totalWords > 0
    ? Math.round((attemptedWords / totalWords) * 100)
    : 0;
  
  // Overall: weighted average favoring accuracy but rewarding completeness
  // 60% accuracy, 40% completeness (more balanced)
  const overallScore = Math.round((accuracyScore * 0.6) + (completenessScore * 0.4));

  // Generate improved feedback
  let feedback = '';
  if (overallScore >= 90) {
    feedback = '🌟 Xuất sắc! Phát âm rất chính xác và rõ ràng.';
  } else if (overallScore >= 75) {
    feedback = '👍 Tốt lắm! Hầu hết các từ đều đúng.';
  } else if (overallScore >= 60) {
    feedback = '✅ Khá tốt! Một số từ cần cải thiện phát âm.';
  } else if (overallScore >= 40) {
    feedback = '📚 Cần luyện tập thêm. Hãy nói chậm và rõ ràng hơn.';
  } else {
    feedback = '💪 Hãy tiếp tục cố gắng! Luyện tập nhiều hơn sẽ giúp bạn tiến bộ.';
  }

  if (missingCount > 0) {
    feedback += ` Thiếu ${missingCount} từ hoặc không phát hiện được.`;
  }
  if (extraCount > 0 && extraCount > totalWords * 0.2) {
    feedback += ` Có ${extraCount} từ thừa hoặc không cần thiết.`;
  }
  if (incorrectCount > 0) {
    feedback += ` ${incorrectCount} từ gần đúng nhưng cần cải thiện.`;
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
