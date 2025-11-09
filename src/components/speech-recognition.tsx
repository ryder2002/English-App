'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Square } from 'lucide-react';

interface SpeechRecognitionProps {
  onTranscript: (transcript: string, language: string) => void;
  onAudioData?: (audioBlob: Blob) => void;
  placeholder?: string;
  className?: string;
  supportedLanguages?: Array<{
    code: string;
    name: string;
    flag: string;
  }>;
}

// Language configurations for speech recognition
const LANGUAGE_CONFIGS = {
  'en-US': { name: 'English', flag: '🇺🇸', continuous: true },
  'vi-VN': { name: 'Tiếng Việt', flag: '🇻🇳', continuous: true },
  'zh-CN': { name: '中文', flag: '🇨🇳', continuous: true },
};

export default function SpeechRecognition({
  onTranscript,
  onAudioData,
  placeholder = "Click microphone to start speaking...",
  className = "",
  supportedLanguages = [
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'vi-VN', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  ]
}: SpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [error, setError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setError('');
        console.log('🎤 Speech recognition started');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(fullTranscript);
        
        if (finalTranscript) {
          onTranscript(finalTranscript.trim(), selectedLanguage);
          console.log('🗣️ Final transcript:', finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('🎤 Speech recognition ended');
      };
    } else {
      setError('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [selectedLanguage, onTranscript]);

  // Audio level monitoring
  const monitorAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
      
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  };

  // Start recording and recognition
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Setup audio recording
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (onAudioData) {
          onAudioData(audioBlob);
        }
      };

      // Setup audio level monitoring
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      setIsRecording(true);
      mediaRecorderRef.current.start();
      monitorAudioLevel();

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.lang = selectedLanguage;
        recognitionRef.current.start();
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to access microphone');
    }
  };

  // Stop recording and recognition
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setAudioLevel(0);
  };

  const toggleRecording = () => {
    if (isListening || isRecording) {
      stopRecording();
    } else {
      setTranscript('');
      setError('');
      startRecording();
    }
  };

  return (
    <div className={`speech-recognition-container ${className}`}>
      {/* Language Selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelectedLanguage(lang.code)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              selectedLanguage === lang.code
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.name}
          </button>
        ))}
      </div>

      {/* Recording Interface */}
      <div className="relative">
        <div className="flex items-center gap-4">
          {/* Microphone Button */}
          <button
            onClick={toggleRecording}
            disabled={!!error}
            className={`relative p-4 rounded-full transition-all duration-200 ${
              isListening || isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-lg scale-110'
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:scale-105'
            } ${error ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening || isRecording ? (
              <Square className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
            
            {/* Audio Level Indicator */}
            {(isListening || isRecording) && (
              <div className="absolute inset-0 rounded-full">
                <div 
                  className="absolute inset-0 rounded-full bg-red-300 opacity-30 animate-ping"
                  style={{
                    transform: `scale(${1 + audioLevel / 100})`,
                    transition: 'transform 0.1s ease-out'
                  }}
                />
              </div>
            )}
          </button>

          {/* Status Display */}
          <div className="flex-1">
            {error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : isListening ? (
              <div className="text-blue-500 text-sm animate-pulse">
                🎤 Listening in {LANGUAGE_CONFIGS[selectedLanguage as keyof typeof LANGUAGE_CONFIGS]?.name}...
              </div>
            ) : (
              <div className="text-gray-500 text-sm">{placeholder}</div>
            )}
          </div>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Transcript:</div>
            <div className="text-gray-800">{transcript}</div>
          </div>
        )}

        {/* Audio Level Visualizer */}
        {(isListening || isRecording) && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-100 ease-out"
                style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
