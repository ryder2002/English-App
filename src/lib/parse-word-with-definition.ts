/**
 * Parses a word input that may include synonyms
 * Supports formats like:
 * - "hello = hi" (word with synonym)
 * - "hello - hi" 
 * - "hello : hi"
 * - "hello | hi"
 * - "hello" (without synonym)
 * 
 * When a synonym is detected, it's added to the word for dictionary lookup
 * Example: "hello = hi" becomes "hello, hi" for better AI processing
 */

export interface ParsedWordDefinition {
  word: string;
  synonyms?: string[];
  raw: string;
}

export function parseWordWithDefinition(input: string): ParsedWordDefinition {
  const trimmedInput = input.trim();
  // Tách theo các separator: =, -, :, |
  const separatorRegex = /\s*[=\-:|]\s*/;
  const parts = trimmedInput.split(separatorRegex).map(p => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    return {
      word: parts[0],
      synonyms: parts.slice(1),
      raw: trimmedInput
    };
  }
  return {
    word: trimmedInput,
    raw: trimmedInput
  };
}

/**
 * Parses multiple words, giữ nguyên từng dòng làm từ vựng
 */
export function parseWordsWithDefinitions(input: string): ParsedWordDefinition[] {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => parseWordWithDefinition(line));
}
