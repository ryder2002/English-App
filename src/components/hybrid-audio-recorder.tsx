'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, RotateCcw, Send, Volume2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UniversalAudioRecorder } from '@/lib/universal-audio-recorder';

interface HybridAudioRecorderProps {
  onCompleteAction: (audioBlob: Blob, transcript: string) => void;
  onResetAction: () => void;
  disabled?: boolean;
  referenceText?: string;
  language?: string;
}

export function HybridAudioRecorder({
  onCompleteAction,
  onResetAction,
  disabled = false,
  referenceText = '',
  language = 'en-US',
}: HybridAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const recorderRef = useRef<UniversalAudioRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recorderRef.current?.isActive()) {
        recorderRef.current.cancel();
      }
    };
  }, [audioUrl]);

  // Handle audio playback events
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false);
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
      };
    }
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      
      // Create new recorder instance
      const recorder = new UniversalAudioRecorder();
      recorderRef.current = recorder;

      // Start recording with transcript callback
      await recorder.startRecording({
        language,
        onTranscript: (text) => {
          setTranscript(text);
        },
        onError: (errorMsg) => {
          setError(errorMsg);
        },
      });

      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error starting recording:', error);
      setError(error.message || 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (recorderRef.current?.isActive()) {
        const blob = await recorderRef.current.stopRecording();
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setError('Failed to stop recording');
    }
  };

  const togglePlayAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const reset = () => {
    try {
      // Stop audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Clean up audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // Reset all states
      setAudioBlob(null);
      setAudioUrl(null);
      setTranscript('');
      setIsPlaying(false);
      setRecordingTime(0);
      setError(null);
      
      // Call parent reset callback
      if (onResetAction) {
        onResetAction();
      }
    } catch (error) {
      console.error('Error resetting recorder:', error);
    }
  };

  const handleSubmit = () => {
    if (audioBlob) {
      onCompleteAction(audioBlob, transcript);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Reference Text Card */}
      {referenceText && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Volume2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-2">Read aloud:</p>
                <p className="text-xl leading-relaxed text-blue-900 font-medium">{referenceText}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recording Interface */}
      <Card className={`border-2 transition-all duration-300 ${
        isRecording 
          ? 'border-red-400 bg-gradient-to-br from-red-50 to-pink-50 shadow-lg' 
          : audioBlob 
          ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg' 
          : 'border-gray-300 bg-white'
      }`}>
        <CardContent className="p-8">
          {/* Recording Status */}
          <div className="text-center mb-6">
            {isRecording && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <Mic className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute inset-0 w-16 h-16 bg-red-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">Recording...</p>
                  <p className="text-sm text-red-600 mt-1">Speak clearly into your microphone</p>
                </div>
                <div className="text-4xl font-mono font-bold text-red-700 tracking-wider">
                  {formatTime(recordingTime)}
                </div>
                <Progress value={(recordingTime % 180) / 180 * 100} className="h-2" />
              </div>
            )}
            
            {!isRecording && !audioBlob && (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto border-4 border-gray-300">
                  <Mic className="w-10 h-10 text-gray-400" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-700">Ready to Record</p>
                  <p className="text-sm text-gray-500 mt-1">Click the button below to start</p>
                </div>
              </div>
            )}
            
            {!isRecording && audioBlob && (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto border-4 border-green-400">
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-green-700">Recording Complete!</p>
                  <p className="text-sm text-green-600 mt-1">Duration: {formatTime(recordingTime)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-orange-100 border border-orange-300 rounded-lg">
              <p className="text-sm text-orange-800 text-center">{error}</p>
            </div>
          )}

          {/* Audio Player (Hidden HTML5 element) */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              className="hidden"
            />
          )}

          {/* Control Buttons */}
          <div className="flex gap-3 justify-center">
            {!isRecording && !audioBlob && (
              <Button
                onClick={startRecording}
                disabled={disabled}
                size="lg"
                className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Mic className="w-6 h-6 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={stopRecording}
                size="lg"
                className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Square className="w-6 h-6 mr-2" />
                Stop Recording
              </Button>
            )}

            {!isRecording && audioBlob && (
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={togglePlayAudio}
                  size="lg"
                  variant="outline"
                  className="px-6 py-6 text-base font-semibold border-2 hover:bg-blue-50 transition-all duration-300"
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Play Audio
                    </>
                  )}
                </Button>

                <Button
                  onClick={reset}
                  size="lg"
                  variant="outline"
                  className="px-6 py-6 text-base font-semibold border-2 hover:bg-gray-50 transition-all duration-300"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Re-record
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={disabled}
                  size="lg"
                  className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Send className="w-6 h-6 mr-2" />
                  Submit Recording
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Helper Text */}
      {!isRecording && !audioBlob && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            💡 <strong>Tip:</strong> Make sure you're in a quiet environment for better results
          </p>
        </div>
      )}
    </div>
  );
}
