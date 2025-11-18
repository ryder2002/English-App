// Intelligent Speech Processing Service
// Supports: English, Vietnamese, Chinese (Mandarin)
export class IntelligentSpeechProcessor {
  private static phoneticMap = new Map([
    // Homophones and near-homophones (English)
    ['to', ['too', 'two']],
    ['there', ['their', 'theyre', 'they\'re']],
    ['your', ['youre', 'you\'re']],
    ['its', ['it\'s']],
    ['than', ['then']],
    ['accept', ['except']],
    ['affect', ['effect']],
    ['brake', ['break']],
    ['buy', ['by', 'bye']],
    ['hear', ['here']],
    ['hour', ['our']],
    ['know', ['no', 'now']],
    ['one', ['won']],
    ['right', ['write', 'rite']],
    ['sea', ['see']],
    ['week', ['weak']],
    ['wood', ['would']],
    ['where', ['were', 'wear']],
    // Common speech recognition errors (English)
    ['think', ['fink', 'sink']],
    ['the', ['ve', 'de']],
    ['water', ['vater', 'vatter']],
    ['what', ['vat', 'wat']],
    ['rice', ['lice', 'rice']],
    ['very', ['wery', 'vely']],
    ['with', ['wif', 'vith']],
  ]);

  // Chinese (Mandarin) common confusions
  private static chinesePhoneticMap = new Map([
    // Similar sounds in Mandarin
    ['是', ['十', '师', '时', 'shi']],
    ['不', ['步', '部', 'bu']],
    ['的', ['地', '得', 'de']],
    ['在', ['再', '载', 'zai']],
    ['会', ['回', '汇', 'hui']],
    ['了', ['le', 'liao']],
    ['有', ['又', 'you']],
    ['他', ['她', '它', 'ta']],
    ['这', ['zhe', 'zhei']],
    ['那', ['na', 'nei']],
  ]);

  private static contractionMap = new Map([
    ['wont', 'will not'],
    ['cant', 'cannot'],
    ['dont', 'do not'],
    ['doesnt', 'does not'],
    ['didnt', 'did not'],
    ['youre', 'you are'],
    ['theyre', 'they are'],
    ['were', 'we are'],
    ['im', 'i am'],
    ['hes', 'he is'],
    ['shes', 'she is'],
    ['its', 'it is'],
    ['thats', 'that is'],
    ['isnt', 'is not'],
    ['arent', 'are not'],
    ['wasnt', 'was not'],
    ['werent', 'were not'],
    ['havent', 'have not'],
    ['hasnt', 'has not'],
    ['hadnt', 'had not'],
    ['wouldnt', 'would not'],
    ['couldnt', 'could not'],
    ['shouldnt', 'should not'],
  ]);

