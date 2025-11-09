"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SpeakingRecorder } from '@/components/speaking-recorder';
import { SpeakingResultDisplay } from '@/components/speaking-result-display';
import { AdvancedSpeechRecognition } from '@/components/advanced-speech-recognition';
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
  const [voiceAnalysis, setVoiceAnalysis] = useState<any>(null);
  const [useAdvancedRecognition, setUseAdvancedRecognition] = useState(true);

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
    console.log('Submit button clicked:', { 
      hasRecordedAudio: !!recordedAudio, 
      hasTranscribedText: !!transcribedText,
      transcribedTextLength: transcribedText?.length || 0,
      hasRecording,
      isSubmitting 
    });

    if (!recordedAudio) {
      alert('Vui lòng thu âm trước khi nộp bài');
      return;
    }

    if (!transcribedText || transcribedText.trim().length === 0) {
      alert('Không thể nhận dạng giọng nói. Vui lòng thử thu âm lại với giọng to và rõ ràng hơn.');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Calling onSubmitAction...');
      await onSubmitAction(recordedAudio, transcribedText);
      console.log('onSubmitAction completed successfully');
    } catch (error) {
      console.error('Submit error:', error);
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvancedRecognitionResult = (transcript: string, confidence: number, analysis?: any) => {
    console.log('Advanced recognition result:', { transcript, confidence, analysis });
    setTranscribedText(transcript);
    setVoiceAnalysis(analysis);
    setHasRecording(true);
  };

  const handleAdvancedRecognitionError = (error: string) => {
    console.error('Advanced recognition error:', error);
  };

  return (
    <div className="space-y-4">
      {!isSubmitted && !isLocked && (
        <>
          {/* Toggle between recognition modes */}
          <div className="flex items-center justify-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-sm font-medium">Recording Mode:</span>
            <Button
              variant={useAdvancedRecognition ? "default" : "outline"}
              size="sm"
              onClick={() => setUseAdvancedRecognition(true)}
            >
              🚀 Advanced AI
            </Button>
            <Button
              variant={!useAdvancedRecognition ? "default" : "outline"}
              size="sm"
              onClick={() => setUseAdvancedRecognition(false)}
            >
              📱 Basic
            </Button>
          </div>

          {useAdvancedRecognition ? (
            <AdvancedSpeechRecognition
              targetText={speakingText}
              onResult={handleAdvancedRecognitionResult}
              onError={handleAdvancedRecognitionError}
              showAdvancedAnalysis={true}
            />
          ) : (
            <SpeakingRecorder
              text={speakingText}
              onRecordingFinished={handleRecordingFinished}
              onRecordingReset={handleRecordingReset}
              disabled={isSubmitted || isLocked || isSubmitting}
              maxDuration={180}
              autoSubmit={false}
            />
          )}
          
          {/* Submit button - show only when recording is done */}
          {hasRecording && (
            <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
              <p className="text-sm text-muted-foreground">
                ✅ Thu âm hoàn tất! Bạn có thể nghe lại hoặc nộp bài ngay.
              </p>
              
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs bg-gray-100 p-2 rounded text-gray-600">
                  Debug: Audio={!!recordedAudio ? 'Yes' : 'No'}, 
                  Text={transcribedText ? `"${transcribedText.substring(0, 20)}..."` : 'None'}, 
                  Length={transcribedText?.length || 0}
                </div>
              )}
              
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !recordedAudio}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Send className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Đang nộp bài...' : '📝 Nộp bài'}
              </Button>
              
              {/* Warning if no transcription */}
              {recordedAudio && (!transcribedText || transcribedText.trim().length === 0) && (
                <p className="text-xs text-amber-600 text-center">
                  ⚠️ Chưa nhận dạng được giọng nói. Vẫn có thể nộp bài nhưng điểm có thể thấp.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {isSubmitted && (
        <SpeakingResultDisplay
          originalText={speakingText}
          transcribedText={savedTranscribedText || ''}
          score={score || 0}
          submissionId={submissionId}
          voiceAnalysis={voiceAnalysis}
        />
      )}
    </div>
  );
}
