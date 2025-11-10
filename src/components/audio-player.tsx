'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface AudioPlayerProps {
  submissionId: number;
  className?: string;
  autoLoad?: boolean;
}

export default function AudioPlayer({ 
  submissionId, 
  className = "", 
  autoLoad = false 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load audio data
  const loadAudio = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Loading audio for submission:', submissionId);
      
      const response = await fetch(`/api/homework/submission/${submissionId}/audio`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });
      
      console.log('📡 Audio API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        }
        console.error('❌ Audio API error:', response.status, errorMessage);
        throw new Error(`Failed to load audio: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('📦 Audio API response data:', data);
      
      if (data.success && data.audioUrl) {
        setAudioUrl(data.audioUrl);
        console.log('✅ Audio loaded successfully:', data.type, data.audioUrl.substring(0, 100) + '...');
      } else {
        console.error('❌ Invalid audio response:', data);
        throw new Error(data.error || 'No audio available');
      }

    } catch (error: any) {
      console.error('💥 Audio loading error:', error);
      setError(`Audio loading failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize audio element when URL is available
  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      console.log('🎵 Initializing audio element with URL:', audioUrl.substring(0, 100) + '...');
      
      try {
        const audio = new Audio();
        
        // Set CORS for external URLs (R2 storage)
        // Try anonymous first, then fallback
        if (audioUrl.startsWith('http')) {
          audio.crossOrigin = 'anonymous';
        }
        
        audioRef.current = audio;

        audio.addEventListener('loadedmetadata', () => {
          console.log('📊 Audio metadata loaded, duration:', audio.duration);
          setDuration(audio.duration);
        });

        audio.addEventListener('timeupdate', () => {
          setCurrentTime(audio.currentTime);
        });

        audio.addEventListener('ended', () => {
          console.log('🏁 Audio playback ended');
          setIsPlaying(false);
          setCurrentTime(0);
        });

        audio.addEventListener('error', async (e) => {
          console.error('💥 Audio playback error:', e);
          const audioError = audio.error;
          let errorMessage = 'Failed to play audio';
          
          if (audioError) {
            switch (audioError.code) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMessage = 'Audio playback was aborted';
                break;
              case MediaError.MEDIA_ERR_NETWORK:
                errorMessage = 'Network error - trying fallback method';
                // Try different approaches to fix CORS
                if (audioUrl.startsWith('http')) {
                  console.log('🔄 Trying fallback methods...');
                  try {
                    // First try without CORS
                    if (audio.crossOrigin) {
                      console.log('🔄 Retrying without CORS...');
                      audio.crossOrigin = null;
                      audio.load();
                      return;
                    } else {
                      // If that fails, try to fetch via our API proxy
                      console.log('🔄 Trying API proxy...');
                      setAudioUrl(`/api/homework/submission/${submissionId}/audio/proxy`);
                      return;
                    }
                  } catch (retryError) {
                    console.error('💥 Retry failed:', retryError);
                  }
                }
                break;
              case MediaError.MEDIA_ERR_DECODE:
                errorMessage = 'Audio file is corrupted or unsupported format';
                break;
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'Audio format not supported by browser';
                break;
              default:
                errorMessage = `Audio error: ${audioError.message || 'Unknown error'}`;
            }
          }
          
          setError(errorMessage);
          setIsPlaying(false);
        });

        audio.addEventListener('canplay', () => {
          console.log('✅ Audio can start playing');
        });

        audio.addEventListener('loadstart', () => {
          console.log('🔄 Audio loading started');
        });

        audio.addEventListener('progress', () => {
          console.log('📈 Audio loading progress');
        });

        audio.volume = volume;
        audio.muted = isMuted;
        
        // Load the audio source
        audio.src = audioUrl;
        audio.load();
        
      } catch (err) {
        console.error('💥 Error initializing audio:', err);
        setError('Failed to initialize audio player');
      }
    }

    return () => {
      if (audioRef.current) {
        console.log('🧹 Cleaning up audio element');
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  // Auto-load audio on component mount
  useEffect(() => {
    if (autoLoad) {
      loadAudio();
    }
  }, [autoLoad, submissionId]);

  // Play/pause toggle
  const togglePlayback = async () => {
    if (!audioUrl) {
      console.log('🔄 No audio URL, loading audio first...');
      await loadAudio();
      return;
    }

    if (!audioRef.current) {
      console.log('❌ No audio element available');
      setError('Audio player not initialized');
      return;
    }

    try {
      if (isPlaying) {
        console.log('⏸️ Pausing audio');
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('▶️ Starting audio playback');
        
        // Clear any previous errors
        setError('');
        
        // Check if audio is ready
        if (audioRef.current.readyState < 2) {
          console.log('⏳ Audio not ready, waiting...');
          setError('Audio is loading, please wait...');
          
          // Wait for audio to be ready
          await new Promise((resolve, reject) => {
            const audio = audioRef.current!;
            
            const onCanPlay = () => {
              audio.removeEventListener('canplay', onCanPlay);
              audio.removeEventListener('error', onError);
              resolve(void 0);
            };
            
            const onError = (e: Event) => {
              audio.removeEventListener('canplay', onCanPlay);
              audio.removeEventListener('error', onError);
              reject(new Error('Audio failed to load'));
            };
            
            audio.addEventListener('canplay', onCanPlay);
            audio.addEventListener('error', onError);
            
            // Timeout after 10 seconds
            setTimeout(() => {
              audio.removeEventListener('canplay', onCanPlay);
              audio.removeEventListener('error', onError);
              reject(new Error('Audio loading timeout'));
            }, 10000);
          });
        }
        
        // Try to play
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          await playPromise;
        }
        
        setIsPlaying(true);
        setError('');
        console.log('✅ Audio playback started successfully');
      }
    } catch (error: any) {
      console.error('💥 Playback error:', error);
      
      let errorMessage = 'Failed to play audio';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Browser blocked audio playback. Please interact with the page first.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Audio format not supported by your browser';
      } else if (error.message) {
        errorMessage = `Playback error: ${error.message}`;
      }
      
      setError(errorMessage);
      setIsPlaying(false);
    }
  };

  // Restart audio
  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  // Volume control
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Mute toggle
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  // Seek to position
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Format time display
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`audio-player bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="text-red-500 text-sm mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
          <div className="font-medium">Audio Error:</div>
          <div>{error}</div>
          {!audioUrl && (
            <Button
              onClick={loadAudio}
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={isLoading}
            >
              Retry Loading
            </Button>
          )}
        </div>
      )}

      {/* Debug Info (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
          <div>Submission ID: {submissionId}</div>
          <div>Audio URL: {audioUrl ? (audioUrl.length > 100 ? audioUrl.substring(0, 100) + '...' : audioUrl) : 'None'}</div>
          <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
          <div>Audio Element: {audioRef.current ? 'Ready' : 'Not Ready'}</div>
          {audioRef.current && (
            <div>Ready State: {audioRef.current.readyState} / 4</div>
          )}
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-center gap-3 mb-3">
        {/* Play/Pause Button */}
        <Button
          onClick={togglePlayback}
          disabled={isLoading}
          size="sm"
          className="rounded-full w-10 h-10 p-0"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </Button>

        {/* Restart Button */}
        <Button
          onClick={restartAudio}
          disabled={!audioUrl || isLoading}
          size="sm"
          variant="outline"
          className="w-8 h-8 p-0"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>

        {/* Time Display */}
        <div className="text-sm text-gray-600 dark:text-gray-400 min-w-[4rem]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            onClick={toggleMute}
            size="sm"
            variant="ghost"
            className="w-8 h-8 p-0"
            disabled={!audioUrl}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            disabled={!audioUrl}
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div 
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative overflow-hidden"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-100"
          style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
        />
        
        {/* Hover indicator */}
        <div className="absolute inset-0 hover:bg-gray-300/20 dark:hover:bg-gray-600/20 rounded-full" />
      </div>

      {/* Load Button (if not auto-loaded) */}
      {!autoLoad && !audioUrl && (
        <div className="mt-3 text-center">
          <Button
            onClick={loadAudio}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? 'Loading...' : 'Load Audio'}
          </Button>
        </div>
      )}
    </div>
  );
}
