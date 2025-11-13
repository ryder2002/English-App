"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TraditionalSpeakingResult } from '@/components/traditional-speaking-result';
import { HybridAudioRecorder } from '@/components/hybrid-audio-recorder';
import { Send, Volume2, RotateCcw, Eye, Play, Pause } from 'lucide-react';

interface SpeakingHomeworkPlayerProps {
  speakingText: string;
  isSubmitted: boolean;
  isLocked: boolean;
  transcribedText?: string;
  score?: number;
  submissionId?: number;
  voiceAnalysis?: any;
  audioUrl?: string;
  onSubmitAction: (audioBlob: Blob, transcript: string) => Promise<void>;
  onRedoAction?: () => Promise<void>;
}

export function SpeakingHomeworkPlayer({
  speakingText,
  isSubmitted,
  isLocked,
  transcribedText: savedTranscribedText,
  score,
  submissionId,
  voiceAnalysis,
  audioUrl,
  onSubmitAction,
  onRedoAction,
}: SpeakingHomeworkPlayerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAssessment, setAiAssessment] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleAudioComplete = async (audioBlob: Blob, transcript: string) => {
    console.log('✅ Audio recorded:', {
      size: audioBlob.size,
      type: audioBlob.type,
      hasTranscript: !!transcript,
      transcriptLength: transcript?.length || 0
    });
    
    try {
      setIsSubmitting(true);
      await onSubmitAction(audioBlob, transcript);
      console.log('✅ Submission successful');
    } catch (error) {
      console.error('❌ Submission failed:', error);
      alert('Failed to submit audio. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    console.log('🔄 Reset recorder');
    setAiAssessment(null);
  };

  const handleRedo = async () => {
    if (onRedoAction) {
      try {
        setIsSubmitting(true);
        await onRedoAction();
        setShowResult(false);
      } catch (error) {
        console.error('❌ Redo failed:', error);
        alert('Failed to reset submission. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioUrl) return;

    if (!audioElement) {
      const audio = new Audio(audioUrl);
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
      audio.play();
    } else {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
    }
  };

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  return (
    <div className="space-y-6">
      {!isSubmitted && !isLocked && (
        <HybridAudioRecorder
          referenceText={speakingText}
          onCompleteAction={handleAudioComplete}
          onResetAction={handleReset}
          disabled={isSubmitting}
          language="en-US"
        />
      )}

      {isSubmitted && (
        <div className="space-y-6">
          {/* Action Buttons - Always visible */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3 justify-center">
                {/* Play Audio Button */}
                {audioUrl && (
                  <Button
                    onClick={toggleAudioPlayback}
                    size="lg"
                    variant="outline"
                    className="px-6 py-6 text-base font-semibold border-2 border-blue-400 hover:bg-blue-100 transition-all duration-300"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Pause Audio
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Play Audio
                      </>
                    )}
                  </Button>
                )}

                {/* View Result Button */}
                <Button
                  onClick={() => setShowResult(!showResult)}
                  size="lg"
                  variant="outline"
                  className="px-6 py-6 text-base font-semibold border-2 border-green-400 hover:bg-green-100 transition-all duration-300"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  {showResult ? 'Ẩn kết quả' : 'Xem bài làm'}
                </Button>

                {/* Redo Button */}
                {onRedoAction && !isLocked && (
                  <Button
                    onClick={handleRedo}
                    size="lg"
                    disabled={isSubmitting}
                    className="px-6 py-6 text-base font-semibold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Làm lại
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Result Display - Toggle visibility */}
          {showResult && (
            <>
              {voiceAnalysis ? (
                <TraditionalSpeakingResult
                  referenceText={speakingText}
                  transcribedText={savedTranscribedText || ''}
                  assessment={voiceAnalysis}
                />
              ) : (
                <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-lg">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-xl font-bold text-blue-900">✅ Submitted Successfully!</p>
                    <p className="text-sm text-blue-700">Đang chấm điểm, vui lòng đợi vài giây...</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Locked Message */}
          {isLocked && (
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 text-center">
                <p className="text-yellow-800 font-semibold">
                  🔒 Bài tập đã đóng, không thể làm lại
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
