'use client';

import React, { useState } from 'react';
import { AdvancedSpeechRecognition } from '@/components/advanced-speech-recognition';
import { SpeakingResultDisplay } from '@/components/speaking-result-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Sparkles } from 'lucide-react';

const DEMO_TEXTS = [
  "Hello, how are you today? I hope you're having a wonderful day!",
  "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
  "I can't believe it's already Friday! Time flies when you're having fun.",
  "What's the weather like today? It looks quite sunny outside.",
  "Technology is advancing rapidly in the twenty-first century."
];

export default function SpeechRecognitionDemo() {
  const [targetText, setTargetText] = useState(DEMO_TEXTS[0]);
  const [results, setResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResult = (transcript: string, confidence: number, analysis?: any, mlScore?: any) => {
    setIsProcessing(false);
    
    const newResult = {
      id: Date.now(),
      targetText,
      transcript,
      confidence,
      analysis,
      mlScore,
      timestamp: new Date().toLocaleString()
    };
    
    setResults(prev => [newResult, ...prev]);
  };

  const handleError = (error: string) => {
    setIsProcessing(false);
    console.error('Recognition error:', error);
  };

  const clearResults = () => {
    setResults([]);
  };

  const selectDemoText = (text: string) => {
    setTargetText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              🎤 Advanced Speech Recognition Demo
            </CardTitle>
            <p className="text-blue-100">
              Test all FREE advanced features: Real-time feedback, Voice analysis, Audio enhancement, Pronunciation scoring
            </p>
          </CardHeader>
        </Card>

        {/* Target Text Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📝 Configure Target Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Demo Texts */}
            <div>
              <h3 className="font-medium mb-2">Quick Demo Texts:</h3>
              <div className="flex flex-wrap gap-2">
                {DEMO_TEXTS.map((text, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => selectDemoText(text)}
                    className={targetText === text ? 'bg-blue-100' : ''}
                  >
                    Demo {index + 1}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Text Input */}
            <div>
              <h3 className="font-medium mb-2">Or enter your own text:</h3>
              <Textarea
                value={targetText}
                onChange={(e) => setTargetText(e.target.value)}
                placeholder="Enter the text you want to practice..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Speech Recognition Component */}
        <AdvancedSpeechRecognition
          targetText={targetText}
          onResult={handleResult}
          onError={handleError}
          showAdvancedAnalysis={true}
          enableMLScoring={true}
        />

        {/* Results History */}
        {results.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">📊 Results History</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearResults}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Clear History
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {results.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {result.timestamp}
                      </Badge>
                      <Badge variant={result.confidence > 0.7 ? "default" : "secondary"}>
                        Confidence: {Math.round(result.confidence * 100)}%
                      </Badge>
                    </div>

                    <SpeakingResultDisplay
                      originalText={result.targetText}
                      transcribedText={result.transcript}
                      score={result.confidence}
                      voiceAnalysis={result.analysis}
                    />
                    
                    {/* ML Scoring Results */}
                    {result.mlScore && (
                      <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                        <h4 className="font-semibold text-emerald-800 mb-2">🧠 AI Semantic Analysis</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-emerald-600">{result.mlScore.overallMLScore}%</div>
                            <div className="text-xs text-gray-600">ML Score</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-blue-600">
                              {Math.round(result.mlScore.semanticSimilarity.score * 100)}%
                            </div>
                            <div className="text-xs text-gray-600">Semantic</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-purple-600">
                              {Math.round(result.mlScore.semanticSimilarity.contextualMatch * 100)}%
                            </div>
                            <div className="text-xs text-gray-600">Context</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-orange-600">
                              {Math.round(result.mlScore.linguisticFeatures.vocabularyLevel * 100)}%
                            </div>
                            <div className="text-xs text-gray-600">Vocab</div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-700">
                          <strong>AI Recommendations:</strong> {result.mlScore.recommendations[0]}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Overview */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">🚀 Advanced Features Included (100% FREE)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="font-semibold text-green-600 mb-2">🎵 Audio Enhancement</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Noise reduction</li>
                  <li>• Dynamic range compression</li>
                  <li>• Voice activity detection</li>
                  <li>• Audio level monitoring</li>
                </ul>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="font-semibold text-blue-600 mb-2">⚡ Real-time Feedback</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Live word-by-word analysis</li>
                  <li>• Speech speed monitoring</li>
                  <li>• Pause pattern detection</li>
                  <li>• Confidence scoring</li>
                </ul>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="font-semibold text-purple-600 mb-2">🧠 Voice Analysis</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Stress pattern analysis</li>
                  <li>• Intonation detection</li>
                  <li>• Pronunciation scoring</li>
                  <li>• Emotion recognition</li>
                </ul>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="font-semibold text-orange-600 mb-2">🎯 Smart Comparison</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Dynamic programming alignment</li>
                  <li>• Phonetic similarity matching</li>
                  <li>• Common speech error handling</li>
                  <li>• Contraction normalization</li>
                </ul>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="font-semibold text-red-600 mb-2">📊 Detailed Scoring</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Multi-factor scoring system</li>
                  <li>• Accuracy percentage</li>
                  <li>• Fluency assessment</li>
                  <li>• Speed evaluation</li>
                </ul>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="font-semibold text-teal-600 mb-2">🎨 Enhanced UI</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Visual feedback indicators</li>
                  <li>• Progress monitoring</li>
                  <li>• Interactive word highlighting</li>
                  <li>• Professional analytics display</li>
                </ul>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="font-semibold text-emerald-600 mb-2">🧠 ML-Based Scoring</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Semantic similarity analysis</li>
                  <li>• Contextual understanding</li>
                  <li>• Vocabulary level assessment</li>
                  <li>• Grammar complexity scoring</li>
                </ul>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="font-semibold text-indigo-600 mb-2">⚡ Advanced Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• N-gram similarity matching</li>
                  <li>• Longest common subsequence</li>
                  <li>• Synonym recognition</li>
                  <li>• Word embedding similarity</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
