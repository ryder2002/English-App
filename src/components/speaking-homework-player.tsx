"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SpeakingResultDisplay } from '@/components/speaking-result-display';
import { SmartSpeechRecorder } from '@/components/smart-speech-recorder';
import { AISpeechRecorder } from '@/components/ai-speech-recorder';
import { Send } from 'lucide-react';

interface SpeakingHomeworkPlayerProps {
  speakingText: string;
  isSubmitted: boolean;
  isLocked: boolean;
  transcribedText?: string;
  score?: number;
  submissionId?: number;
  onSubmitAction: (audioBlob: Blob, transcribedText: string, voiceAnalysis?: any) => Promise<void>;
}

export function SpeakingHomeworkPlayer({
  speakingText,
  isSubmitted,
  isLocked,
  transcribedText: savedTranscribedText,
  score,
  submissionId,
  onSubmitAction,
}: SpeakingHomeworkPlayerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Always use AI Enhanced mode - removed Basic mode and its states
  const [aiAssessment, setAiAssessment] = useState<any>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [wordResults, setWordResults] = useState<any[]>([]);
  const [hasRecording, setHasRecording] = useState(false);

  const handleAIRecorderComplete = async (assessment: any, audioBlob: Blob) => {
    console.log('AI recorder complete:', { assessment, audioBlob });
    setRecordedAudio(audioBlob);
    setTranscribedText(assessment.transcription);
    setAiAssessment(assessment);
    setHasRecording(true);

    // Auto-submit with AI assessment
    try {
      setIsSubmitting(true);
      await onSubmitAction(audioBlob, assessment.transcription, assessment);
      console.log('AI assessment submission successful:', assessment);
    } catch (error) {
      console.error('AI assessment submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIRecorderReset = () => {
    console.log('AI recorder reset');
    setRecordedAudio(null);
    setTranscribedText('');
    setWordResults([]);
    setAiAssessment(null);
    setHasRecording(false);
  };

  return (
    <div className="space-y-4">
      {!isSubmitted && !isLocked && (
        <div className="space-y-4">
          {/* AI Enhanced Only - Removed Basic Mode */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold">🧠 AI Enhanced Recording</div>
                <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  Advanced Analysis
                </div>
              </div>
              <div className="text-sm text-purple-600 font-medium">
                ✨ Intelligent pronunciation assessment with detailed feedback
              </div>
            </div>
          </div>

          {/* AI Recording Interface Only */}
          <AISpeechRecorder
            originalText={speakingText}
            language="en"
            onComplete={handleAIRecorderComplete}
            onReset={handleAIRecorderReset}
            disabled={isSubmitting}
          />
        </div>
      )}

      {isSubmitted && (
        <SpeakingResultDisplay
          originalText={speakingText}
          transcribedText={savedTranscribedText || ''}
          score={score || 0}
          submissionId={submissionId}
          voiceAnalysis={aiAssessment}
        />
      )}
    </div>
  );
}
