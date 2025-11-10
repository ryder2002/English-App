'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Send, RotateCcw, Brain, Play, Pause } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PronunciationAssessment {
  word: string;
  accuracy: number;
  fluency: number;
  completeness: number;
  prosody: number;
  phonemeScores: {
    phoneme: string;
    accuracy: number;
  }[];
}

interface SpeechAssessmentResult {
  transcription: string;
  originalText: string;
  overallScore: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  prosody: number;
  wordAssessments: PronunciationAssessment[];
  feedback: string[];
  suggestions: string[];
}

interface AISpeechRecorderProps {
  originalText: string;
  language?: string;
  onComplete?: (result: SpeechAssessmentResult, audioBlob: Blob) => void;
  onReset?: () => void;
  disabled?: boolean;
}

export function AISpeechRecorder({
  originalText,
  language = 'en',
  onComplete,
  onReset,
  disabled = false
}: AISpeechRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<SpeechAssessmentResult | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error: any) {
      console.error('Error starting recording:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processWithAI = async () => {
    if (!recordedAudio) {
      setError('No audio recorded');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      console.log('🧠 Processing with AI Speech Assessment...');
      
      const formData = new FormData();
      formData.append('audio', recordedAudio, 'speech.webm');
      formData.append('originalText', originalText);
      formData.append('language', language);

      const response = await fetch('/api/speech/assess', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Assessment failed');
      }

      const data = await response.json();
      console.log('✅ AI Assessment result:', data);

      if (data.success && data.assessment) {
        setAssessmentResult(data.assessment);
        onComplete?.(data.assessment, recordedAudio);
      } else {
        throw new Error('Invalid assessment response');
      }

    } catch (error: any) {
      console.error('💥 AI Assessment error:', error);
      setError(`Assessment failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const playRecording = async () => {
    if (!recordedAudio) return;

    try {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
        return;
      }

      const audioUrl = URL.createObjectURL(recordedAudio);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setError('Failed to play audio');
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      setIsPlaying(true);
      
    } catch (error: any) {
      console.error('Playback error:', error);
      setError('Failed to play audio');
    }
  };

  const reset = () => {
    setIsRecording(false);
    setIsProcessing(false);
    setRecordedAudio(null);
    setAssessmentResult(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setError('');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    onReset?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Main Recording Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Speech Assessment
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Powered by AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Original Text Display */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="text-sm font-medium text-gray-600 mb-2">Text to read:</div>
            <div className="text-lg leading-relaxed">{originalText}</div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording && !recordedAudio && (
              <Button
                onClick={startRecording}
                disabled={disabled || isProcessing}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <>
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
                </div>
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  <MicOff className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              </>
            )}

            {recordedAudio && !assessmentResult && (
              <div className="flex gap-2">
                <Button
                  onClick={playRecording}
                  variant="outline"
                  disabled={isProcessing}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <Button
                  onClick={processWithAI}
                  disabled={isProcessing}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      Assess with AI
                    </>
                  )}
                </Button>
                
                <Button onClick={reset} variant="outline">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            )}

            {assessmentResult && (
              <div className="flex gap-2">
                <Button onClick={reset} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button
                  onClick={playRecording}
                  variant="outline"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Play Recording'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assessment Results */}
      {assessmentResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🎯 Assessment Results</span>
              <Badge className={`text-lg px-3 py-1 ${getScoreColor(assessmentResult.overallScore)}`}>
                {assessmentResult.overallScore}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{assessmentResult.accuracy}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
                <Progress value={assessmentResult.accuracy} className="mt-2" />
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{assessmentResult.fluency}%</div>
                <div className="text-sm text-gray-600">Fluency</div>
                <Progress value={assessmentResult.fluency} className="mt-2" />
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{assessmentResult.completeness}%</div>
                <div className="text-sm text-gray-600">Completeness</div>
                <Progress value={assessmentResult.completeness} className="mt-2" />
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{assessmentResult.prosody}%</div>
                <div className="text-sm text-gray-600">Prosody</div>
                <Progress value={assessmentResult.prosody} className="mt-2" />
              </div>
            </div>

            {/* Transcription Comparison */}
            <div className="space-y-2">
              <div className="font-medium">What you said:</div>
              <div className="p-3 bg-blue-50 rounded border text-blue-900">
                {assessmentResult.transcription || '(No speech detected)'}
              </div>
            </div>

            {/* Word-by-Word Analysis */}
            <div className="space-y-2">
              <div className="font-medium">Word Analysis:</div>
              <div className="flex flex-wrap gap-2">
                {assessmentResult.wordAssessments.map((word, index) => (
                  <div
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm ${getScoreColor(word.accuracy)}`}
                    title={`Accuracy: ${word.accuracy}%, Fluency: ${word.fluency}%`}
                  >
                    {word.word} ({word.accuracy}%)
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <div className="font-medium">💬 Feedback:</div>
              <div className="space-y-1">
                {assessmentResult.feedback.map((feedback, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                    {feedback}
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-2">
              <div className="font-medium">💡 Suggestions:</div>
              <div className="space-y-1">
                {assessmentResult.suggestions.map((suggestion, index) => (
                  <div key={index} className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
