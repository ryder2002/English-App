"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TraditionalSpeakingResult } from '@/components/traditional-speaking-result';
import { HybridAudioRecorder } from '@/components/hybrid-audio-recorder';
import { Send } from 'lucide-react';

interface SpeakingHomeworkPlayerProps {
  speakingText: string;
  isSubmitted: boolean;
  isLocked: boolean;
  transcribedText?: string;
  score?: number;
  submissionId?: number;
  voiceAnalysis?: any;
  onSubmitAction: (audioBlob: Blob, transcript: string) => Promise<void>;
}

export function SpeakingHomeworkPlayer({
  speakingText,
  isSubmitted,
  isLocked,
  transcribedText: savedTranscribedText,
  score,
  submissionId,
  voiceAnalysis,
  onSubmitAction,
}: SpeakingHomeworkPlayerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAssessment, setAiAssessment] = useState<any>(null);

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
        </div>
      )}
    </div>
  );
}
