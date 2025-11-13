/**
 * Language detection and support utilities
 */

export interface LanguageConfig {
  code: string;
  name: string;
  speechRecognitionCode: string;
  supported: boolean;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  'en': {
    code: 'en',
    name: 'English',
    speechRecognitionCode: 'en-US',
    supported: true
  },
  'zh': {
    code: 'zh',
    name: '中文',
    speechRecognitionCode: 'zh-CN',
    supported: true
  },
  'vi': {
    code: 'vi',
    name: 'Tiếng Việt',
    speechRecognitionCode: 'vi-VN',
    supported: true
  }
};

/**
 * Detect language from text content
 */
export function detectLanguage(text: string): string {
  const cleanText = text.trim();
  
  // Check for Chinese characters
  if (/[\u4e00-\u9fff]/.test(cleanText)) {
    return 'zh';
  }
  
  // Check for Vietnamese characters (with diacritics)
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(cleanText.toLowerCase())) {
    return 'vi';
  }
  
  // Default to English for Latin script
  return 'en';
}

/**
 * Get language configuration
 */
export function getLanguageConfig(languageCode: string): LanguageConfig {
  return SUPPORTED_LANGUAGES[languageCode] || SUPPORTED_LANGUAGES['en'];
}

/**
 * Check if browser supports speech recognition for given language
 */
export function isSpeechRecognitionSupported(languageCode?: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return false;
  
  // If no language specified, just check if API exists
  if (!languageCode) return true;
  
  const config = getLanguageConfig(languageCode);
  return config.supported;
}

/**
 * Normalize text for comparison across languages
 */
export function normalizeTextForLanguage(text: string, languageCode: string): string {
  const cleaned = text.toLowerCase().trim();
  
  switch (languageCode) {
    case 'zh':
      // Remove punctuation but keep Chinese characters
      return cleaned.replace(/[^\u4e00-\u9fff\w\s]/g, '').replace(/\s+/g, ' ');
    
    case 'vi':
      // Handle Vietnamese diacritics
      return cleaned.replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '').replace(/\s+/g, ' ');
    
    default:
      // English and other Latin scripts
      return cleaned.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
  }
}

/**
 * Split text into words for different languages
 */
export function splitTextIntoWords(text: string, languageCode: string): string[] {
  const normalized = normalizeTextForLanguage(text, languageCode);
  
  switch (languageCode) {
    case 'zh':
      // Chinese: each character is typically a word, but also handle spaces
      return normalized.split('').filter(char => char.trim() && char !== ' ');
    
    default:
      // Space-separated languages (English, Vietnamese)
      return normalized.split(/\s+/).filter(word => word.length > 0);
  }
}

/**
 * Calculate word similarity for different languages
 */
export function calculateWordSimilarityForLanguage(
  word1: string, 
  word2: string, 
  languageCode: string
): number {
  const normalizedWord1 = normalizeTextForLanguage(word1, languageCode);
  const normalizedWord2 = normalizeTextForLanguage(word2, languageCode);
  
  if (normalizedWord1 === normalizedWord2) return 1.0;
  
  switch (languageCode) {
    case 'zh':
      // For Chinese, exact match is more important
      return normalizedWord1 === normalizedWord2 ? 1.0 : 0.0;
    
    default:
      // For alphabetic languages (English, Vietnamese), use Levenshtein distance
      return calculateLevenshteinSimilarity(normalizedWord1, normalizedWord2);
  }
}

/**
 * Calculate Levenshtein similarity
 */
function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1.0 : 0.0;
  if (len2 === 0) return 0.0;
  
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
  
  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  
  const distance = matrix[len2][len1];
  const maxLen = Math.max(len1, len2);
  return (maxLen - distance) / maxLen;
}
