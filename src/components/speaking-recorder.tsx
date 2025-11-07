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
}

export function SpeakingRecorder({
  text,
  onRecordingCompleteAction,
  disabled = false,
  maxDuration = 180, // 3 minutes default
  autoSubmit = false,
  onRecordingFinished,
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
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // Slower for learning
      utterance.pitch = 1;
      
      utterance.onend = () => setIsPlayingSample(false);
      utterance.onerror = () => setIsPlayingSample(false);
      
      window.speechSynthesis.speak(utterance);
      setIsPlayingSample(true);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
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

        // Notify parent that recording is finished
        if (onRecordingFinished) {
          onRecordingFinished(blob, transcribedText);
        }

        // Only auto-submit if enabled
        if (autoSubmit && transcribedText && onRecordingCompleteAction) {
          setIsProcessing(true);
          try {
            await onRecordingCompleteAction(blob, transcribedText);
          } catch (error) {
            console.error('Error submitting:', error);
          } finally {
            setIsProcessing(false);
          }
        }
      };

      // Initialize Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalTranscript = '';
        let lastSpeechTime = Date.now();
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
              lastSpeechTime = Date.now();
              
              // Reset silence timer
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
              }
              
              // Auto-stop after 2 seconds of silence
              silenceTimerRef.current = setTimeout(() => {
                if (Date.now() - lastSpeechTime >= 2000 && isRecording) {
                  console.log('Auto-stopping due to silence');
                  stopRecording();
                }
              }, 2000);
              
            } else {
              interimTranscript += transcript;
            }
          }
          
          setTranscribedText(finalTranscript + interimTranscript);
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
    chunksRef.current = [];
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
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-full"
                  >
                    <Mic className="h-6 w-6 sm:h-8 sm:w-8" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    variant="destructive"
                    onClick={stopRecording}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-full animate-pulse"
                  >
                    <Square className="h-6 w-6 sm:h-8 sm:w-8" />
                  </Button>
                )}
              </div>
            )}

            {/* Playback controls */}
            {audioURL && (
              <div className="flex gap-3">
                <Button
                  type="button"
                  size="lg"
                  variant={isPlayingRecorded ? "default" : "outline"}
                  onClick={playRecordedAudio}
                  disabled={disabled || isProcessing}
                >
                  {isPlayingRecorded ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Nghe lại
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={resetRecording}
                  disabled={disabled || isProcessing}
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Thu lại
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
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground max-w-md">
                  Nhấn vào biểu tượng loa để nghe mẫu. Nhấn micro để bắt đầu thu âm.
                </p>
                <p className="text-xs text-muted-foreground">
                  💡 Nếu không bật được mic, hãy cấp quyền trong trình duyệt
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
