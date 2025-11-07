"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Volume2, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpeakingRecorderProps {
  text: string;
  onRecordingCompleteAction?: (audioBlob: Blob, transcribedText: string) => void;
  disabled?: boolean;
  maxDuration?: number; // seconds
  autoSubmit?: boolean; // If false, will not auto-submit after recording
  onRecordingFinished?: (audioBlob: Blob, transcribedText: string) => void; // Called when recording stops
  onRecordingReset?: () => void; // Called when recording is reset
}

export function SpeakingRecorder({
  text,
  onRecordingCompleteAction,
  disabled = false,
  maxDuration = 180, // 3 minutes default
  autoSubmit = false,
  onRecordingFinished,
  onRecordingReset,
}: SpeakingRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState<string>('');
  const [silenceTimeout, setSilenceTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const transcribedTextRef = useRef<string>(''); // Store latest transcribed text

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, [audioURL]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Play sample audio using Web Speech API TTS
  const playSampleAudio = () => {
    if (isPlayingSample) {
      window.speechSynthesis.cancel();
      setIsPlayingSample(false);
      return;
    }

    if ('speechSynthesis' in window) {
      // Wait for voices to load
      const speakWithBestVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a high-quality English voice
        const englishVoices = voices.filter(voice => 
          voice.lang.startsWith('en-') && 
          (voice.name.includes('Natural') || voice.name.includes('Enhanced') || voice.name.includes('Premium'))
        );
        
        if (englishVoices.length > 0) {
          utterance.voice = englishVoices[0];
        } else {
          // Fallback to any English voice
          const fallbackVoice = voices.find(voice => voice.lang.startsWith('en-'));
          if (fallbackVoice) utterance.voice = fallbackVoice;
        }
        
        utterance.lang = 'en-US';
        utterance.rate = 0.8; // Slightly slower for clear pronunciation
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onend = () => setIsPlayingSample(false);
        utterance.onerror = () => setIsPlayingSample(false);
        
        window.speechSynthesis.speak(utterance);
        setIsPlayingSample(true);
      };
      
      // Ensure voices are loaded
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', speakWithBestVoice, { once: true });
      } else {
        speakWithBestVoice();
      }
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimized for speech recognition
          channelCount: 1,   // Mono audio
          sampleSize: 16,    // 16-bit depth
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Get the latest transcribed text from ref
        const finalTranscribedText = transcribedTextRef.current || transcribedText;
        console.log('Recording stopped with text:', finalTranscribedText);

        // Notify parent that recording is finished
        if (onRecordingFinished) {
          onRecordingFinished(blob, finalTranscribedText);
        }

        // Only auto-submit if enabled
        if (autoSubmit && finalTranscribedText && onRecordingCompleteAction) {
          setIsProcessing(true);
          try {
            await onRecordingCompleteAction(blob, finalTranscribedText);
          } catch (error) {
            console.error('Error submitting:', error);
          } finally {
            setIsProcessing(false);
          }
        }
      };

      // Initialize Speech Recognition with improved settings
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        recognition.serviceURI = 'wss://www.google.com/speech-api/full-duplex/v1/up';
        recognition.grammars = null;

        let finalTranscript = '';
        let lastSpeechTime = Date.now();
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript.trim();
            const confidence = result[0].confidence;
            
            // Only accept high confidence results (>0.7) or use best alternative
            let bestTranscript = transcript;
            if (result.length > 1) {
              // Check alternatives if available
              for (let j = 0; j < Math.min(result.length, 3); j++) {
                if (result[j].confidence > 0.8) {
                  bestTranscript = result[j].transcript.trim();
                  break;
                }
              }
            }
            
            if (result.isFinal) {
              // Clean up transcript: remove extra spaces, fix common errors
              const cleanedTranscript = bestTranscript
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/[.!?]+$/, '')
                .trim();
              
              finalTranscript += cleanedTranscript + ' ';
              lastSpeechTime = Date.now();
              
              // Update ref immediately
              transcribedTextRef.current = finalTranscript.trim();
              
              // Reset silence timer
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
              }
              
              // Auto-stop after 3 seconds of silence (increased from 2s)
              silenceTimerRef.current = setTimeout(() => {
                if (Date.now() - lastSpeechTime >= 3000 && isRecording) {
                  console.log('Auto-stopping due to silence');
                  stopRecording();
                }
              }, 3000);
              
            } else {
              // Clean interim results too
              interimTranscript += bestTranscript.toLowerCase().replace(/\s+/g, ' ').trim();
            }
          }
          
          const fullTranscript = (finalTranscript + interimTranscript).trim();
          transcribedTextRef.current = fullTranscript;
          setTranscribedText(fullTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
          console.log('Speech recognition ended');
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setTranscribedText('');

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      
      let errorMessage = 'Không thể truy cập microphone.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = '⚠️ Quyền truy cập microphone bị từ chối.\n\n🔧 Cách khắc phục:\n1. Nhấn vào biểu tượng 🔒 (khóa) bên trái thanh địa chỉ\n2. Tìm "Microphone" và chọn "Allow"\n3. Reload trang (F5)';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'Không tìm thấy microphone.\n\n💡 Bạn có thể sử dụng chế độ nhập text thủ công để test.';
          setShowManualInput(true);
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'Microphone đang được sử dụng bởi ứng dụng khác. Vui lòng đóng các ứng dụng khác và thử lại.';
        }
      }
      
      alert(errorMessage);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording, current transcribed text:', transcribedTextRef.current);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Reset recording
  const resetRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setRecordingTime(0);
    setTranscribedText('');
    transcribedTextRef.current = '';
    chunksRef.current = [];
    
    // Notify parent to reset state
    if (onRecordingReset) {
      onRecordingReset();
    }
  };

  // Play recorded audio with pause support
  const playRecordedAudio = () => {
    if (audioURL) {
      if (audioPlayerRef.current) {
        if (audioPlayerRef.current.paused) {
          audioPlayerRef.current.play();
          setIsPlayingRecorded(true);
        } else {
          audioPlayerRef.current.pause();
          setIsPlayingRecorded(false);
        }
      } else {
        const audio = new Audio(audioURL);
        audioPlayerRef.current = audio;
        
        audio.onended = () => {
          setIsPlayingRecorded(false);
          audioPlayerRef.current = null;
        };
        
        audio.onpause = () => {
          setIsPlayingRecorded(false);
        };
        
        audio.onplay = () => {
          setIsPlayingRecorded(true);
        };
        
        audio.play();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Text to read */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Văn bản cần đọc:
              </h3>
              <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                {text}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={playSampleAudio}
              disabled={disabled || isRecording}
              className={cn(
                "shrink-0",
                isPlayingSample && "bg-primary text-primary-foreground"
              )}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recording controls */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col items-center gap-4">
            {/* Recording time */}
            <div className="text-3xl sm:text-4xl font-mono font-bold">
              {formatTime(recordingTime)}
              {maxDuration && (
                <span className="text-lg sm:text-xl text-muted-foreground ml-2">
                  / {formatTime(maxDuration)}
                </span>
              )}
            </div>

            {/* Recording button */}
            {!audioURL && (
              <div className="flex gap-3">
                {!isRecording ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={startRecording}
                    disabled={disabled}
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-4 border-white"
                  >
                    <div className="flex flex-col items-center">
                      <Mic className="h-8 w-8 sm:h-10 sm:w-10 mb-1" />
                      <span className="text-xs font-bold">REC</span>
                    </div>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    variant="destructive"
                    onClick={stopRecording}
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-full animate-pulse bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg border-4 border-white"
                  >
                    <div className="flex flex-col items-center">
                      <Square className="h-8 w-8 sm:h-10 sm:w-10 mb-1" />
                      <span className="text-xs font-bold">STOP</span>
                    </div>
                  </Button>
                )}
              </div>
            )}

            {/* Playback controls */}
            {audioURL && (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  size="lg"
                  onClick={playRecordedAudio}
                  disabled={disabled || isProcessing}
                  className={cn(
                    "flex-1 sm:flex-none min-w-[120px] sm:min-w-[140px]",
                    isPlayingRecorded 
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg" 
                      : "bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 shadow-md"
                  )}
                >
                  {isPlayingRecorded ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Dừng
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      🎧 Nghe lại
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={resetRecording}
                  disabled={disabled || isProcessing}
                  className="flex-1 sm:flex-none min-w-[120px] sm:min-w-[140px] bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  🔄 Thu lại
                </Button>
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xử lý và nộp bài...</span>
              </div>
            )}

            {/* Transcribed text - Hidden by default, only show if autoSubmit is true */}
            {autoSubmit && transcribedText && (
              <div className="w-full mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Văn bản nhận dạng được:
                </h4>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">
                    {transcribedText || <span className="text-muted-foreground italic">Đang nhận dạng...</span>}
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!isRecording && !audioURL && (
              <div className="text-center space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm sm:text-base text-muted-foreground max-w-md font-medium">
                  🔊 Nhấn <strong>biểu tượng loa</strong> để nghe mẫu
                </p>
                <p className="text-sm sm:text-base text-primary font-bold">
                  🎤 Nhấn nút <strong>REC</strong> để bắt đầu thu âm
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  💡 <strong>Quan trọng:</strong> Cấp quyền microphone trong trình duyệt để thu âm
                </p>
              </div>
            )}

            {isRecording && (
              <p className="text-sm text-destructive text-center animate-pulse">
                🔴 Đang ghi âm... Hãy đọc to và rõ ràng. {autoSubmit && 'Sẽ tự động dừng sau 2 giây im lặng.'}
              </p>
            )}

            {/* Manual input fallback */}
            {showManualInput && !audioURL && (
              <div className="space-y-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  🎤 Không tìm thấy microphone
                </p>
                <p className="text-xs text-muted-foreground">
                  Bạn có thể nhập text thủ công để test tính năng (chỉ dùng khi không có mic)
                </p>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Nhập văn bản bạn muốn test..."
                  className="w-full min-h-[100px] p-3 rounded-md border text-sm"
                  disabled={disabled}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (manualText.trim()) {
                      // Create a dummy audio blob
                      const dummyBlob = new Blob([''], { type: 'audio/webm' });
                      setTranscribedText(manualText);
                      if (onRecordingFinished) {
                        onRecordingFinished(dummyBlob, manualText);
                      }
                      if (autoSubmit && onRecordingCompleteAction) {
                        onRecordingCompleteAction(dummyBlob, manualText);
                      }
                      setAudioURL('dummy');
                    }
                  }}
                  disabled={!manualText.trim() || disabled}
                  className="w-full"
                >
                  Sử dụng text này
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
