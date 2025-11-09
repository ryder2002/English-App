'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  alternatives: string[];
  language: string;
}

interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
}

export function useAdvancedSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    maxAlternatives = 3,
    onResult,
    onError
  } = options;

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      // Enhanced configuration
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;
      recognition.maxAlternatives = maxAlternatives;
      
      // Advanced settings for better accuracy
      if ('webkitSpeechRecognition' in window) {
        recognition.serviceURI = '';
        (recognition as any).audioTrack = true;
        (recognition as any).grammars = new (window as any).webkitSpeechGrammarList();
      }

      recognition.onstart = () => {
        setIsListening(true);
        setError('');
        console.log('🎤 Advanced speech recognition started');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let bestConfidence = 0;
        let allAlternatives: string[] = [];

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0;

          // Collect alternatives
          for (let j = 0; j < Math.min(result.length, maxAlternatives); j++) {
            if (j > 0) {
              allAlternatives.push(result[j].transcript);
            }
          }

          if (result.isFinal) {
            finalTranscript += transcript;
            bestConfidence = Math.max(bestConfidence, confidence);
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        setConfidence(bestConfidence);

        if (finalTranscript && onResult) {
          const enhancedResult = enhanceRecognitionResult({
            transcript: finalTranscript,
            confidence: bestConfidence,
            alternatives: allAlternatives,
            language
          });

          onResult(enhancedResult);
        }
      };

      recognition.onerror = (event: any) => {
        const errorMessage = `Speech recognition error: ${event.error}`;
        console.error(errorMessage);
        setError(errorMessage);
        setIsListening(false);
        
        if (onError) {
          onError(errorMessage);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('🎤 Speech recognition ended');
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [language, continuous, interimResults, maxAlternatives, onResult, onError]);

  // Enhanced result processing
  const enhanceRecognitionResult = (result: SpeechRecognitionResult): SpeechRecognitionResult => {
    let enhanced = result.transcript
      .trim()
      .toLowerCase()
      // Fix common recognition errors
      .replace(/\bdot\b/g, '.')
      .replace(/\bcomma\b/g, ',')
      .replace(/\bquestion mark\b/g, '?')
      .replace(/\bexclamation mark\b/g, '!')
      .replace(/\bperiod\b/g, '.')
      .replace(/\bnew line\b/g, '\n')
      // Fix common phonetic errors
      .replace(/\bfink\b/g, 'think')
      .replace(/\bvat\b/g, 'what')
      .replace(/\bvater\b/g, 'water')
      .replace(/\blice\b/g, 'rice')
      .replace(/\bsee\b(?=\s|$)/g, 'sea')
      .replace(/\btoo\b(?=\s|$)/g, 'to')
      .replace(/\btwo\b(?=\s|$)/g, 'to')
      // Numbers
      .replace(/\bone\b/g, '1')
      .replace(/\btwo\b/g, '2')
      .replace(/\bthree\b/g, '3')
      .replace(/\bfour\b/g, '4')
      .replace(/\bfive\b/g, '5')
      .replace(/\bsix\b/g, '6')
      .replace(/\bseven\b/g, '7')
      .replace(/\beight\b/g, '8')
      .replace(/\bnine\b/g, '9')
      .replace(/\bten\b/g, '10');

    // Use alternatives to improve accuracy
    if (result.alternatives.length > 0) {
      const words = enhanced.split(' ');
      const improvedWords = words.map(word => {
        // Check alternatives for better matches
        for (const alt of result.alternatives) {
          const altWords = alt.toLowerCase().split(' ');
          for (const altWord of altWords) {
            // If alternative word is longer and contains current word, might be better
            if (altWord.length > word.length && 
                (altWord.includes(word) || word.includes(altWord))) {
              const similarity = calculateSimilarity(word, altWord);
              if (similarity > 0.7) {
                return altWord;
              }
            }
          }
        }
        return word;
      });
      enhanced = improvedWords.join(' ');
    }

    return {
      ...result,
      transcript: enhanced,
      confidence: Math.max(result.confidence, 0.1) // Ensure minimum confidence
    };
  };

  const calculateSimilarity = (word1: string, word2: string): number => {
    const longer = word1.length > word2.length ? word1 : word2;
    const shorter = word1.length > word2.length ? word2 : word1;
    
    if (longer.length === 0) return 1;
    
    const distance = levenshteinDistance(word1, word2);
    return (longer.length - distance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
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
  };

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;

    try {
      setTranscript('');
      setError('');
      recognitionRef.current.start();
      
      // Auto-stop after 30 seconds to prevent hanging
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 30000);
      
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setError('Failed to start speech recognition');
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError('');
  }, []);

  return {
    isListening,
    transcript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  };
}
