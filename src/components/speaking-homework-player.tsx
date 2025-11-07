"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [hasRecording, setHasRecording] = useState(false);

  const handleRecordingFinished = (audioBlob: Blob, text: string) => {
    console.log('Recording finished:', { audioBlob, text, textLength: text.length });
    setRecordedAudio(audioBlob);
    setTranscribedText(text);
    setHasRecording(true);
  };

  const handleRecordingReset = () => {
    console.log('Recording reset');
    setRecordedAudio(null);
    setTranscribedText('');
    setHasRecording(false);
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
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isSubmitted && !isLocked && (
        <>
          <SpeakingRecorder
            text={speakingText}
            onRecordingFinished={handleRecordingFinished}
            onRecordingReset={handleRecordingReset}
            disabled={isSubmitted || isLocked || isSubmitting}
            maxDuration={180}
            autoSubmit={false}
          />
          
          {/* Submit button - show only when recording is done */}
          {hasRecording && (
            <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
              <p className="text-sm text-muted-foreground">
                ✅ Thu âm hoàn tất! Bạn có thể nghe lại hoặc nộp bài ngay.
              </p>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !recordedAudio || !transcribedText}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Send className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Đang nộp bài...' : '📝 Nộp bài'}
              </Button>
            </div>
          )}
        </>
      )}

      {isSubmitted && (
        <SpeakingResultDisplay
          originalText={speakingText}
          transcribedText={savedTranscribedText || ''}
          score={score || 0}
        />
      )}
    </div>
  );
}
