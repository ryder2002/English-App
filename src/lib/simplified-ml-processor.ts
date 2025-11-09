'use client';

export interface SemanticSimilarity {
  score: number;
  confidence: number;
  contextualMatch: number;
  wordOrderSimilarity: number;
  semanticRelatedness: number;
}

export interface MLScoringResult {
  semanticSimilarity: SemanticSimilarity;
  linguisticFeatures: {
    grammarComplexity: number;
    vocabularyLevel: number;
    sentenceStructure: number;
  };
  overallMLScore: number;
  recommendations: string[];
}

export class SimplifiedMLProcessor {
  private wordEmbeddings: Map<string, number[]> = new Map();
  private commonWords: Set<string> = new Set();
  private synonymsMap: Map<string, string[]> = new Map();

  constructor() {
    this.initializeWordData();
  }

  // Initialize basic word data (simplified word embeddings)
  private initializeWordData() {
    // Common English words for basic frequency analysis
    const commonWordsArray = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
      'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
      'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
      'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
      'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'
    ];

    commonWordsArray.forEach(word => this.commonWords.add(word.toLowerCase()));

    // Basic synonym mapping for semantic similarity
    const synonymGroups = [
      ['happy', 'glad', 'joyful', 'cheerful', 'delighted'],
      ['sad', 'unhappy', 'depressed', 'melancholy', 'sorrowful'],
      ['big', 'large', 'huge', 'enormous', 'massive'],
      ['small', 'little', 'tiny', 'petite', 'miniature'],
      ['good', 'great', 'excellent', 'wonderful', 'fantastic'],
      ['bad', 'terrible', 'awful', 'horrible', 'dreadful'],
      ['fast', 'quick', 'rapid', 'speedy', 'swift'],
      ['slow', 'sluggish', 'gradual', 'leisurely'],
      ['beautiful', 'pretty', 'gorgeous', 'stunning', 'lovely'],
      ['ugly', 'hideous', 'unattractive', 'unsightly'],
      ['smart', 'intelligent', 'clever', 'bright', 'brilliant'],
      ['stupid', 'dumb', 'foolish', 'ignorant'],
      ['hot', 'warm', 'heated', 'burning', 'scorching'],
      ['cold', 'cool', 'chilly', 'freezing', 'icy'],
      ['old', 'ancient', 'elderly', 'aged', 'mature'],
      ['young', 'youthful', 'juvenile', 'fresh'],
      ['easy', 'simple', 'effortless', 'straightforward'],
      ['difficult', 'hard', 'challenging', 'tough', 'complex'],
      ['start', 'begin', 'commence', 'initiate'],
      ['end', 'finish', 'complete', 'conclude', 'terminate'],
      ['walk', 'stroll', 'wander', 'march', 'hike'],
      ['run', 'jog', 'sprint', 'dash', 'race'],
      ['eat', 'consume', 'devour', 'dine'],
      ['drink', 'sip', 'gulp', 'swallow'],
      ['speak', 'talk', 'say', 'tell', 'communicate'],
      ['look', 'see', 'watch', 'observe', 'view'],
      ['hear', 'listen', 'perceive'],
      ['think', 'believe', 'consider', 'ponder', 'reflect']
    ];

    synonymGroups.forEach(group => {
      group.forEach(word => {
        this.synonymsMap.set(word.toLowerCase(), group.map(w => w.toLowerCase()));
      });
    });

