'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, X, Languages } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import Image from 'next/image';
import { UniversalAudioRecorder } from '@/lib/universal-audio-recorder';

interface SpeechRecognitionProps {
  onTranscript: (transcript: string) => void;
  onClose: () => void;
}

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en-US', name: 'English', flag: '🇬🇧' },
  { code: 'vi-VN', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
];

export function SpeechRecognition({ onTranscript, onClose }: SpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(SUPPORTED_LANGUAGES[1]); // Default: Vietnamese
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const recorderRef = useRef<UniversalAudioRecorder | null>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Trình duyệt không hỗ trợ Speech Recognition. Vui lòng dùng Chrome hoặc Edge.');
      return;
    }

    setIsSupported(true);
    
    // Cleanup on unmount
    return () => {
      if (recorderRef.current?.isActive()) {
        recorderRef.current.cancel();
      }
    };
  }, []);

  const startListening = async () => {
    try {
      setError(null);
      finalTranscriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      
      // Create new recorder instance
      const recorder = new UniversalAudioRecorder();
      recorderRef.current = recorder;

      // Start recording with transcript callback (no audio saving for AI chat)
      await recorder.startRecording({
        language: selectedLanguage.code,
        onTranscript: (text) => {
          finalTranscriptRef.current = text;
          setTranscript(text);
          
          // Split into final and interim (last few words are interim)
          const words = text.split(' ');
          if (words.length > 2) {
            const finalWords = words.slice(0, -2).join(' ');
            const interimWords = words.slice(-2).join(' ');
            setTranscript(finalWords);
            setInterimTranscript(interimWords);
          } else {
            setInterimTranscript(text);
          }
        },
        onError: (errorMsg) => {
          setError(errorMsg);
          setIsListening(false);
        },
      });

      setIsListening(true);
    } catch (error: any) {
      console.error('Failed to start listening:', error);
      setError(error.message || 'Không thể bắt đầu ghi âm');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      if (recorderRef.current?.isActive()) {
        // Stop recording (we don't need the audio blob for AI chat)
        await recorderRef.current.stopRecording();
      }
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping listening:', error);
      setIsListening(false);
    }
  };

  const handleDone = () => {
    if (transcript) {
      onTranscript(transcript);
      onClose();
    }
  };

  const handleChangeLanguage = async (lang: LanguageOption) => {
    const wasListening = isListening;
    if (wasListening) {
      await stopListening();
    }
    setSelectedLanguage(lang);
    setError(null);
    if (wasListening) {
      setTimeout(() => startListening(), 100);
    }
  };

  if (!isSupported) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardContent className="p-3">
          <div className="text-center text-red-600">
            <p className="text-sm font-semibold">Trình duyệt không hỗ trợ</p>
            <p className="text-xs mt-1">Vui lòng dùng Chrome/Edge</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-blue-300 bg-white shadow-md max-w-md mx-auto w-full">
      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500 rounded-lg">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Voice Input</h3>
            </div>
          </div>
          <Button
            onClick={onClose}
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full hover:bg-gray-100"
          >
            <X className="h-3.5 w-3.5 text-gray-600" />
          </Button>
        </div>

        {/* Compact Language Selector */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              onClick={() => handleChangeLanguage(lang)}
              size="sm"
              variant={selectedLanguage.code === lang.code ? "default" : "outline"}
              className={`h-8 px-2 sm:px-3 text-xs ${
                selectedLanguage.code === lang.code 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="mr-1 sm:mr-1.5 text-sm sm:text-lg">{lang.flag}</span>
              <span className="hidden xs:inline sm:inline">{lang.name}</span>
            </Button>
          ))}
        </div>

        {/* Compact Recording Status */}
        <div className="min-h-[80px] bg-gray-50 rounded-lg p-3 border border-gray-200">
          {isListening ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute inset-0 w-10 h-10 bg-red-400 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-red-600">Listening...</p>
                <p className="text-xs text-gray-500">{selectedLanguage.name}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Mic className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Click Start</p>
              </div>
            </div>
          )}
        </div>

        {/* Compact Transcript Display */}
        {(transcript || interimTranscript) && (
          <div className="bg-green-50 rounded-lg p-2 sm:p-2.5 border border-green-200">
            <p className="text-xs font-semibold text-green-800 mb-1">Text:</p>
            <p className="text-xs sm:text-sm text-gray-900 max-h-16 sm:max-h-20 overflow-y-auto break-words">
              {transcript}
              {interimTranscript && (
                <span className="text-gray-400 italic"> {interimTranscript}</span>
              )}
            </p>
          </div>
        )}

        {/* Compact Error Message */}
        {error && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
            <p className="text-xs text-orange-700">{error}</p>
          </div>
        )}

        {/* Compact Control Buttons */}
        <div className="flex gap-2 justify-center flex-wrap">
          {!isListening ? (
            <Button
              onClick={startListening}
              size="sm"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex-shrink-0"
            >
              <Mic className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
              Start
            </Button>
          ) : (
            <Button
              onClick={stopListening}
              size="sm"
              variant="outline"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 flex-shrink-0"
            >
              Stop
            </Button>
          )}
          
          {transcript && (
            <Button
              onClick={handleDone}
              size="sm"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex-shrink-0"
            >
              Done
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