  // Enhanced text normalization with language support
  static normalizeText(text: string, language: 'en' | 'zh' | 'vi' = 'en'): string {
    let normalized = text
      .toLowerCase()
      .trim();

    // Language-specific normalization
    if (language === 'zh') {
      // For Chinese, preserve characters but normalize spaces
      normalized = normalized
        .replace(/\s+/g, '')  // Remove all spaces (Chinese doesn't use spaces)
        .replace(/[。，、；：！？""''（）【】]/g, ''); // Remove Chinese punctuation
    } else {
      // For English and Vietnamese
      normalized = normalized
        .replace(/[.,;:!?'"(){}\[\]\-_+=*&^%$#@~`|\\/<>]/g, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Expand contractions (English only)
    if (language === 'en') {
      this.contractionMap.forEach((expansion, contraction) => {
        const regex = new RegExp(`\\b${contraction}\\b`, 'g');
        normalized = normalized.replace(regex, expansion);
      });

      // Handle contractions with apostrophes
      normalized = normalized
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
        .replace(/\bshouldn't\b/g, 'should not');
    }

    return normalized;
  }

  // Calculate advanced similarity with multiple factors
  static calculateAdvancedSimilarity(
    original: string, 
    transcribed: string,
    language: 'en' | 'zh' | 'vi' = 'en'
  ): number {
    const normalizedOriginal = this.normalizeText(original, language);
    const normalizedTranscribed = this.normalizeText(transcribed, language);

    // Perfect match after normalization
    if (normalizedOriginal === normalizedTranscribed) {
      return 1.0;
    }

    // For Chinese, use character-level comparison
    if (language === 'zh') {
      return this.calculateChineseCharacterSimilarity(normalizedOriginal, normalizedTranscribed);
    }

    // Word-level comparison for English and Vietnamese
    const originalWords = normalizedOriginal.split(/\s+/).filter(w => w.length > 0);
    const transcribedWords = normalizedTranscribed.split(/\s+/).filter(w => w.length > 0);

    if (originalWords.length === 0 && transcribedWords.length === 0) {
      return 1.0;
    }

    if (originalWords.length === 0 || transcribedWords.length === 0) {
      return 0.0;
    }

    // Calculate word-level similarity using optimal alignment
    const similarity = this.calculateOptimalAlignment(originalWords, transcribedWords);
    return similarity;
  }

  // Calculate Chinese character-level similarity
  private static calculateChineseCharacterSimilarity(text1: string, text2: string): number {
    if (text1.length === 0 && text2.length === 0) return 1.0;
    if (text1.length === 0 || text2.length === 0) return 0.0;

    const chars1 = Array.from(text1);
    const chars2 = Array.from(text2);
    
    let matches = 0;
    const maxLen = Math.max(chars1.length, chars2.length);
    
    for (let i = 0; i < Math.min(chars1.length, chars2.length); i++) {
      if (chars1[i] === chars2[i]) {
        matches++;
      } else {
        // Check if characters are phonetically similar
        if (this.areChineseCharsSimilar(chars1[i], chars2[i])) {
          matches += 0.8; // Partial credit for similar sounds
        }
      }
    }
    
    return matches / maxLen;
  }

  // Check if Chinese characters are phonetically similar
  private static areChineseCharsSimilar(char1: string, char2: string): boolean {
    for (const [key, variants] of this.chinesePhoneticMap) {
      if ((char1 === key && variants.includes(char2)) ||
          (char2 === key && variants.includes(char1)) ||
          (variants.includes(char1) && variants.includes(char2))) {
        return true;
      }
    }
    return false;
  }

  // Optimal word alignment using dynamic programming
  private static calculateOptimalAlignment(words1: string[], words2: string[]): number {
    const m = words1.length;
    const n = words2.length;

    // DP matrix for maximum similarity
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    // Fill DP matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const word1 = words1[i - 1];
        const word2 = words2[j - 1];
        const wordSimilarity = this.calculateWordSimilarity(word1, word2);

        // Three options: match, skip word1, skip word2
        dp[i][j] = Math.max(
          dp[i - 1][j - 1] + wordSimilarity, // Match
          dp[i - 1][j],                      // Skip word1
          dp[i][j - 1]                       // Skip word2
        );
      }
    }

    // Normalize by the maximum possible score
    const maxPossibleScore = Math.max(m, n);
    return dp[m][n] / maxPossibleScore;
  }

  // Enhanced word similarity calculation
  public static calculateWordSimilarity(word1: string, word2: string): number {
    if (word1 === word2) return 1.0;

    // Check phonetic similarity
    if (this.arePhoneticallySimilar(word1, word2)) {
      return 0.95;
    }

    // Check common speech errors
    if (this.isCommonSpeechError(word1, word2)) {
      return 0.9;
    }

    // Levenshtein distance similarity
    const distance = this.levenshteinDistance(word1, word2);
    const maxLen = Math.max(word1.length, word2.length);

    if (maxLen === 0) return 1.0;

    let similarity = (maxLen - distance) / maxLen;

    // Boost for short words
    if (maxLen <= 3 && distance <= 1) {
      similarity = Math.max(similarity, 0.8);
    }

    // Boost for same starting letter
    if (word1.charAt(0) === word2.charAt(0) && maxLen >= 3) {
      similarity = Math.min(similarity + 0.1, 1.0);
    }

    // Boost for same ending
    if (word1.slice(-2) === word2.slice(-2) && maxLen >= 4) {
      similarity = Math.min(similarity + 0.05, 1.0);
    }

    return similarity;
  }

  // Check phonetic similarity
  private static arePhoneticallySimilar(word1: string, word2: string): boolean {
    for (const [key, variants] of this.phoneticMap) {
      if ((word1 === key && variants.includes(word2)) ||
          (word2 === key && variants.includes(word1)) ||
          (variants.includes(word1) && variants.includes(word2))) {
        return true;
      }
    }
    return false;
  }

  // Check common speech recognition errors
  private static isCommonSpeechError(word1: string, word2: string): boolean {
    const commonSounds: Array<[string, string]> = [
      ['th', 'f'], ['th', 'v'], ['w', 'v'], ['r', 'l'],
      ['b', 'p'], ['d', 't'], ['g', 'k'], ['z', 's'],
      ['j', 'y'], ['ch', 'sh'], ['s', 'sh'], ['n', 'm'],
    ];

    for (const [sound1, sound2] of commonSounds) {
      if ((word1.includes(sound1) && word2.includes(sound2)) ||
          (word1.includes(sound2) && word2.includes(sound1))) {
        
        const replaced1 = word1.replace(sound1, sound2);
        const replaced2 = word2.replace(sound2, sound1);
        
        if (replaced1 === word2 || replaced2 === word1) {
          return true;
        }
      }
    }
    return false;
  }

  // Levenshtein distance calculation
  private static levenshteinDistance(str1: string, str2: string): number {
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

  // Process speech recognition result with context
  static processSpeechResult(
    result: string, 
    expectedText?: string,
    context?: string[]
  ): {
    processed: string;
    confidence: number;
    suggestions: string[];
  } {
    let processed = this.normalizeText(result);
    let confidence = 0.7; // Base confidence
    const suggestions: string[] = [];

    // If we have expected text, use it for context
    if (expectedText) {
      const similarity = this.calculateAdvancedSimilarity(expectedText, processed);
      confidence = Math.max(confidence, similarity);

      // Generate suggestions based on expected text
      const expectedWords = this.normalizeText(expectedText).split(/\s+/);
      const processedWords = processed.split(/\s+/);

      for (let i = 0; i < Math.min(expectedWords.length, processedWords.length); i++) {
        const expected = expectedWords[i];
        const actual = processedWords[i];

        if (expected !== actual) {
          const wordSimilarity = this.calculateWordSimilarity(expected, actual);
          if (wordSimilarity > 0.5) {
            suggestions.push(`"${actual}" might be "${expected}"`);
          }
        }
      }
    }

    return {
      processed,
      confidence,
      suggestions
    };
  }
}