    // Generate simple word embeddings based on word properties
    this.generateSimpleEmbeddings();
  }

  private generateSimpleEmbeddings() {
    // Generate simple 10-dimensional embeddings based on word characteristics
    const words = [...this.commonWords, ...Array.from(this.synonymsMap.keys())];
    
    words.forEach(word => {
      const embedding = new Array(10).fill(0);
      
      // Dimension 0: Word length
      embedding[0] = Math.min(word.length / 10, 1);
      
      // Dimension 1: Vowel ratio
      const vowels = word.match(/[aeiou]/g) || [];
      embedding[1] = vowels.length / word.length;
      
      // Dimension 2: Common word indicator
      embedding[2] = this.commonWords.has(word) ? 1 : 0;
      
      // Dimension 3: Word complexity (consonant clusters)
      const consonantClusters = word.match(/[bcdfghjklmnpqrstvwxyz]{2,}/g) || [];
      embedding[3] = Math.min(consonantClusters.length / 3, 1);
      
      // Dimension 4-9: Random semantic features (simplified)
      for (let i = 4; i < 10; i++) {
        embedding[i] = Math.sin(word.charCodeAt(0) * i) * 0.5 + 0.5;
      }
      
      this.wordEmbeddings.set(word, embedding);
    });
  }

  // Calculate semantic similarity using simplified ML approach
  calculateSemanticSimilarity(originalText: string, transcribedText: string): SemanticSimilarity {
    const originalWords = this.tokenize(originalText);
    const transcribedWords = this.tokenize(transcribedText);

    // 1. Calculate word-level semantic similarity
    const wordSimilarities = this.calculateWordSimilarities(originalWords, transcribedWords);
    const avgWordSimilarity = wordSimilarities.reduce((a, b) => a + b, 0) / Math.max(wordSimilarities.length, 1);

    // 2. Calculate contextual similarity (word order and structure)
    const contextualMatch = this.calculateContextualSimilarity(originalWords, transcribedWords);

    // 3. Calculate word order similarity
    const wordOrderSimilarity = this.calculateWordOrderSimilarity(originalWords, transcribedWords);

    // 4. Calculate semantic relatedness using synonym mapping
    const semanticRelatedness = this.calculateSemanticRelatedness(originalWords, transcribedWords);

    // 5. Overall semantic score (weighted combination)
    const score = (
      avgWordSimilarity * 0.3 +
      contextualMatch * 0.25 +
      wordOrderSimilarity * 0.2 +
      semanticRelatedness * 0.25
    );

    // 6. Confidence based on text length and coverage
    const confidence = Math.min(
      Math.max(originalWords.length, transcribedWords.length) / 20,
      1
    ) * Math.min(wordSimilarities.length / Math.max(originalWords.length, 1), 1);

    return {
      score: Math.round(score * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      contextualMatch: Math.round(contextualMatch * 100) / 100,
      wordOrderSimilarity: Math.round(wordOrderSimilarity * 100) / 100,
      semanticRelatedness: Math.round(semanticRelatedness * 100) / 100
    };
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private calculateWordSimilarities(words1: string[], words2: string[]): number[] {
    const similarities: number[] = [];

    words1.forEach(word1 => {
      let maxSimilarity = 0;
      
      words2.forEach(word2 => {
        const similarity = this.calculateWordSimilarity(word1, word2);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      });
      
      similarities.push(maxSimilarity);
    });

    return similarities;
  }

  private calculateWordSimilarity(word1: string, word2: string): number {
    if (word1 === word2) return 1.0;

    // Check for synonyms
    const synonyms1 = this.synonymsMap.get(word1) || [];
    if (synonyms1.includes(word2)) return 0.9;

    // Calculate embedding similarity
    const emb1 = this.wordEmbeddings.get(word1);
    const emb2 = this.wordEmbeddings.get(word2);

    if (emb1 && emb2) {
      return this.cosineSimilarity(emb1, emb2);
    }

    // Fallback to edit distance for unknown words
    return this.calculateEditDistanceSimilarity(word1, word2);
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private calculateEditDistanceSimilarity(word1: string, word2: string): number {
    const maxLen = Math.max(word1.length, word2.length);
    if (maxLen === 0) return 1.0;

    const distance = this.levenshteinDistance(word1, word2);
    return Math.max(0, 1 - distance / maxLen);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private calculateContextualSimilarity(words1: string[], words2: string[]): number {
    // Calculate n-gram similarity (bigrams and trigrams)
    const bigrams1 = this.generateNGrams(words1, 2);
    const bigrams2 = this.generateNGrams(words2, 2);
    
    const bigramSimilarity = this.calculateNGramSimilarity(bigrams1, bigrams2);
    
    if (words1.length >= 3 && words2.length >= 3) {
      const trigrams1 = this.generateNGrams(words1, 3);
      const trigrams2 = this.generateNGrams(words2, 3);
      const trigramSimilarity = this.calculateNGramSimilarity(trigrams1, trigrams2);
      
      return (bigramSimilarity + trigramSimilarity) / 2;
    }
    
    return bigramSimilarity;
  }

  private generateNGrams(words: string[], n: number): string[] {
    const ngrams: string[] = [];
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '));
    }
    return ngrams;
  }

  private calculateNGramSimilarity(ngrams1: string[], ngrams2: string[]): number {
    if (ngrams1.length === 0 && ngrams2.length === 0) return 1.0;
    if (ngrams1.length === 0 || ngrams2.length === 0) return 0.0;

    const set1 = new Set(ngrams1);
    const set2 = new Set(ngrams2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    return intersection.size / Math.max(set1.size, set2.size);
  }

  private calculateWordOrderSimilarity(words1: string[], words2: string[]): number {
    // Calculate longest common subsequence
    const lcs = this.longestCommonSubsequence(words1, words2);
    const maxLength = Math.max(words1.length, words2.length);
    
    return maxLength === 0 ? 1.0 : lcs / maxLength;
  }

  private longestCommonSubsequence(words1: string[], words2: string[]): number {
    const m = words1.length;
    const n = words2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (words1[i - 1] === words2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  private calculateSemanticRelatedness(words1: string[], words2: string[]): number {
    let relatedCount = 0;
    let totalComparisons = 0;

    words1.forEach(word1 => {
      words2.forEach(word2 => {
        totalComparisons++;
        
        // Direct match
        if (word1 === word2) {
          relatedCount += 1;
          return;
        }

        // Synonym match
        const synonyms1 = this.synonymsMap.get(word1) || [];
        if (synonyms1.includes(word2)) {
          relatedCount += 0.8;
          return;
        }

        // Semantic category match (simplified)
        if (this.areSemanticallyRelated(word1, word2)) {
          relatedCount += 0.6;
        }
      });
    });

    return totalComparisons === 0 ? 0 : relatedCount / totalComparisons;
  }

  private areSemanticallyRelated(word1: string, word2: string): boolean {
    // Simple semantic relationship detection
    const categories = [
      ['time', 'clock', 'hour', 'minute', 'second', 'day', 'week', 'month', 'year'],
      ['color', 'red', 'blue', 'green', 'yellow', 'black', 'white', 'purple', 'orange'],
      ['family', 'mother', 'father', 'sister', 'brother', 'parent', 'child', 'son', 'daughter'],
      ['food', 'eat', 'meal', 'breakfast', 'lunch', 'dinner', 'restaurant', 'kitchen'],
      ['weather', 'rain', 'sun', 'cloud', 'snow', 'wind', 'storm', 'hot', 'cold'],
      ['emotion', 'happy', 'sad', 'angry', 'fear', 'love', 'hate', 'joy', 'worry'],
      ['body', 'head', 'hand', 'foot', 'eye', 'ear', 'nose', 'mouth', 'arm', 'leg'],
      ['animal', 'dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep'],
      ['transport', 'car', 'bus', 'train', 'plane', 'bike', 'walk', 'drive', 'travel']
    ];

    return categories.some(category => 
      category.includes(word1) && category.includes(word2)
    );
  }

  // Analyze linguistic features
  analyzeLinguisticFeatures(text: string): { grammarComplexity: number; vocabularyLevel: number; sentenceStructure: number; } {
    const words = this.tokenize(text);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Grammar complexity (based on word variety and length)
    const uniqueWords = new Set(words);
    const grammarComplexity = Math.min(
      (uniqueWords.size / Math.max(words.length, 1)) * 
      (words.reduce((sum, word) => sum + word.length, 0) / Math.max(words.length, 1)) / 10,
      1
    );

    // Vocabulary level (based on common vs uncommon words)
    const uncommonWords = words.filter(word => !this.commonWords.has(word));
    const vocabularyLevel = Math.min(uncommonWords.length / Math.max(words.length, 1) * 2, 1);

    // Sentence structure (based on sentence length variety)
    const avgSentenceLength = words.length / Math.max(sentences.length, 1);
    const sentenceStructure = Math.min(avgSentenceLength / 15, 1);

    return {
      grammarComplexity: Math.round(grammarComplexity * 100) / 100,
      vocabularyLevel: Math.round(vocabularyLevel * 100) / 100,
      sentenceStructure: Math.round(sentenceStructure * 100) / 100
    };
  }

  // Generate comprehensive ML-based scoring
  generateMLScore(originalText: string, transcribedText: string): MLScoringResult {
    const semanticSimilarity = this.calculateSemanticSimilarity(originalText, transcribedText);
    const linguisticFeatures = this.analyzeLinguisticFeatures(transcribedText);

    // Calculate overall ML score
    const overallMLScore = Math.round((
      semanticSimilarity.score * 0.4 +
      semanticSimilarity.contextualMatch * 0.2 +
      semanticSimilarity.semanticRelatedness * 0.2 +
      linguisticFeatures.grammarComplexity * 0.1 +
      linguisticFeatures.vocabularyLevel * 0.1
    ) * 100);

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (semanticSimilarity.score < 0.7) {
      recommendations.push('Try to use more words that are semantically similar to the target text');
    }
    
    if (semanticSimilarity.contextualMatch < 0.6) {
      recommendations.push('Focus on maintaining the same word order and sentence structure');
    }
    
    if (semanticSimilarity.semanticRelatedness < 0.5) {
      recommendations.push('Use words that are more contextually related to the topic');
    }
    
    if (linguisticFeatures.vocabularyLevel < 0.3) {
      recommendations.push('Try to incorporate more varied vocabulary');
    }
    
    if (linguisticFeatures.grammarComplexity < 0.4) {
      recommendations.push('Work on using more complex sentence structures');
    }

    if (recommendations.length === 0) {
      recommendations.push('Excellent semantic understanding! Your speech closely matches the meaning of the target text.');
    }

    return {
      semanticSimilarity,
      linguisticFeatures,
      overallMLScore,
      recommendations
    };
  }
}
