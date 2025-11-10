'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AudioDebugPage() {
  const [submissionId, setSubmissionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const testAPI = async () => {
    if (!submissionId) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      console.log('🔍 Testing audio API for submission:', submissionId);
      
      const response = await fetch(`/api/homework/submission/${submissionId}/audio`, {
        method: 'GET',
        credentials: 'include',
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', [...response.headers.entries()]);
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (response.ok) {
        setResult(data);
        
        // If we have an audio URL, try to create an audio element
        if (data.audioUrl) {
          const audio = new Audio();
          
          audio.onloadstart = () => console.log('🔄 Audio loadstart');
          audio.oncanplay = () => console.log('✅ Audio can play');
          audio.onerror = (e) => console.error('❌ Audio error:', e);
          
          // Set CORS if needed
          if (data.audioUrl.startsWith('http')) {
            audio.crossOrigin = 'anonymous';
          }
          
          audio.src = data.audioUrl;
          audio.load();
        }
        
      } else {
        setError(`API Error: ${response.status} - ${data.error || 'Unknown error'}`);
      }
      
    } catch (err: any) {
      console.error('💥 Fetch error:', err);
      setError(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🐛 Audio API Debug Tool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter submission ID"
                  value={submissionId}
                  onChange={(e) => setSubmissionId(e.target.value)}
                />
                <Button onClick={testAPI} disabled={loading || !submissionId}>
                  {loading ? 'Testing...' : 'Test API'}
                </Button>
              </div>
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              )}
              
              {result && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <strong>✅ API Success!</strong>
                    <pre className="mt-2 text-sm overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                  
                  {result.audioUrl && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <strong>🎵 Audio Test:</strong>
                      <div className="mt-2">
                        <audio controls className="w-full">
                          <source src={result.audioUrl} type={result.type === 'base64' ? 'audio/webm' : undefined} />
                          Browser doesn't support audio playback.
                        </audio>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        Type: {result.type}<br/>
                        URL length: {result.audioUrl.length} characters<br/>
                        URL preview: {result.audioUrl.substring(0, 100)}...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
              <div><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
              <div><strong>Audio Support:</strong> {typeof Audio !== 'undefined' ? 'Yes' : 'No'}</div>
              <div><strong>WebM Support:</strong> {
                typeof Audio !== 'undefined' && new Audio().canPlayType('audio/webm') ? 
                  new Audio().canPlayType('audio/webm') : 'No'
              }</div>
              <div><strong>MP3 Support:</strong> {
                typeof Audio !== 'undefined' && new Audio().canPlayType('audio/mpeg') ? 
                  new Audio().canPlayType('audio/mpeg') : 'No'
              }</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
