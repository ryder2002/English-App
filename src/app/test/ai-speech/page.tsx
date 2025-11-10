'use client';

import { useState } from 'react';
import { AISpeechRecorder } from '@/components/ai-speech-recorder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function AISpeechTestPage() {
  const [testText, setTestText] = useState('Hello, how are you today? I hope you are doing well and having a great time.');
  const [results, setResults] = useState<any>(null);

  const handleComplete = (assessment: any, audioBlob: Blob) => {
    console.log('AI Speech assessment complete:', { assessment, audioBlob });
    setResults({ assessment, audioBlob });
  };

  const handleReset = () => {
    setResults(null);
  };

  const presetTexts = {
    english: "The quick brown fox jumps over the lazy dog. This sentence contains many different sounds that help test pronunciation accuracy.",
    chinese: "你好世界，今天天气很好，我们一起学习中文吧。这是一个测试中文发音的句子。",
    vietnamese: "Xin chào, tôi tên là An. Hôm nay trời đẹp quá. Chúng ta cùng học tiếng Việt nhé!"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">🧠 AI Speech Assessment Test</CardTitle>
            <p className="text-purple-100">Advanced pronunciation evaluation powered by AI</p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Test Text:</label>
                <Textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  rows={4}
                  className="w-full border-purple-200 focus:border-purple-500"
                  placeholder="Enter text to practice pronunciation..."
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Quick Start Examples:</label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(presetTexts).map(([key, text]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => setTestText(text)}
                      className="justify-start text-left h-auto py-3 px-4 border-dashed hover:border-purple-400 hover:bg-purple-50"
                    >
                      <div className="text-left">
                        <div className="font-medium capitalize text-purple-700">
                          {key === 'english' ? '🇺🇸 English' : 
                           key === 'chinese' ? '🇨🇳 Chinese' : 
                           '🇻🇳 Vietnamese'}
                        </div>
                        <div className="text-xs text-gray-600 truncate max-w-md">
                          {text.substring(0, 80)}...
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <AISpeechRecorder
          originalText={testText}
          language="en"
          onComplete={handleComplete}
          onReset={handleReset}
        />

        {results && (
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle>📊 Test Results Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Overall Score</h4>
                    <div className="text-3xl font-bold text-blue-600">
                      {results.assessment?.overallScore || 0}/100
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Method Used</h4>
                    <div className="text-lg font-medium text-green-600 capitalize">
                      {results.assessment ? 'AI Assessment' : 'Processing...'}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">What you said:</h4>
                  <div className="text-gray-700 italic">
                    "{results.assessment?.transcription || 'Processing...'}"
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Key Metrics:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>Accuracy: {results.assessment?.accuracy || 0}%</div>
                    <div>Fluency: {results.assessment?.fluency || 0}%</div>
                    <div>Completeness: {results.assessment?.completeness || 0}%</div>
                    <div>Prosody: {results.assessment?.prosody || 0}%</div>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-purple-400 text-purple-600 hover:bg-purple-50"
                  >
                    🔄 Try Another Text
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
