'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AudioPlayer from '@/components/audio-player';

export default function AudioTestPage() {
  const [submissionId, setSubmissionId] = useState('');
  const [testSubmissionId, setTestSubmissionId] = useState<number | null>(null);

  const handleTest = () => {
    const id = parseInt(submissionId);
    if (!isNaN(id)) {
      setTestSubmissionId(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🎵 Audio Player Test</CardTitle>
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
                <Button onClick={handleTest}>Test Audio</Button>
              </div>
              
              {testSubmissionId && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Testing Submission ID: {testSubmissionId}</h3>
                  <AudioPlayer 
                    submissionId={testSubmissionId}
                    autoLoad={true}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔧 Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Browser:</strong> {navigator.userAgent}</div>
              <div><strong>Audio Support:</strong> {typeof Audio !== 'undefined' ? 'Yes' : 'No'}</div>
              <div><strong>WebM Support:</strong> {
                typeof Audio !== 'undefined' && new Audio().canPlayType('audio/webm') !== '' ? 'Yes' : 'No'
              }</div>
              <div><strong>MP3 Support:</strong> {
                typeof Audio !== 'undefined' && new Audio().canPlayType('audio/mpeg') !== '' ? 'Yes' : 'No'
              }</div>
              <div><strong>Current URL:</strong> {window.location.href}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🛠️ Manual API Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={async () => {
                  if (!testSubmissionId) return;
                  
                  try {
                    const response = await fetch(`/api/homework/submission/${testSubmissionId}/audio`);
                    const data = await response.json();
                    console.log('API Response:', data);
                    alert(`API Response: ${JSON.stringify(data, null, 2)}`);
                  } catch (error) {
                    console.error('API Error:', error);
                    alert(`API Error: ${error}`);
                  }
                }}
                disabled={!testSubmissionId}
              >
                Test API Directly
              </Button>
              
              <div className="text-xs text-gray-600">
                Check browser console for detailed logs
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
