'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, X, Languages, Loader2, Volume2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { AdvancedSpeechRecognizer } from '@/lib/advanced-speech-recognizer';

interface ImprovedSpeechRecognitionProps {
  onTranscript: (transcript: string) => void;
  onClose: () => void;
  defaultLanguage?: string;
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

export function ImprovedSpeechRecognition({ 
  onTranscript, 
  onClose,
  defaultLanguage = 'vi-VN'
}: ImprovedSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(
    SUPPORTED_LANGUAGES.find(l => l.code === defaultLanguage) || SUPPORTED_LANGUAGES[1]
  );
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<string>('');
  
  const recognizerRef = useRef<AdvancedSpeechRecognizer | null>(null);
  const platform = AdvancedSpeechRecognizer.getPlatform();

  useEffect(() => {
    // Detect browser for better error messages
    if (platform.isSamsung) {
      setBrowserInfo('Samsung Internet - Hạn chế hỗ trợ ⚠️');
    } else if (platform.isChrome) {
      setBrowserInfo('Chrome ✅');
    } else if (platform.isEdge) {
      setBrowserInfo('Edge ✅');
    } else if (platform.isSafari) {
      setBrowserInfo('Safari ✅');
    } else {
      const isFirefox = /Firefox/.test(navigator.userAgent);
      if (isFirefox) {
        setBrowserInfo('Firefox - Không hỗ trợ ❌');
      } else {
        setBrowserInfo('Trình duyệt không xác định');
      }
    }
  }, [platform]);

  useEffect(() => {
    return () => {
      if (recognizerRef.current?.isRecording()) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  const startListening = async () => {
    try {
      setError(null);
      setTranscript('');
      
      const recognizer = new AdvancedSpeechRecognizer({
        language: selectedLanguage.code,
        continuous: true,
        interimResults: true,
        onResult: (text) => setTranscript(text),
        onError: (errorMsg) => setError(errorMsg),
        onStart: () => setIsListening(true),
        onEnd: () => setIsListening(false),
        onAudioLevel: (level) => setAudioLevel(level),
      });

      recognizerRef.current = recognizer;
      await recognizer.start();
    } catch (error: any) {
      setError(error.message || 'Không thể bắt đầu ghi âm');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognizerRef.current?.isRecording()) {
      recognizerRef.current.stop();
    }
    setIsListening(false);
  };

  const handleReset = async () => {
    stopListening();
    setError(null);
    setTranscript('');
    await new Promise(resolve => setTimeout(resolve, 300));
    await startListening();
  };

  const handleDone = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      onClose();
    }
  };

  const handleChangeLanguage = async (lang: LanguageOption) => {
    setSelectedLanguage(lang);
    setError(null);
    
    if (recognizerRef.current?.isRecording()) {
      setIsSwitching(true);
      setError(`Chuyển sang ${lang.name}...`);
      
      try {
        await recognizerRef.current.updateLanguage(lang.code);
        setIsSwitching(false);
        setError(null);
      } catch (err) {
        setError(`Lỗi khi chuyển sang ${lang.name}`);
        await handleReset();
      }
    }
  };

  if (!AdvancedSpeechRecognizer.isSupported()) {
    return (
      <Card className="border-2 border-red-300 bg-red-50">
        <CardContent className="p-4">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-600" />
            <p className="text-base font-bold text-red-900 mb-2">❌ Không thể sử dụng</p>
            <p className="text-sm text-red-700 mb-3">
              Trình duyệt này không hỗ trợ chuyển đổi giọng nói thành chữ
            </p>
            
            <div className="bg-white rounded-lg p-3 text-left mb-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">📱 Đang dùng:</p>
              <p className="text-xs text-gray-600 mb-3 font-mono bg-gray-100 px-2 py-1 rounded">
                {browserInfo}
              </p>
              
              <p className="text-xs font-semibold text-gray-700 mb-2">✅ Hãy chuyển sang:</p>
              <ul className="text-xs text-gray-600 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span><strong>Chrome</strong> - Tốt nhất cho Android/Windows/Mac</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span><strong>Safari</strong> - Cho iPhone/iPad/Mac</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span><strong>Microsoft Edge</strong> - Cho Windows</span>
                </li>
              </ul>
            </div>

            {platform.isSamsung && (
              <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-3 text-xs text-orange-900">
                <p className="font-bold mb-1">📱 Samsung Internet</p>
                <p>Vui lòng mở link này trong <strong>Chrome</strong> để sử dụng đầy đủ tính năng</p>
              </div>
            )}

            <Button
              onClick={onClose}
              className="mt-3 w-full"
              variant="outline"
            >
              Đóng
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-300 bg-white shadow-xl max-w-md mx-auto w-full">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg transition-colors ${
              isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
            }`}>
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Voice Input</h3>
              {platform.isMobile && <p className="text-xs text-gray-500">Mobile Optimized</p>}
            </div>
          </div>
          <Button onClick={onClose} size="icon" variant="ghost" className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Language Selector */}
        <div className="flex gap-2 justify-center flex-wrap">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              onClick={() => handleChangeLanguage(lang)}
              size="lg"
              variant={selectedLanguage.code === lang.code ? "default" : "outline"}
              disabled={isSwitching}
              className={`min-h-[44px] px-4 font-semibold ${
                selectedLanguage.code === lang.code 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                  : 'border-2 border-gray-300 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <span className="mr-2 text-xl">{lang.flag}</span>
              <span>{lang.name}</span>
            </Button>
          ))}
        </div>

        {/* Visual Feedback */}
        <div className="min-h-[120px] bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border-2 border-gray-200">
          {isListening ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Volume2 className="h-5 w-5 text-blue-600" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 transition-all duration-100"
                    style={{ width: `${audioLevel * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="text-center">
                {isSwitching ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                    <p className="text-sm font-semibold text-orange-600">Đang chuyển...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <p className="text-sm font-semibold text-red-600">Listening...</p>
                    </div>
                    <p className="text-xs text-gray-600">{selectedLanguage.name}</p>
                  </>
                )}
              </div>

              {/* Waveform */}
              <div className="flex items-center justify-center gap-1 h-12">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-500 rounded-full animate-pulse"
                    style={{
                      height: `${20 + audioLevel * 30 + Math.random() * 20}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Mic className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  {platform.isMobile ? 'Tap Start' : 'Click Start'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="bg-green-50 rounded-xl p-3 border-2 border-green-200 max-h-32 overflow-y-auto">
            <p className="text-sm text-gray-900 break-words leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-700 flex-1">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 justify-center flex-wrap">
          {!isListening ? (
            <Button
              onClick={startListening}
              size="lg"
              className="min-h-[48px] px-6 text-base font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg active:scale-95 transition-transform"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start
            </Button>
          ) : (
            <>
              <Button
                onClick={stopListening}
                size="lg"
                variant="outline"
                className="min-h-[48px] px-6 text-base font-bold border-2 border-gray-400 active:scale-95 transition-transform"
              >
                Stop
              </Button>
              
              {error && (
                <Button
                  onClick={handleReset}
                  size="lg"
                  variant="outline"
                  className="min-h-[48px] px-6 text-base font-bold border-2 border-orange-400 text-orange-600 hover:bg-orange-50 active:scale-95 transition-transform"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              )}
            </>
          )}
          
          {transcript && (
            <Button
              onClick={handleDone}
              size="lg"
              className="min-h-[48px] px-6 text-base font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg active:scale-95 transition-transform"
            >
              Done ✓
            </Button>
          )}
        </div>

        {/* Tips */}
        {platform.isMobile && (
          <div className="text-center text-xs text-gray-500 pt-2 border-t">
            <p>💡 Nói rõ ràng, tránh tiếng ồn</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
