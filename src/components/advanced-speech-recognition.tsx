'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Volume2, Activity, Brain, Zap, Timer, Award } from 'lucide-react';
import { AudioProcessor } from '@/lib/audio-processor';
import { RealTimeSpeechAnalyzer, RealTimeFeedback } from '@/lib/realtime-speech-analyzer';
import { VoiceAnalyzer, VoiceAnalysis } from '@/lib/voice-analyzer';
import { SimplifiedMLProcessor, MLScoringResult } from '@/lib/simplified-ml-processor';

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface AdvancedSpeechRecognitionProps {
  targetText: string;
  onResult: (transcript: string, confidence: number, analysis?: VoiceAnalysis, mlScore?: MLScoringResult) => void;
  onError: (error: string) => void;
  showAdvancedAnalysis?: boolean;
  enableMLScoring?: boolean;
}

interface TranscriptAlternative {
  transcript: string;
  confidence: number;
}

export function AdvancedSpeechRecognition({ 
  targetText, 
  onResult, 
  onError,
  showAdvancedAnalysis = true,
  enableMLScoring = true
}: AdvancedSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [alternatives, setAlternatives] = useState<TranscriptAlternative[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time analysis states
  const [realtimeFeedback, setRealtimeFeedback] = useState<RealTimeFeedback[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceActive, setVoiceActive] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState(0);
  const [finalAnalysis, setFinalAnalysis] = useState<VoiceAnalysis | null>(null);
  const [mlScoringResult, setMLScoringResult] = useState<MLScoringResult | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const recognitionRef = useRef<any | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const realtimeAnalyzerRef = useRef<RealTimeSpeechAnalyzer | null>(null);
  const voiceAnalyzerRef = useRef<VoiceAnalyzer | null>(null);
  const mlProcessorRef = useRef<SimplifiedMLProcessor | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const isRecognitionSupported = typeof window !== 'undefined' && 
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    // Initialize analyzers
    if (typeof window !== 'undefined') {
      audioProcessorRef.current = new AudioProcessor();
      realtimeAnalyzerRef.current = new RealTimeSpeechAnalyzer();
      voiceAnalyzerRef.current = new VoiceAnalyzer();
      
      if (enableMLScoring) {
        mlProcessorRef.current = new SimplifiedMLProcessor();
      }
      
      // Set target text for real-time analysis
      if (realtimeAnalyzerRef.current) {
        realtimeAnalyzerRef.current.setTargetText(targetText);
      }
    }

    return () => {
      cleanup();
    };
  }, [targetText, enableMLScoring]);

  useEffect(() => {
    // Update audio level and voice activity
    if (audioProcessorRef.current && isListening) {
      const updateAudioMetrics = () => {
        if (audioProcessorRef.current) {
          const level = audioProcessorRef.current.getAudioLevel();
          const active = audioProcessorRef.current.isVoiceActive();
          
          setAudioLevel(level);
          setVoiceActive(active);
        }
        
        if (isListening) {
          requestAnimationFrame(updateAudioMetrics);
        }
      };
      
      updateAudioMetrics();
    }
  }, [isListening]);

  const setupRecognition = async () => {
    if (!isRecognitionSupported) {
      onError('Speech recognition is not supported in this browser');
      return;
    }

    try {
      // Get user media with enhanced audio constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      streamRef.current = stream;

      // Setup audio processing pipeline
      if (audioProcessorRef.current) {
        const processedStream = await audioProcessorRef.current.setupAudioPipeline(stream);
        
        // Start voice analysis
        if (voiceAnalyzerRef.current) {
          await voiceAnalyzerRef.current.startAnalysis(processedStream);
        }
      }

      // Setup speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript('');
        setInterimTranscript('');
        setRealtimeFeedback([]);
        setRecordingTime(0);
        
        // Start timing and analysis
        if (realtimeAnalyzerRef.current) {
          realtimeAnalyzerRef.current.startSpeechTiming();
        }
        
        // Start timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let interimTranscriptText = '';
        let finalTranscriptText = '';
        const alternativesList: TranscriptAlternative[] = [];

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          
          if (result.isFinal) {
            finalTranscriptText += result[0].transcript;
            
            // Collect alternatives
            for (let j = 0; j < Math.min(result.length, 3); j++) {
              alternativesList.push({
                transcript: result[j].transcript,
                confidence: result[j].confidence || 0.5
              });
            }
          } else {
            interimTranscriptText += result[0].transcript;
            
            // Real-time feedback on interim results
            if (realtimeAnalyzerRef.current && interimTranscriptText.trim()) {
              const feedback = realtimeAnalyzerRef.current.analyzeInterimTranscript(interimTranscriptText);
              setRealtimeFeedback(feedback);
              
              // Update speech speed
              const speedAnalysis = realtimeAnalyzerRef.current.analyzeSpeechSpeed();
              setSpeechSpeed(speedAnalysis.wordsPerMinute);
            }
          }
        }

        setInterimTranscript(interimTranscriptText);
        
        if (finalTranscriptText) {
          setTranscript(prev => prev + finalTranscriptText);
          setAlternatives(alternativesList);
          
          const bestConfidence = alternativesList.length > 0 
            ? Math.max(...alternativesList.map(alt => alt.confidence))
            : 0.5;
          setConfidence(bestConfidence);
        }
      };

      recognition.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`);
        onError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        handleStopListening();
      };

      recognition.start();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start speech recognition';
      setError(errorMessage);
      onError(errorMessage);
    }
  };

  const handleStopListening = async () => {
    setIsListening(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Generate comprehensive analysis
    const finalTranscriptText = transcript + interimTranscript;
    
    if (finalTranscriptText.trim() && voiceAnalyzerRef.current && realtimeAnalyzerRef.current) {
      const voiceAnalysis = voiceAnalyzerRef.current.getComprehensiveAnalysis(finalTranscriptText);
      const overallFeedback = realtimeAnalyzerRef.current.generateOverallFeedback(finalTranscriptText);
      
      setFinalAnalysis(voiceAnalysis);
      
      // Generate ML scoring if enabled
      let mlResult: MLScoringResult | undefined;
      if (enableMLScoring && mlProcessorRef.current) {
        mlResult = mlProcessorRef.current.generateMLScore(targetText, finalTranscriptText);
        setMLScoringResult(mlResult);
      }
      
      onResult(finalTranscriptText, confidence, voiceAnalysis, mlResult);
    } else if (finalTranscriptText.trim()) {
      onResult(finalTranscriptText, confidence);
    }

    cleanup();
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioProcessorRef.current) {
      audioProcessorRef.current.cleanup();
    }

    if (voiceAnalyzerRef.current) {
      voiceAnalyzerRef.current.cleanup();
    }

    if (realtimeAnalyzerRef.current) {
      realtimeAnalyzerRef.current.reset();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: RealTimeFeedback['status']) => {
    switch (status) {
      case 'correct': return 'bg-green-500';
      case 'partial': return 'bg-yellow-500';
      case 'incorrect': return 'bg-red-500';
      case 'extra': return 'bg-orange-500';
      case 'missing': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  if (!isRecognitionSupported) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Speech recognition is not supported in this browser. 
              Please use Chrome, Edge, or Safari.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6 space-y-6">
        {/* Target Text Display */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Target Text:</h3>
          <p className="text-blue-800">{targetText}</p>
        </div>

        {/* Recording Controls */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={isListening ? handleStopListening : setupRecognition}
              size="lg"
              variant={isListening ? "destructive" : "default"}
              className="flex items-center space-x-2"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span>{isListening ? 'Stop Recording' : 'Start Recording'}</span>
            </Button>

            {isListening && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Timer className="w-4 h-4" />
                <span>{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          {/* Audio Level Visualization */}
          {isListening && (
            <div className="w-full max-w-md">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm">Audio Level</span>
                {voiceActive && <Badge variant="secondary" className="text-xs">Voice Detected</Badge>}
              </div>
              <Progress value={audioLevel * 100} className="h-2" />
            </div>
          )}
        </div>

        {/* Real-time Analysis */}
        {showAdvancedAnalysis && isListening && realtimeFeedback.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Brain className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Real-time Analysis</h3>
              {speechSpeed > 0 && (
                <Badge variant="outline" className="ml-auto">
                  {speechSpeed} WPM
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {realtimeFeedback.map((feedback, index) => (
                <div
                  key={index}
                  className={`px-2 py-1 rounded text-white text-sm ${getStatusColor(feedback.status)}`}
                  title={`${feedback.status} - Confidence: ${Math.round(feedback.confidence * 100)}%${feedback.suggestion ? ` - Suggestion: ${feedback.suggestion}` : ''}`}
                >
                  {feedback.word || feedback.suggestion || '...'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Transcript */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Your Speech:</h3>
          <div className="min-h-[60px]">
            {(transcript || interimTranscript) ? (
              <p className="text-gray-800">
                <span className="text-black">{transcript}</span>
                <span className="text-gray-500 italic">{interimTranscript}</span>
              </p>
            ) : (
              <p className="text-gray-400 italic">
                {isListening ? 'Listening... speak now!' : 'Click "Start Recording" to begin'}
              </p>
            )}
          </div>
          
          {confidence > 0 && (
            <div className="mt-2">
              <Badge variant={confidence > 0.7 ? "default" : "secondary"}>
                Confidence: {Math.round(confidence * 100)}%
              </Badge>
            </div>
          )}
        </div>

        {/* Alternatives */}
        {alternatives.length > 1 && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Alternative Interpretations:</h3>
            <div className="space-y-1">
              {alternatives.slice(1).map((alt, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-yellow-800">{alt.transcript}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(alt.confidence * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ML Scoring Results */}
        {enableMLScoring && mlScoringResult && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">🧠 AI Semantic Analysis</h3>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700">
                ML Score: {mlScoringResult.overallMLScore}%
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">
                  {Math.round(mlScoringResult.semanticSimilarity.score * 100)}%
                </div>
                <div className="text-sm text-gray-600">Semantic Match</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(mlScoringResult.semanticSimilarity.contextualMatch * 100)}%
                </div>
                <div className="text-sm text-gray-600">Context Match</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(mlScoringResult.linguisticFeatures.vocabularyLevel * 100)}%
                </div>
                <div className="text-sm text-gray-600">Vocabulary</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(mlScoringResult.linguisticFeatures.grammarComplexity * 100)}%
                </div>
                <div className="text-sm text-gray-600">Grammar</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <strong className="text-gray-900">AI Recommendations:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {mlScoringResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-gray-700">{recommendation}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Final Analysis Results */}
        {showAdvancedAnalysis && finalAnalysis && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Award className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Advanced Voice Analysis</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {finalAnalysis.stressPattern.accuracy}%
                </div>
                <div className="text-sm text-gray-600">Stress Pattern</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {finalAnalysis.intonation.naturalness}%
                </div>
                <div className="text-sm text-gray-600">Intonation</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {finalAnalysis.pronunciation.overallClarity}%
                </div>
                <div className="text-sm text-gray-600">Clarity</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {finalAnalysis.emotion.energyLevel}%
                </div>
                <div className="text-sm text-gray-600">Energy Level</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <strong>Stress Pattern:</strong> {finalAnalysis.stressPattern.feedback}
              </div>
              <div>
                <strong>Intonation:</strong> {finalAnalysis.intonation.feedback}
              </div>
              <div>
                <strong>Detected Emotion:</strong> {finalAnalysis.emotion.detectedEmotion}
                <Badge variant="outline" className="ml-2">
                  {Math.round(finalAnalysis.emotion.confidence * 100)}% confidence
                </Badge>
              </div>
              
              {finalAnalysis.pronunciation.suggestions.length > 0 && (
                <div>
                  <strong>Suggestions:</strong>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    {finalAnalysis.pronunciation.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-gray-700">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
