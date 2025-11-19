'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, RotateCcw, Send, Volume2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AdvancedSpeechRecognizer } from '@/lib/advanced-speech-recognizer';


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
  const [audioLevel, setAudioLevel] = useState(0);
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = useState(true);
  
  const recognizerRef = useRef<AdvancedSpeechRecognizer | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check speech recognition support on mount
  useEffect(() => {
    const supported = AdvancedSpeechRecognizer.isSupported();
    setSpeechRecognitionAvailable(supported);
    
    if (!supported) {
      const platform = AdvancedSpeechRecognizer.getPlatform();
      let message = '⚠️ Chuyển giọng nói thành chữ không khả dụng. ';
      
      if (platform.isSamsung) {
        message += 'Samsung Internet không hỗ trợ tốt. Hãy dùng Chrome.';
      } else if (platform.isAndroid) {
        message += 'Hãy dùng Chrome trên Android.';
      } else {
        message += 'Hãy dùng Chrome, Edge hoặc Safari.';
      }
      
      message += '\n\n📝 Bạn vẫn ghi âm được, nhưng không có transcript tự động.';
      
      console.warn(message);
    }
  }, []);

  // Auto-resume speech recognition when app returns to foreground (PWA/mobile fix)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isRecording && recognizerRef.current?.isRecording()) {
        console.log('🔄 App returned to foreground - resuming speech recognition');
        try {
          await recognizerRef.current.updateLanguage(language);
          console.log('✅ Speech recognition resumed');
        } catch (e) {
          console.warn('⚠️ Could not resume speech recognition:', e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRecording, language]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recognizerRef.current?.isRecording()) {
        recognizerRef.current.stop();
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
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
      audioChunksRef.current = [];
      
      console.log('🎯 Starting recording with language:', language);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        } 
      });

      // Start MediaRecorder for audio capture
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;

      // Start speech recognition for transcript (if available)
      if (speechRecognitionAvailable) {
        try {
          const recognizer = new AdvancedSpeechRecognizer({
            language,
            continuous: true,
            interimResults: true,
            onResult: (text) => {
              console.log('📝 Transcript:', text);
              setTranscript(text);
            },
            onError: (errorMsg) => {
              console.warn('Speech recognition error:', errorMsg);
              // Don't stop recording on speech errors, just warn
            },
            onAudioLevel: (level) => {
              setAudioLevel(level);
            },
          });

          recognizerRef.current = recognizer;
          await recognizer.start();
          console.log('✅ Speech recognition started');
        } catch (speechError) {
          console.warn('⚠️ Speech recognition failed, continuing with audio-only:', speechError);
          setTranscript('(Speech-to-text không khả dụng - chỉ ghi âm)');
        }
      } else {
        console.log('ℹ️ Speech recognition not available - audio recording only');
        setTranscript('(Chỉ ghi âm - không chuyển đổi giọng nói)');
      }

      console.log('✅ Recording started successfully');
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error starting recording:', error);
      
      let errorMsg = 'Failed to start recording';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone permission denied. Please allow microphone access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setError(errorMsg);
    }
  };

  const stopRecording = async () => {
    try {
      // Stop speech recognition
      if (recognizerRef.current?.isRecording()) {
        recognizerRef.current.stop();
      }
      
      // Stop media recorder
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      setIsRecording(false);
      console.log('✅ Recording stopped');
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
      
      // Clean up audio chunks
      audioChunksRef.current = [];
      
      // Reset all states
      setAudioBlob(null);
      setAudioUrl(null);
      setTranscript('');
      setIsPlaying(false);
      setRecordingTime(0);
      setError(null);
      setAudioLevel(0);
      
      // Call parent reset callback
      onResetAction();
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

  const runDiagnostics = async () => {
    console.log('🔍 Running diagnostics...');
    console.log('Platform:', AdvancedSpeechRecognizer.getPlatform());
    console.log('Speech Recognition:', {
      supported: AdvancedSpeechRecognizer.isSupported(),
      SpeechRecognition: !!(window as any).SpeechRecognition,
      webkitSpeechRecognition: !!(window as any).webkitSpeechRecognition,
    });
    console.log('MediaDevices:', {
      available: !!navigator.mediaDevices,
      getUserMedia: !!navigator.mediaDevices?.getUserMedia,
    });
    console.log('Window:', {
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
    });
    
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      console.log('Audio inputs:', audioInputs.length);
      audioInputs.forEach((device, i) => {
        console.log(`  ${i + 1}. ${device.label || 'Unnamed'}`);
      });
    } catch (e) {
      console.error('Failed to enumerate devices:', e);
    }
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

      {/* Speech Recognition Warning */}
      {!speechRecognitionAvailable && (
        <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-orange-900 mb-1">⚠️ Chế độ chỉ ghi âm</p>
                <p className="text-sm text-orange-800 leading-relaxed mb-2">
                  Trình duyệt này không hỗ trợ chuyển giọng nói thành chữ. Bạn vẫn ghi âm được bình thường.
                </p>
                <div className="bg-white/60 rounded-lg p-2.5 text-xs text-orange-700">
                  <p className="font-semibold mb-1.5">📱 Để có transcript tự động:</p>
                  <ul className="list-none space-y-1">
                    <li>✅ <strong>Chrome</strong> - Android/Windows/Mac</li>
                    <li>✅ <strong>Safari</strong> - iPhone/iPad/Mac</li>
                    <li>✅ <strong>Edge</strong> - Windows</li>
                  </ul>
                </div>
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
                
                {/* Audio Level Indicator */}
                <div className="flex items-center justify-center gap-2">
                  <Volume2 className="h-4 w-4 text-red-600" />
                  <div className="flex-1 max-w-xs h-2 bg-red-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 via-red-500 to-red-600 transition-all duration-100"
                      style={{ width: `${audioLevel * 100}%` }}
                    />
                  </div>
                </div>

                {/* Live Transcript Display */}
                {transcript && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 mb-2">📝 Transcript:</p>
                    <p className="text-base text-gray-900 leading-relaxed">
                      {transcript}
                    </p>
                  </div>
                )}
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
            <div className="mb-4 p-4 bg-orange-100 border-2 border-orange-300 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900 mb-1">Recording Error</p>
                  <p className="text-sm text-orange-800 leading-relaxed">{error}</p>
                  {error.includes('permission') && (
                    <div className="mt-2 p-3 bg-white rounded border border-orange-200">
                      <p className="text-xs font-semibold text-gray-700 mb-1">📱 How to fix:</p>
                      <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                        <li>Tap the address bar and look for a microphone icon 🎤</li>
                        <li>Allow microphone access for this website</li>
                        <li>Reload the page and try again</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
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
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">
            💡 <strong>Tip:</strong> Make sure you're in a quiet environment for better results
          </p>
          {error && (
            <Button
              onClick={runDiagnostics}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              🔍 Run Diagnostics (check console)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
