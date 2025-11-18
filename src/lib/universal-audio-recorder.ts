/**
 * Universal Audio Recorder
 * Supports: Desktop (Windows, macOS), Mobile (iOS, Android), PWA
 * Uses RecordRTC for cross-platform compatibility
 */

import RecordRTC from 'recordrtc';

export interface AudioRecorderOptions {
  language?: string;
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export class UniversalAudioRecorder {
  private recorder: RecordRTC | null = null;
  private stream: MediaStream | null = null;
  private recognition: any = null;
  private chunks: Blob[] = [];
  private isRecording = false;

  // Detect platform
  private static detectPlatform(): {
    isIOS: boolean;
    isAndroid: boolean;
    isMobile: boolean;
    isPWA: boolean;
  } {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/.test(ua);
    const isMobile = isIOS || isAndroid || /Mobi/.test(ua);
    const isPWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    return { isIOS, isAndroid, isMobile, isPWA };
  }

  // Get optimal audio constraints for platform
  private static getAudioConstraints(): MediaTrackConstraints {
    const platform = UniversalAudioRecorder.detectPlatform();

    if (platform.isIOS) {
      // iOS Safari requires simpler constraints
      return {
        echoCancellation: true,
        noiseSuppression: true,
      };
    } else if (platform.isAndroid) {
      // Android works well with standard constraints
      return {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
    } else {
      // Desktop - full features
      return {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
      };
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(options: AudioRecorderOptions = {}): Promise<void> {
    try {
      console.log('🎤 Starting universal audio recording...');
      const platform = UniversalAudioRecorder.detectPlatform();
      console.log('📱 Platform:', platform);

      // Request microphone permission
      const constraints = UniversalAudioRecorder.getAudioConstraints();
      console.log('🔧 Audio constraints:', constraints);

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: constraints,
      });

      console.log('✅ Microphone access granted');

      // Initialize RecordRTC
      this.recorder = new RecordRTC(this.stream, {
        type: 'audio',
        mimeType: platform.isIOS
          ? 'audio/wav' // iOS Safari prefers WAV
          : 'audio/webm', // Others use WebM
        recorderType: platform.isIOS
          ? RecordRTC.StereoAudioRecorder // iOS compatible
          : undefined, // Auto-detect for others
        numberOfAudioChannels: 1,
        desiredSampRate: 16000, // Good for speech recognition
      });

      // Start recording
      this.recorder.startRecording();
      this.isRecording = true;
      console.log('🎬 Recording started');

      // Initialize Speech Recognition if available
      if (options.language) {
        this.startSpeechRecognition(options.language, options.onTranscript);
      }
    } catch (error: any) {
      console.error('❌ Recording error:', error);
      this.cleanup();

      let errorMessage = 'Failed to start recording';
      if (error.name === 'NotAllowedError') {
        errorMessage = '🔒 Microphone permission denied. Please allow access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '🎤 No microphone found. Please connect a microphone.';
      } else if (error.name === 'NotReadableError') {
        errorMessage =
          '🔧 Microphone is being used by another app. Please close other apps.';
      }

      if (options.onError) {
        options.onError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Initialize Web Speech API for transcription
   */
  private startSpeechRecognition(
    language: string,
    onTranscript?: (transcript: string) => void
  ): void {
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn('⚠️ Speech Recognition not supported');
        return;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = language;
      this.recognition.maxAlternatives = 1;

      let finalTranscript = '';

      this.recognition.onresult = (event: any) => {
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + ' ';
          } else {
            interim += transcriptPart;
          }
        }

        const fullTranscript = (finalTranscript + interim).trim();
        if (onTranscript && fullTranscript) {
          onTranscript(fullTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.warn('🔴 Speech recognition error:', event.error);
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if recording is still active
        if (this.isRecording && this.recognition) {
          try {
            console.log('🔄 Auto-restarting speech recognition...');
            this.recognition.start();
          } catch (e) {
            console.warn('Failed to restart recognition:', e);
          }
        }
      };

      this.recognition.start();
      console.log(`🗣️ Speech recognition started with language: ${language}`);
    } catch (error) {
      console.warn('Speech recognition init failed:', error);
    }
  }

  /**
   * Stop recording and get audio blob
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.recorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      console.log('⏹️ Stopping recording...');

      this.recorder.stopRecording(() => {
        const blob = this.recorder!.getBlob();
        console.log('✅ Recording stopped, blob size:', blob.size);

        this.cleanup();
        resolve(blob);
      });
    });
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Stop speech recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
      this.recognition = null;
    }

    // Stop media stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Destroy recorder
    if (this.recorder) {
      try {
        this.recorder.destroy();
      } catch (e) {
        console.warn('Error destroying recorder:', e);
      }
      this.recorder = null;
    }

    this.isRecording = false;
    console.log('🧹 Cleanup completed');
  }

  /**
   * Update Speech Recognition language without stopping recording
   * Optimized for fast language switching
   */
  updateRecognitionLanguage(
    language: string,
    onTranscript?: (transcript: string) => void
  ): void {
    if (!this.isRecording) {
      console.warn('⚠️ Cannot update language: not recording');
      return;
    }

    console.log(`🔄 Switching recognition language to: ${language}`);

    // Stop existing recognition immediately (no delay)
    if (this.recognition) {
      try {
        this.recognition.onend = null; // Prevent auto-restart during switch
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping old recognition:', e);
      }
      this.recognition = null;
    }

    // Start new recognition with updated language immediately
    // Use setTimeout with 0 to ensure it runs in next tick (prevents timing issues)
    setTimeout(() => {
      this.startSpeechRecognition(language, onTranscript);
      console.log(`✅ Recognition language updated to: ${language}`);
    }, 0);
  }

  /**
   * Check if recording is active
   */
  isActive(): boolean {
    return this.isRecording;
  }

  /**
   * Cancel recording and cleanup
   */
  cancel(): void {
    console.log('❌ Recording cancelled');
    this.cleanup();
  }
}
