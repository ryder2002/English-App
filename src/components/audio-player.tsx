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
      const response = await fetch(`/api/homework/submission/${submissionId}/audio`);
      
      if (!response.ok) {
        throw new Error('Failed to load audio');
      }

      const data = await response.json();
      
      if (data.success && data.audioUrl) {
        setAudioUrl(data.audioUrl);
        console.log('🎵 Audio loaded:', data.type, data.audioUrl.substring(0, 100) + '...');
      } else {
        throw new Error(data.error || 'No audio available');
      }

    } catch (error: any) {
      console.error('Audio loading error:', error);
      setError(error.message || 'Failed to load audio');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize audio element when URL is available
  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setError('Failed to play audio');
        setIsPlaying(false);
      });

      audio.volume = volume;
      audio.muted = isMuted;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
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
      await loadAudio();
      return;
    }

    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      setError('Failed to play audio');
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
          {error}
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
