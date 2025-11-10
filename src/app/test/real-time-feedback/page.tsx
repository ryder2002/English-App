'use client';

import { useState } from 'react';
import { SmartSpeechRecorder } from '@/components/smart-speech-recorder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
// Removed Select imports - no longer needed

export default function SmartSpeechTestPage() {
  const [testText, setTestText] = useState('Hello, how are you today? I hope you are doing well.');
  const [results, setResults] = useState<any>(null);

  const handleComplete = (audioBlob: Blob, transcribedText: string, wordResults: any[]) => {
    console.log('Real-time feedback complete:', { audioBlob, transcribedText, wordResults });
    setResults({ audioBlob, transcribedText, wordResults });
  };

  const handleReset = () => {
    setResults(null);
  };

  const presetTexts = {
    english: "The quick brown fox jumps over the lazy dog. This is a test sentence for English speech recognition.",
    chinese: "你好 世界 今天 天气 很 好 我们 一起 学习 中文",
    vietnamese: "Xin chào tôi là một bài kiểm tra tiếng Việt hôm nay trời đẹp"
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Smart Speech Recorder Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Test Text:</label>
                <Textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Preset Texts:</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(presetTexts).map(([key, text]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => setTestText(text)}
                      className="justify-start text-left h-auto py-2"
                    >
                      <div>
                        <div className="font-medium capitalize">{key}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {text.substring(0, 50)}...
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <SmartSpeechRecorder
          originalText={testText}
          onCompleteAction={handleComplete}
          onResetAction={handleReset}
        />

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>📊 Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Transcribed Text:</h4>
                  <div className="p-3 bg-gray-100 rounded border text-sm">
                    {results.transcribedText || '(No transcription)'}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Word Results:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {results.wordResults?.map((result: any, index: number) => (
                      <div
                        key={index}
                        className={`p-2 rounded border text-sm flex items-center justify-between ${
                          result.status === 'correct' 
                            ? 'bg-green-50 border-green-200' 
                            : result.status === 'incorrect'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <span className="font-medium">{result.word}</span>
                        <div className="text-xs flex items-center gap-2">
                          <span>{result.status}</span>
                          {result.confidence && (
                            <span>({Math.round(result.confidence * 100)}%)</span>
                          )}
                          {result.spokenWord && (
                            <span className="italic">spoke: "{result.spokenWord}"</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Audio:</h4>
                  {results.audioBlob && (
                    <audio controls className="w-full">
                      <source src={URL.createObjectURL(results.audioBlob)} type="audio/webm" />
                      Your browser does not support audio playback.
                    </audio>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
