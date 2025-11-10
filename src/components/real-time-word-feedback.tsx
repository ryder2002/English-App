'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, RotateCcw, Send, Play, Pause } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  detectLanguage, 
  getLanguageConfig, 
  isSpeechRecognitionSupported,
  splitTextIntoWords,
  calculateWordSimilarityForLanguage 
} from '@/lib/language-utils';

// Type definitions for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface WordStatus {
  word: string;
  status: 'pending' | 'correct' | 'incorrect' | 'current';
  confidence?: number;
  spokenWord?: string;
}

interface RealTimeWordFeedbackProps {
  originalText: string;
  language?: string;
  onCompleteAction: (audioBlob: Blob, transcribedText: string, wordResults: WordStatus[]) => void;
  onResetAction?: () => void;
  isSubmitted?: boolean;
  disabled?: boolean;
}

// @ts-ignore - Client component with function props
export function RealTimeWordFeedback({
  originalText,
  language = 'auto',
  onCompleteAction,
  onResetAction,
  isSubmitted = false,
  disabled = false
}: RealTimeWordFeedbackProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordStatuses, setWordStatuses] = useState<WordStatus[]>([]);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [overallScore, setOverallScore] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [supportedLanguage, setSupportedLanguage] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize word statuses and detect language
  useEffect(() => {
    const detectedLang = language === 'auto' ? detectLanguage(originalText) : language || 'en';
    setDetectedLanguage(detectedLang);
    
    const supported = isSpeechRecognitionSupported(detectedLang);
    setSupportedLanguage(supported);
    
    const words = splitTextIntoWords(originalText, detectedLang);
    const initialStatuses: WordStatus[] = words.map(word => ({
      word: word,
      status: 'pending'
    }));
    setWordStatuses(initialStatuses);
    setCurrentWordIndex(0);
  }, [originalText, language]);

  // Setup speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Set language based on detected language
    const langConfig = getLanguageConfig(detectedLanguage);
    recognition.lang = langConfig.speechRecognitionCode;
    
    console.log(`🌐 Speech recognition language set to: ${recognition.lang} (detected: ${detectedLanguage})`);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Process the speech for word-by-word feedback
      if (finalTranscript || interimTranscript) {
        processSpokenText(finalTranscript || interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Continue listening
        return;
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isRecording) {
        // Restart recognition if still recording
        try {
          recognition.start();
        } catch (e) {
          console.error('Error restarting recognition:', e);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [originalText, language, isRecording, detectedLanguage]);

  const processSpokenText = (spokenText: string) => {
    const spokenWords = splitTextIntoWords(spokenText, detectedLanguage);
    const lastSpokenWord = spokenWords[spokenWords.length - 1];

    if (!lastSpokenWord) return;

    setWordStatuses(prevStatuses => {
      const newStatuses = [...prevStatuses];
      
      // Find the current word to check
      let checkIndex = currentWordIndex;
      
      // Look for the spoken word in the remaining words
      for (let i = checkIndex; i < newStatuses.length; i++) {
        const originalWord = newStatuses[i].word;
        const similarity = calculateWordSimilarityForLanguage(lastSpokenWord, originalWord, detectedLanguage);
        
        if (similarity > 0.7) {
          // Mark as correct
          newStatuses[i] = {
            ...newStatuses[i],
            status: 'correct',
            confidence: similarity,
            spokenWord: lastSpokenWord
          };
          
          // Mark previous unmatched words as incorrect if we skipped them
          for (let j = checkIndex; j < i; j++) {
            if (newStatuses[j].status === 'pending' || newStatuses[j].status === 'current') {
              newStatuses[j] = {
                ...newStatuses[j],
                status: 'incorrect',
                confidence: 0,
                spokenWord: ''
              };
            }
          }
          
          // Move to next word
          setCurrentWordIndex(i + 1);
          
          // Mark next word as current if exists
          if (i + 1 < newStatuses.length) {
            newStatuses[i + 1] = {
              ...newStatuses[i + 1],
              status: 'current'
            };
          }
          
          break;
        }
      }
      
      return newStatuses;
    });
  };

  // Removed calculateWordSimilarity - using language-aware version from utils

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        
        // Create audio URL for playback
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      }
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    setIsRecording(false);
    
    // Calculate overall score
    const correctWords = wordStatuses.filter(w => w.status === 'correct').length;
    const totalWords = wordStatuses.length;
    const newScore = totalWords > 0 ? (correctWords / totalWords) * 100 : 0;
    setOverallScore(newScore);
  };

  const resetRecording = () => {
    stopRecording();
    setRecordedAudio(null);
    setCurrentWordIndex(0);
    setOverallScore(0);
    setRecordingTime(0);
    setIsPlaying(false);
    
    // Reset word statuses
    const words = splitTextIntoWords(originalText, detectedLanguage);
    const resetStatuses: WordStatus[] = words.map(word => ({
      word: word,
      status: 'pending'
    }));
    setWordStatuses(resetStatuses);
    
    if (onResetAction) onResetAction();
  };

  const handleSubmit = () => {
    if (!recordedAudio) {
      alert('Vui lòng thu âm trước khi nộp bài!');
      return;
    }
    
    const transcribedText = wordStatuses
      .filter(w => w.spokenWord)
      .map(w => w.spokenWord)
      .join(' ');
    
    onCompleteAction(recordedAudio, transcribedText, wordStatuses);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !recordedAudio) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWordClassName = (status: WordStatus['status']) => {
    switch (status) {
      case 'correct':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'incorrect':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'current':
        return 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-400';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🎤 Real-time Speaking Practice</span>
          <div className="flex items-center gap-2">
            {detectedLanguage && (
              <Badge variant="secondary" className="text-xs">
                🌐 {getLanguageConfig(detectedLanguage).name}
              </Badge>
            )}
            {recordedAudio && (
              <Badge variant="outline">
                Score: {Math.round(overallScore)}%
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language support warning */}
        {!supportedLanguage && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <span>⚠️</span>
              <span className="text-sm font-medium">
                Speech recognition may not be fully supported for {getLanguageConfig(detectedLanguage).name}. 
                Results may be less accurate.
              </span>
            </div>
          </div>
        )}

        {/* Original text with word-by-word feedback */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium mb-3">
            📝 Text to read ({getLanguageConfig(detectedLanguage).name}):
          </h3>
          <div className="flex flex-wrap gap-2">
            {wordStatuses.map((wordStatus, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded border text-sm font-medium transition-all duration-300 ${getWordClassName(wordStatus.status)}`}
              >
                {wordStatus.word}
                {wordStatus.confidence && (
                  <span className="ml-1 text-xs opacity-70">
                    ({Math.round(wordStatus.confidence * 100)}%)
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Recording controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={disabled || isSubmitted}
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <MicOff className="h-4 w-4" />
              Stop Recording ({formatTime(recordingTime)})
            </Button>
          )}

          {recordedAudio && (
            <>
              <Button
                onClick={togglePlayback}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>

              <Button
                onClick={resetRecording}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={disabled || isSubmitted}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Submit
              </Button>
            </>
          )}
        </div>

        {/* Status indicators */}
        {isListening && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Listening... Speak clearly into your microphone
            </div>
          </div>
        )}

        {/* Results summary */}
        {recordedAudio && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {wordStatuses.filter(w => w.status === 'correct').length}
              </div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {wordStatuses.filter(w => w.status === 'incorrect').length}
              </div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {wordStatuses.filter(w => w.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        )}

        {/* Hidden audio element for playback */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </CardContent>
    </Card>
  );
}
