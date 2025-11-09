"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AudioPlayer from './audio-player';

interface WordComparisonResult {
  word: string;
  isCorrect: boolean;
  similarity: number;
  originalWord: string;
}

interface SpeakingResultDisplayProps {
  originalText: string;
  transcribedText: string;
  score: number;
  submissionId?: number; // Add submission ID for audio playback
  voiceAnalysis?: {
    stressPattern: { accuracy: number; feedback: string; };
    intonation: { naturalness: number; feedback: string; pattern: string; };
    pronunciation: { overallClarity: number; vowelAccuracy: number; consonantAccuracy: number; suggestions: string[]; };
    emotion: { detectedEmotion: string; confidence: number; energyLevel: number; };
  };
  detailedFeedback?: {
    overallScore: number;
    accuracy: number;
    fluency: number;
    speed: number;
    recommendations: string[];
  };
}

// Enhanced text comparison with intelligent matching
function compareTexts(original: string, transcribed: string): WordComparisonResult[] {
  // Advanced normalization function
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      // Remove ALL punctuation
      .replace(/[.,;:!?'"(){}\[\]\-_+=*&^%$#@~`|\\/<>]/g, '')
      .replace(/[^\w\s]/g, '')
      // Normalize contractions
      .replace(/\bwon't\b/g, 'will not')
      .replace(/\bcan't\b/g, 'cannot')
      .replace(/\bdon't\b/g, 'do not')
      .replace(/\bdoesn't\b/g, 'does not')
      .replace(/\bdidn't\b/g, 'did not')
      .replace(/\byou're\b/g, 'you are')
      .replace(/\bthey're\b/g, 'they are')
      .replace(/\bwe're\b/g, 'we are')
      .replace(/\bi'm\b/g, 'i am')
      .replace(/\bhe's\b/g, 'he is')
      .replace(/\bshe's\b/g, 'she is')
      .replace(/\bit's\b/g, 'it is')
      .replace(/\bthat's\b/g, 'that is')
      .replace(/\bisn't\b/g, 'is not')
      .replace(/\baren't\b/g, 'are not')
      .replace(/\bwasn't\b/g, 'was not')
      .replace(/\bweren't\b/g, 'were not')
      .replace(/\bhaven't\b/g, 'have not')
      .replace(/\bhasn't\b/g, 'has not')
      .replace(/\bhadn't\b/g, 'had not')
      .replace(/\bwouldn't\b/g, 'would not')
      .replace(/\bcouldn't\b/g, 'could not')
      .replace(/\bshouldn't\b/g, 'should not')
      // Handle contractions without apostrophes
      .replace(/\bwont\b/g, 'will not')
      .replace(/\bcant\b/g, 'cannot')
      .replace(/\bdont\b/g, 'do not')
      .replace(/\bdoesnt\b/g, 'does not')
      .replace(/\bdidnt\b/g, 'did not')
      .replace(/\byoure\b/g, 'you are')
      .replace(/\btheyre\b/g, 'they are')
      .replace(/\bwere\b/g, 'we are')
      .replace(/\bim\b/g, 'i am')
      .replace(/\bhes\b/g, 'he is')
      .replace(/\bshes\b/g, 'she is')
      .replace(/\bits\b/g, 'it is')
      .replace(/\bthats\b/g, 'that is')
      .replace(/\bisnt\b/g, 'is not')
      .replace(/\barent\b/g, 'are not')
      .replace(/\bwasnt\b/g, 'was not')
      .replace(/\bwerent\b/g, 'were not')
      .replace(/\bhavent\b/g, 'have not')
      .replace(/\bhasnt\b/g, 'has not')
      .replace(/\bhadnt\b/g, 'had not')
      .replace(/\bwouldnt\b/g, 'would not')
      .replace(/\bcouldnt\b/g, 'could not')
      .replace(/\bshouldnt\b/g, 'should not')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const normalizedOriginal = normalizeText(original);
  const normalizedTranscribed = normalizeText(transcribed);
  
  // Check for perfect match after normalization
  if (normalizedOriginal === normalizedTranscribed) {
    return normalizedOriginal.split(/\s+/).map(word => ({
      word,
      isCorrect: true,
      similarity: 1,
      originalWord: word,
    }));
  }

  const originalWords = normalizedOriginal.split(/\s+/).filter(w => w.length > 0);
  const transcribedWords = normalizedTranscribed.split(/\s+/).filter(w => w.length > 0);
  
  // Use dynamic programming for optimal word alignment
  const results = alignWords(originalWords, transcribedWords);
  return results;
}

// Advanced word alignment using dynamic programming
function alignWords(originalWords: string[], transcribedWords: string[]): WordComparisonResult[] {
  const results: WordComparisonResult[] = [];
  const m = originalWords.length;
  const n = transcribedWords.length;
  
  // Create DP matrix for word alignment
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  const actions: string[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(''));
  
  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
    actions[i][0] = 'delete';
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
    actions[0][j] = 'insert';
  }
  
  // Fill DP matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const originalWord = originalWords[i - 1];
      const transcribedWord = transcribedWords[j - 1];
      const similarity = calculateEnhancedWordSimilarity(originalWord, transcribedWord);
      
      const substituteCost = similarity > 0.6 ? 0 : 1;
      const deleteCost = dp[i - 1][j] + 1;
      const insertCost = dp[i][j - 1] + 1;
      const substituteCostTotal = dp[i - 1][j - 1] + substituteCost;
      
      if (substituteCostTotal <= deleteCost && substituteCostTotal <= insertCost) {
        dp[i][j] = substituteCostTotal;
        actions[i][j] = 'substitute';
      } else if (deleteCost <= insertCost) {
        dp[i][j] = deleteCost;
        actions[i][j] = 'delete';
      } else {
        dp[i][j] = insertCost;
        actions[i][j] = 'insert';
      }
    }
  }
  
  // Backtrack to find alignment
  let i = m, j = n;
  const alignment: Array<{action: string, original?: string, transcribed?: string}> = [];
  
  while (i > 0 || j > 0) {
    const action = actions[i][j];
    
    if (action === 'substitute') {
      alignment.unshift({
        action: 'substitute',
        original: originalWords[i - 1],
        transcribed: transcribedWords[j - 1]
      });
      i--; j--;
    } else if (action === 'delete') {
      alignment.unshift({
        action: 'delete',
        original: originalWords[i - 1]
      });
      i--;
    } else {
      alignment.unshift({
        action: 'insert',
        transcribed: transcribedWords[j - 1]
      });
      j--;
    }
  }
  
  // Convert alignment to results
  for (const align of alignment) {
    if (align.action === 'substitute') {
      const similarity = calculateEnhancedWordSimilarity(align.original!, align.transcribed!);
      results.push({
        word: align.transcribed!,
        isCorrect: similarity > 0.7, // More lenient threshold
        similarity,
        originalWord: align.original!,
      });
    } else if (align.action === 'delete') {
      results.push({
        word: '___',
        isCorrect: false,
        similarity: 0,
        originalWord: align.original!,
      });
    } else if (align.action === 'insert') {
      results.push({
        word: align.transcribed!,
        isCorrect: false,
        similarity: 0,
        originalWord: '',
      });
    }
  }
  
  return results;
}

// Enhanced word similarity with phonetic matching
function calculateEnhancedWordSimilarity(word1: string, word2: string): number {
  if (word1 === word2) return 1;
  
  // Check for phonetic similarity first
  if (arePhoneticallySimilar(word1, word2)) {
    return 0.95; // Very high score for phonetic matches
  }
  
  // Check for common speech recognition errors
  if (isCommonSpeechError(word1, word2)) {
    return 0.9; // High score for common errors
  }
  
  // Calculate edit distance similarity
  const longer = word1.length > word2.length ? word1 : word2;
  const shorter = word1.length > word2.length ? word2 : word1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(word1, word2);
  const baseSimilarity = (longer.length - distance) / longer.length;
  
  // Boost similarity for short words (more forgiving)
  if (longer.length <= 3 && distance <= 1) {
    return Math.max(baseSimilarity, 0.8);
  }
  
  // Boost similarity if words start with same letters
  if (word1.charAt(0) === word2.charAt(0) && longer.length >= 4) {
    return Math.min(baseSimilarity + 0.1, 1);
  }
  
  return baseSimilarity;
}

// Check for phonetic similarity
function arePhoneticallySimilar(word1: string, word2: string): boolean {
  const phoneticPairs: Record<string, string[]> = {
    // Common homophones
    'to': ['too', 'two'],
    'there': ['their', 'theyre', 'they\'re'],
    'your': ['youre', 'you\'re'],
    'its': ['it\'s', 'it'],
    'than': ['then'],
    'accept': ['except'],
    'affect': ['effect'],
    'brake': ['break'],
    'buy': ['by', 'bye'],
    'hear': ['here'],
    'hour': ['our'],
    'know': ['no', 'now'],
    'won': ['one'],
    'right': ['write', 'rite'],
    'sea': ['see'],
    'week': ['weak'],
    'wood': ['would'],
    'where': ['were', 'wear'],
    'new': ['knew'],
    'four': ['for', 'fore'],
    'ate': ['eight'],
    'way': ['weigh'],
    'red': ['read'],
    'blue': ['blew'],
    'cell': ['sell'],
    'cent': ['sent'],
    'dear': ['deer'],
    'fair': ['fare'],
    'flour': ['flower'],
    'mail': ['male'],
    'pair': ['pear'],
    'peace': ['piece'],
    'plain': ['plane'],
    'rain': ['reign'],
    'sail': ['sale'],
    'tail': ['tale'],
    'wait': ['weight'],
  };
  
  for (const [key, variants] of Object.entries(phoneticPairs)) {
    if ((word1 === key && variants.includes(word2)) ||
        (word2 === key && variants.includes(word1)) ||
        (variants.includes(word1) && variants.includes(word2))) {
      return true;
    }
  }
  
  return false;
}

// Check for common speech recognition errors
function isCommonSpeechError(word1: string, word2: string): boolean {
  const commonErrors: Array<[string, string]> = [
    ['th', 'f'],    // "think" -> "fink"
    ['th', 'v'],    // "the" -> "ve"
    ['w', 'v'],     // "water" -> "vater"
    ['r', 'l'],     // "rice" -> "lice"
    ['b', 'p'],     // "bag" -> "pag"
    ['d', 't'],     // "dog" -> "tog"
    ['g', 'k'],     // "bag" -> "bak"
    ['z', 's'],     // "zero" -> "sero"
    ['j', 'y'],     // "job" -> "yob"
    ['ch', 'sh'],   // "chair" -> "shair"
    ['s', 'sh'],    // "see" -> "shee"
    ['n', 'm'],     // "sun" -> "sum"
  ];
  
  for (const [sound1, sound2] of commonErrors) {
    if ((word1.includes(sound1) && word2.includes(sound2)) ||
        (word1.includes(sound2) && word2.includes(sound1))) {
      // Check if replacing the sound makes words similar
      const replaced1 = word1.replace(sound1, sound2);
      const replaced2 = word2.replace(sound2, sound1);
      
      if (replaced1 === word2 || replaced2 === word1) {
        return true;
      }
    }
  }
  
  return false;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export function SpeakingResultDisplay(props: SpeakingResultDisplayProps) {
  const {
    originalText,
    transcribedText,
    score,
    submissionId,
    voiceAnalysis,
    detailedFeedback,
  } = props;
  const comparisonResults = compareTexts(originalText, transcribedText);
  const correctWords = comparisonResults.filter(r => r.isCorrect).length;
  const totalWords = comparisonResults.length;
  const wordAccuracy = totalWords > 0 ? (correctWords / totalWords) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Overall Score */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Điểm tổng thể</h3>
            <p className="text-2xl font-bold">{Math.round(score * 100)}%</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Từ chính xác</h3>
            <p className="text-2xl font-bold">{correctWords}/{totalWords}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Độ chính xác từ</h3>
            <p className="text-2xl font-bold">{Math.round(wordAccuracy)}%</p>
          </div>
        </div>

        {/* Original Text */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            📝 Văn bản gốc:
          </h3>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-base whitespace-pre-wrap leading-relaxed">
              {originalText}
            </p>
          </div>
        </div>

        {/* Transcribed Text with Highlights */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            🎤 Văn bản bạn đã đọc:
          </h3>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-md border-2 border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2 text-base leading-relaxed">
              {comparisonResults.map((result, index) => (
                <span
                  key={index}
                  className={`inline-block px-2 py-1 rounded-md ${
                    result.isCorrect
                      ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
                      : 'text-white bg-red-500 dark:bg-red-600 font-bold'
                  }`}
                  title={
                    result.isCorrect
                      ? `✓ Đúng (${Math.round(result.similarity * 100)}%)`
                      : `✗ Sai - Đáng ra: "${result.originalWord}" (${Math.round(result.similarity * 100)}%)`
                  }
                >
                  {result.word}
                  {!result.isCorrect && result.originalWord && (
                    <span className="text-xs ml-1 opacity-90 underline">
                      (≠{result.originalWord})
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 rounded"></span>
            <span>Từ đúng</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 bg-red-500 dark:bg-red-600 rounded"></span>
            <span>Từ sai (in đậm, bôi đỏ)</span>
          </div>
        </div>

        {/* Performance Badge */}
        <div className="flex justify-center">
          <Badge
            variant={score >= 0.9 ? 'default' : score >= 0.7 ? 'secondary' : 'destructive'}
            className="text-lg px-4 py-2"
          >
            {score >= 0.9
              ? '🏆 Xuất sắc!'
              : score >= 0.7
              ? '👍 Tốt!'
              : score >= 0.5
              ? '💪 Cần cải thiện'
              : '📚 Hãy luyện tập thêm'}
          </Badge>
        </div>

        {/* Advanced Voice Analysis */}
        {voiceAnalysis && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              🎯 Phân tích giọng nói chi tiết
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{voiceAnalysis.stressPattern.accuracy}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Nhấn âm</div>
              </div>
              
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{voiceAnalysis.intonation.naturalness}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Ngữ điệu</div>
              </div>
              
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{voiceAnalysis.pronunciation.overallClarity}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Rõ ràng</div>
              </div>
              
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{voiceAnalysis.emotion.energyLevel}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Năng lượng</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-white dark:bg-gray-800 rounded">
                <strong className="text-blue-600">Nhấn âm:</strong> {voiceAnalysis.stressPattern.feedback}
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded">
                <strong className="text-green-600">Ngữ điệu:</strong> {voiceAnalysis.intonation.feedback}
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded">
                <strong className="text-purple-600">Cảm xúc:</strong> {voiceAnalysis.emotion.detectedEmotion}
                <Badge variant="outline" className="ml-2">
                  {Math.round(voiceAnalysis.emotion.confidence * 100)}% tin cậy
                </Badge>
              </div>
              
              {voiceAnalysis.pronunciation.suggestions.length > 0 && (
                <div className="p-3 bg-white dark:bg-gray-800 rounded">
                  <strong className="text-orange-600">Gợi ý cải thiện:</strong>
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    {voiceAnalysis.pronunciation.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-gray-700 dark:text-gray-300">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detailed Performance Feedback */}
        {detailedFeedback && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              📊 Báo cáo chi tiết
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{detailedFeedback.overallScore}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Điểm tổng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{detailedFeedback.accuracy}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Chính xác</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{detailedFeedback.fluency}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Trôi chảy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{detailedFeedback.speed}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tốc độ</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <strong className="text-gray-900 dark:text-gray-100">Khuyến nghị:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {detailedFeedback.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300">{recommendation}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Audio Playback */}
        {submissionId && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              🎵 Nghe lại bài đọc của bạn:
            </h3>
            <AudioPlayer 
              submissionId={submissionId} 
              autoLoad={true}
              className="bg-white dark:bg-gray-900"
            />
          </div>
        )}

        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
          💡 <strong>Gợi ý:</strong> Các từ được <strong className="text-red-600">in đậm và bôi đỏ</strong> là những từ bạn phát âm sai hoặc thiếu. 
          Hãy luyện tập những từ này để cải thiện phát âm. Độ chính xác được tính dựa trên độ tương đồng với văn bản gốc.
        </div>
      </CardContent>
    </Card>
  );
}
