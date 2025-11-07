"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SpeakingRecorder } from '@/components/speaking-recorder';
import { SpeakingResultDisplay } from '@/components/speaking-result-display';
import { Send } from 'lucide-react';

interface SpeakingHomeworkPlayerProps {
  speakingText: string;
  isSubmitted: boolean;
  isLocked: boolean;
  transcribedText?: string;
  score?: number;
  onSubmitAction: (audioBlob: Blob, transcribedText: string) => Promise<void>;
}

export function SpeakingHomeworkPlayer({
  speakingText,
  isSubmitted,
  isLocked,
  transcribedText: savedTranscribedText,
  score,
  onSubmitAction,
}: SpeakingHomeworkPlayerProps) {
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRecordingComplete = (audioBlob: Blob, text: string) => {
    setRecordedAudio(audioBlob);
    setTranscribedText(text);
  };

  const handleSubmit = async () => {
    if (!recordedAudio || !transcribedText) {
      alert('Vui lòng thu âm trước khi nộp bài');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitAction(recordedAudio, transcribedText);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isSubmitted && !isLocked && (
        <SpeakingRecorder
          text={speakingText}
          onRecordingCompleteAction={handleRecordingComplete}
          disabled={isSubmitted || isLocked}
          maxDuration={180}
        />
      )}

      {!isSubmitted && !isLocked && recordedAudio && transcribedText && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            size="lg"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
          </Button>
        </div>
      )}

      {isSubmitted && (
        <SpeakingResultDisplay
          originalText={speakingText}
          transcribedText={savedTranscribedText || transcribedText || ''}
          score={score || 0}
        />
      )}
    </div>
  );
}
