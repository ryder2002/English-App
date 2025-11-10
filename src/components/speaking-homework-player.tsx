"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SpeakingResultDisplay } from '@/components/speaking-result-display';
import { SmartSpeechRecorder } from '@/components/smart-speech-recorder';
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
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [hasRecording, setHasRecording] = useState(false);
  const [wordResults, setWordResults] = useState<any[]>([]);

  const handleSmartRecorderComplete = async (audioBlob: Blob, transcribedText: string, wordResults: any[]) => {
    console.log('Smart recorder complete:', { audioBlob, transcribedText, wordResults });
    setRecordedAudio(audioBlob);
    setTranscribedText(transcribedText);
    setWordResults(wordResults);
    setHasRecording(true);
    
    // Auto-submit
    setIsSubmitting(true);
    try {
      await onSubmitAction(audioBlob, transcribedText, { wordResults });
    } catch (error) {
      console.error('Submit error:', error);
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSmartRecorderReset = () => {
    console.log('Smart recorder reset');
    setRecordedAudio(null);
    setTranscribedText('');
    setWordResults([]);
    setHasRecording(false);
  };

  return (
    <div className="space-y-4">
      {!isSubmitted && !isLocked && (
        <SmartSpeechRecorder
          originalText={speakingText}
          onCompleteAction={handleSmartRecorderComplete}
          onResetAction={handleSmartRecorderReset}
          disabled={isSubmitting}
        />
      )}

      {isSubmitted && (
        <SpeakingResultDisplay
          originalText={speakingText}
          transcribedText={savedTranscribedText || ''}
          score={score || 0}
          submissionId={submissionId}
        />
      )}
    </div>
  );
}
