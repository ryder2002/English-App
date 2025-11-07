"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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
}

function compareTexts(original: string, transcribed: string): WordComparisonResult[] {
  const originalWords = original.toLowerCase().trim().split(/\s+/);
  const transcribedWords = transcribed.toLowerCase().trim().split(/\s+/);
  
  const results: WordComparisonResult[] = [];
  const maxLength = Math.max(originalWords.length, transcribedWords.length);
  
  for (let i = 0; i < maxLength; i++) {
    const originalWord = originalWords[i] || '';
    const transcribedWord = transcribedWords[i] || '';
    
    if (!transcribedWord) {
      // Missing word
      results.push({
        word: '___',
        isCorrect: false,
        similarity: 0,
        originalWord,
      });
    } else if (!originalWord) {
      // Extra word
      results.push({
        word: transcribedWord,
        isCorrect: false,
        similarity: 0,
        originalWord: '',
      });
    } else {
      const similarity = calculateWordSimilarity(originalWord, transcribedWord);
      results.push({
        word: transcribedWord,
        isCorrect: similarity > 0.8, // 80% similarity threshold
        similarity,
        originalWord,
      });
    }
  }
  
  return results;
}

function calculateWordSimilarity(word1: string, word2: string): number {
  if (word1 === word2) return 1;
  
  const longer = word1.length > word2.length ? word1 : word2;
  const shorter = word1.length > word2.length ? word2 : word1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(word1, word2);
  return (longer.length - distance) / longer.length;
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

export function SpeakingResultDisplay({
  originalText,
  transcribedText,
  score,
}: SpeakingResultDisplayProps) {
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

        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
          💡 <strong>Gợi ý:</strong> Các từ được <strong className="text-red-600">in đậm và bôi đỏ</strong> là những từ bạn phát âm sai hoặc thiếu. 
          Hãy luyện tập những từ này để cải thiện phát âm. Độ chính xác được tính dựa trên độ tương đồng với văn bản gốc.
        </div>
      </CardContent>
    </Card>
  );
}
