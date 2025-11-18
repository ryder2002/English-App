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
      console.log('🌐 UserAgent:', navigator.userAgent);
      console.log('🔌 PWA Mode:', platform.isPWA);
      console.log('📍 Protocol:', window.location.protocol);

      // Check if we're on HTTPS or localhost (required for mobile)
      const isSecureContext = window.isSecureContext;
      console.log('🔒 Secure context:', isSecureContext);
      
      if (!isSecureContext) {
        throw new Error('🔴 Microphone access requires HTTPS or localhost');
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('🔴 getUserMedia is not supported in this browser');
      }

      // Check microphone permission state (for debugging)
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('🔒 Microphone permission state:', permissionStatus.state);
        } catch (e) {
          console.log('⚠️ Cannot query microphone permission (not supported on this browser)');
        }
      }

      // Always request microphone permission fresh (critical for PWA)
      const constraints = UniversalAudioRecorder.getAudioConstraints();
      console.log('🔧 Audio constraints:', constraints);

      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: constraints,
        });
      } catch (streamError: any) {
        // If complex constraints fail on mobile, try with minimal constraints
        console.warn('⚠️ Primary constraints failed, trying minimal constraints...', streamError);
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: true, // Just use basic audio
        });
      }

      console.log('✅ Microphone access granted, active tracks:', this.stream.getTracks().length);

      // Initialize RecordRTC
      const recorderOptions: any = {
        type: 'audio',
        numberOfAudioChannels: 1,
        desiredSampRate: 16000, // Good for speech recognition
        bufferSize: 16384, // Larger buffer for mobile stability
        sampleRate: 44100, // Native sample rate
      };

      if (platform.isIOS) {
        // iOS Safari specific settings
        recorderOptions.mimeType = 'audio/wav';
        recorderOptions.recorderType = RecordRTC.StereoAudioRecorder;
        recorderOptions.numberOfAudioChannels = 1; // Mono for iOS
        console.log('📱 Using iOS-optimized settings');
      } else if (platform.isAndroid) {
        // Android specific settings
        recorderOptions.mimeType = 'audio/webm';
        console.log('📱 Using Android-optimized settings');
      } else {
        // Desktop settings
        recorderOptions.mimeType = 'audio/webm';
        console.log('💻 Using desktop settings');
      }

      this.recorder = new RecordRTC(this.stream, recorderOptions);

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
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      this.cleanup();

      let errorMessage = 'Failed to start recording';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = '🔒 Microphone permission denied. Please go to your browser settings and allow microphone access for this site.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = '🎤 No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = '🔧 Microphone is being used by another app. Please close other apps and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = '⚙️ Your device microphone does not meet the requirements. Try updating your browser.';
      } else if (error.name === 'TypeError') {
        errorMessage = '🌐 Microphone access requires HTTPS or localhost. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
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
      let recognitionActive = true;

      this.recognition.onresult = (event: any) => {
        let fullTranscript = '';

        // Combine all results (both final and interim) into one transcript
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + ' ';
          } else {
            fullTranscript = finalTranscript + transcriptPart;
          }
        }

        // Use the combined transcript (or just final if no interim)
        const displayTranscript = fullTranscript || finalTranscript.trim();
        
        if (onTranscript && displayTranscript) {
          onTranscript(displayTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('🔴 Speech recognition error:', event.error);
        
        // Don't restart on critical errors
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          recognitionActive = false;
          console.error('❌ Microphone permission denied or service unavailable');
        }
        
        // Network errors on PWA - try to recover
        if (event.error === 'network' && this.isRecording) {
          console.log('🔄 Network error detected, will auto-restart...');
        }
      };

      this.recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        
        // Auto-restart if recording is still active and no critical error
        if (this.isRecording && this.recognition && recognitionActive) {
          try {
            console.log('🔄 Auto-restarting speech recognition...');
            setTimeout(() => {
              if (this.recognition && this.isRecording) {
                this.recognition.start();
              }
            }, 100); // Small delay to prevent rapid restart issues
          } catch (e) {
            console.warn('⚠️ Failed to restart recognition:', e);
          }
        }
      };

      this.recognition.start();
      console.log(`🗣️ Speech recognition started with language: ${language}`);
    } catch (error) {
      console.warn('⚠️ Speech recognition init failed:', error);
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
        console.warn('⚠️ Error stopping old recognition:', e);
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
   * Resume recording after app comes back from background (PWA fix)
   * Call this when app visibility changes to 'visible'
   */
  resumeIfNeeded(): boolean {
    if (!this.isRecording) {
      return false;
    }

    console.log('🔄 Checking if audio needs to be resumed...');

    // Check if stream tracks are still active
    if (this.stream) {
      const tracks = this.stream.getTracks();
      const allActive = tracks.every(track => track.readyState === 'live');
      
      if (!allActive) {
        console.warn('⚠️ Audio tracks are not active, stream may have been suspended');
        return false;
      }
      
      console.log('✅ Audio stream is still active');
    }

    // Check if speech recognition needs restart
    if (this.recognition) {
      try {
        // Try to restart recognition if it stopped
        console.log('🔄 Restarting speech recognition...');
        this.recognition.start();
        return true;
      } catch (e: any) {
        // If already started, that's fine
        if (e.message && e.message.includes('already started')) {
          console.log('✅ Speech recognition already running');
          return true;
        }
        console.warn('⚠️ Could not restart speech recognition:', e);
        return false;
      }
    }

    return true;
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
