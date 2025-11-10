'use client';

import { IntelligentSpeechProcessor } from './intelligent-speech-processor';

export interface RealTimeFeedback {
  word: string;
  status: 'correct' | 'incorrect' | 'partial' | 'extra' | 'missing';
  confidence: number;
  suggestion?: string;
  position: number;
}

export interface SpeechTiming {
  word: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export class RealTimeSpeechAnalyzer {
  private targetWords: string[] = [];
  private targetText: string = '';
  private speechTimings: SpeechTiming[] = [];
  private startTime: number = 0;

  constructor() {
    // All methods from IntelligentSpeechProcessor are static
  }

  // Set target text for comparison
  setTargetText(text: string) {
    this.targetText = text;
    this.targetWords = IntelligentSpeechProcessor.normalizeText(text).split(' ');
  }

  // Start speech timing
  startSpeechTiming() {
    this.startTime = Date.now();
    this.speechTimings = [];
  }

  // Analyze interim transcript (real-time feedback) - IMPROVED ALGORITHM
  analyzeInterimTranscript(interimTranscript: string): RealTimeFeedback[] {
    if (!interimTranscript.trim()) return [];

    const spokenWords = IntelligentSpeechProcessor.normalizeText(interimTranscript).split(' ').filter(w => w.length > 0);
    const feedback: RealTimeFeedback[] = [];

    // IMPROVED: Use best-match algorithm instead of position-based comparison
    const usedTargetIndices = new Set<number>();
    
    // First pass: Find exact and near-exact matches
    spokenWords.forEach((spokenWord, spokenIndex) => {
      let bestMatch = { targetIndex: -1, similarity: 0, targetWord: '' };
      
      // Find best matching target word (not just by position)
      this.targetWords.forEach((targetWord, targetIndex) => {
        if (usedTargetIndices.has(targetIndex)) return;
        
        const similarity = IntelligentSpeechProcessor.calculateWordSimilarity(spokenWord, targetWord);
        if (similarity > bestMatch.similarity) {
          bestMatch = { targetIndex, similarity, targetWord };
        }
      });

      let status: RealTimeFeedback['status'];
      let confidence = bestMatch.similarity;
      let suggestion: string | undefined;

      if (bestMatch.similarity >= 0.9) {
        status = 'correct';
        usedTargetIndices.add(bestMatch.targetIndex);
      } else if (bestMatch.similarity >= 0.7) {
        status = 'partial';
        confidence = bestMatch.similarity * 0.8;
        suggestion = bestMatch.targetWord;
        usedTargetIndices.add(bestMatch.targetIndex);
      } else if (bestMatch.similarity >= 0.5) {
        status = 'incorrect';
        confidence = Math.max(bestMatch.similarity * 0.6, 0.2);
        suggestion = bestMatch.targetWord;
        usedTargetIndices.add(bestMatch.targetIndex);
      } else {
        // Word doesn't match well with any target word
        status = 'extra';
        confidence = 0.3;
        suggestion = undefined;
      }

      feedback.push({
        word: spokenWord,
        status,
        confidence,
        suggestion,
        position: spokenIndex
      });
    });

    // Second pass: Add missing words that weren't matched
    this.targetWords.forEach((targetWord, targetIndex) => {
      if (!usedTargetIndices.has(targetIndex)) {
        feedback.push({
          word: '',
          status: 'missing',
          confidence: 0,
          suggestion: targetWord,
          position: targetIndex
        });
      }
    });

    // Sort feedback by position for display
    return feedback.sort((a, b) => a.position - b.position);
  }

  // Record word timing
  recordWordTiming(word: string, timestamp: number) {
    const duration = timestamp - this.startTime;
    
    if (this.speechTimings.length > 0) {
      const lastTiming = this.speechTimings[this.speechTimings.length - 1];
      lastTiming.endTime = timestamp;
      lastTiming.duration = timestamp - lastTiming.startTime;
    }

    this.speechTimings.push({
      word,
      startTime: timestamp,
      endTime: timestamp,
      duration: 0
    });
  }

  // Analyze speech speed
  analyzeSpeechSpeed(): {
    wordsPerMinute: number;
    averageWordDuration: number;
    speedFeedback: 'too_fast' | 'too_slow' | 'good' | 'unknown';
    recommendation: string;
  } {
    if (this.speechTimings.length < 2) {
      return {
        wordsPerMinute: 0,
        averageWordDuration: 0,
        speedFeedback: 'unknown',
        recommendation: 'Speak more words to analyze speed'
      };
    }

    const totalDuration = (this.speechTimings[this.speechTimings.length - 1].endTime - this.speechTimings[0].startTime) / 1000; // seconds
    const wordsPerMinute = (this.speechTimings.length / totalDuration) * 60;
    
    const totalWordDuration = this.speechTimings.reduce((sum, timing) => sum + timing.duration, 0);
    const averageWordDuration = totalWordDuration / this.speechTimings.length;

    let speedFeedback: 'too_fast' | 'too_slow' | 'good';
    let recommendation: string;

    if (wordsPerMinute > 180) {
      speedFeedback = 'too_fast';
      recommendation = 'Try to speak slower for better pronunciation clarity';
    } else if (wordsPerMinute < 120) {
      speedFeedback = 'too_slow';
      recommendation = 'You can speak a bit faster for more natural flow';
    } else {
      speedFeedback = 'good';
      recommendation = 'Great speaking speed! Keep it up';
    }

    return {
      wordsPerMinute: Math.round(wordsPerMinute),
      averageWordDuration: Math.round(averageWordDuration),
      speedFeedback,
      recommendation
    };
  }

  // Analyze pause patterns
  analyzePausePatterns(): {
    totalPauses: number;
    averagePauseDuration: number;
    longestPause: number;
    pauseFeedback: string;
  } {
    if (this.speechTimings.length < 2) {
      return {
        totalPauses: 0,
        averagePauseDuration: 0,
        longestPause: 0,
        pauseFeedback: 'Need more speech data to analyze pauses'
      };
    }

    const pauses: number[] = [];
    
    for (let i = 1; i < this.speechTimings.length; i++) {
      const pauseDuration = this.speechTimings[i].startTime - this.speechTimings[i - 1].endTime;
      if (pauseDuration > 100) { // Only count pauses longer than 100ms
        pauses.push(pauseDuration);
      }
    }

    const totalPauses = pauses.length;
    const averagePauseDuration = totalPauses > 0 ? pauses.reduce((sum, pause) => sum + pause, 0) / totalPauses : 0;
    const longestPause = totalPauses > 0 ? Math.max(...pauses) : 0;

    let pauseFeedback: string;
    if (averagePauseDuration > 1000) {
      pauseFeedback = 'Try to reduce long pauses between words for better fluency';
    } else if (averagePauseDuration < 200 && totalPauses < 2) {
      pauseFeedback = 'Great fluency! Natural speech rhythm';
    } else {
      pauseFeedback = 'Good pause patterns. Natural speech flow';
    }

    return {
      totalPauses,
      averagePauseDuration: Math.round(averagePauseDuration),
      longestPause: Math.round(longestPause),
      pauseFeedback
    };
  }

  // Generate overall feedback
  generateOverallFeedback(finalTranscript: string): {
    overallScore: number;
    accuracy: number;
    fluency: number;
    speed: number;
    recommendations: string[];
  } {
    const normalizedTranscript = IntelligentSpeechProcessor.normalizeText(finalTranscript);
    const normalizedTarget = IntelligentSpeechProcessor.normalizeText(this.targetText);
    const similarity = IntelligentSpeechProcessor.calculateWordSimilarity(normalizedTranscript, normalizedTarget);
    const speedAnalysis = this.analyzeSpeechSpeed();
    const pauseAnalysis = this.analyzePausePatterns();

    // Calculate scores
    const accuracy = similarity * 100;
    
    let speedScore = 100;
    if (speedAnalysis.speedFeedback === 'too_fast' || speedAnalysis.speedFeedback === 'too_slow') {
      speedScore = 70;
    }

    let fluencyScore = 100;
    if (pauseAnalysis.averagePauseDuration > 1000) {
      fluencyScore = 60;
    } else if (pauseAnalysis.averagePauseDuration > 500) {
      fluencyScore = 80;
    }

    const overallScore = Math.round((accuracy * 0.5 + speedScore * 0.3 + fluencyScore * 0.2));

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (accuracy < 80) {
      recommendations.push('Focus on pronouncing each word clearly');
    }
    
    if (speedAnalysis.speedFeedback === 'too_fast') {
      recommendations.push('Slow down your speech for better clarity');
    } else if (speedAnalysis.speedFeedback === 'too_slow') {
      recommendations.push('Try to speak a bit faster for natural flow');
    }

    if (pauseAnalysis.averagePauseDuration > 1000) {
      recommendations.push('Reduce long pauses between words');
    }

    if (recommendations.length === 0) {
      recommendations.push('Excellent speaking! Keep up the great work!');
    }

    return {
      overallScore,
      accuracy: Math.round(accuracy),
      fluency: Math.round(fluencyScore),
      speed: Math.round(speedScore),
      recommendations
    };
  }

  // Reset analyzer
  reset() {
    this.targetWords = [];
    this.targetText = '';
    this.speechTimings = [];
    this.startTime = 0;
  }
}
