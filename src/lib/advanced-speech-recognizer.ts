/**
 * Universal Speech Recognizer - Optimized for Mobile & Desktop
 * Single source of truth for all speech recognition in the app
 */

export interface SpeechRecognizerConfig {
  language: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onAudioLevel?: (level: number) => void;
}

export class AdvancedSpeechRecognizer {
  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  
  private config: Required<SpeechRecognizerConfig>;
  private isActive = false;
  private restartCount = 0;
  private maxRestarts = 10;
  private finalTranscript = '';
  private audioLevelInterval: any = null;
  
  // Platform detection
  private static platform = {
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isMobile: /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent),
    isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
    isChrome: /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),
    isEdge: /Edg/.test(navigator.userAgent),
    isSamsung: /SamsungBrowser/.test(navigator.userAgent),
  };

  static isSupported(): boolean {
    const hasSpeechRecognition = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
    
    if (!hasSpeechRecognition) {
      console.warn('❌ Speech Recognition API not available');
      return false;
    }

    // Samsung Internet Browser has poor Speech Recognition support
    if (this.platform.isSamsung) {
      console.warn('⚠️ Samsung Internet detected - Please use Chrome for better experience');
      return false;
    }

    // Firefox doesn't support Speech Recognition at all
    const isFirefox = /Firefox/.test(navigator.userAgent);
    if (isFirefox) {
      console.warn('⚠️ Firefox detected - Speech Recognition not supported. Please use Chrome/Edge/Safari.');
      return false;
    }

    // Log successful detection
    let browserName = 'Unknown';
    if (this.platform.isChrome) browserName = 'Chrome';
    else if (this.platform.isEdge) browserName = 'Edge';
    else if (this.platform.isSafari) browserName = 'Safari';

    let platformName = 'Desktop';
    if (this.platform.isIOS) platformName = 'iOS';
    else if (this.platform.isAndroid) platformName = 'Android';

    console.log('✅ Speech Recognition supported:', {
      browser: browserName,
      platform: platformName,
      API: (window as any).SpeechRecognition ? 'SpeechRecognition' : 'webkitSpeechRecognition',
    });

    return true;
  }

  constructor(config: SpeechRecognizerConfig) {
    this.config = {
      language: config.language || 'en-US',
      continuous: config.continuous ?? true,
      interimResults: config.interimResults ?? true,
      onResult: config.onResult || (() => {}),
      onError: config.onError || (() => {}),
      onStart: config.onStart || (() => {}),
      onEnd: config.onEnd || (() => {}),
      onAudioLevel: config.onAudioLevel || (() => {}),
    };
  }

  async start(): Promise<void> {
    if (this.isActive) return;

    try {
      await this.initAudioContext();
      await this.initSpeechRecognition();
      
      this.isActive = true;
      this.restartCount = 0;
      this.finalTranscript = '';
      
      this.startAudioLevelMonitoring();
      this.recognition.start();
      this.config.onStart();
      
      console.log('🎤 Speech Recognition started');
    } catch (error: any) {
      console.error('❌ Failed to start:', error);
      this.cleanup();
      this.config.onError(this.getErrorMessage(error));
      throw error;
    }
  }

  stop(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.cleanup();
  }

  async updateLanguage(language: string): Promise<void> {
    this.config.language = language;
    
    if (!this.isActive) return;

    console.log(`🔄 Switching to: ${language}`);
    
    // Complete stop and restart
    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.onerror = null;
      this.recognition.onresult = null;
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (this.isActive) {
      try {
        await this.initSpeechRecognition();
        this.recognition.start();
        console.log(`✅ Switched to: ${language}`);
      } catch (e) {
        console.error('Failed to restart:', e);
        this.config.onError('Failed to switch language');
      }
    }
  }

  private async initAudioContext(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(AdvancedSpeechRecognizer.platform.isMobile && {
          sampleRate: 16000,
          channelCount: 1,
        }),
      },
    });

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.microphone = this.audioContext.createMediaStreamSource(this.stream);
    this.microphone.connect(this.analyser);
  }

  private async initSpeechRecognition(): Promise<void> {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Speech Recognition not supported');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let currentFinalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentFinalTranscript += transcript + ' ';
          this.finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = (this.finalTranscript + interimTranscript).trim();
      const isFinal = currentFinalTranscript.length > 0;
      
      if (fullTranscript) {
        this.config.onResult(fullTranscript, isFinal);
      }
      
      // Reset restart count on successful result
      if (isFinal) {
        this.restartCount = 0;
      }
    };

    this.recognition.onerror = (event: any) => {
      const error = event.error;
      console.warn('🔴 Recognition error:', error);

      if (error === 'aborted') return;
      
      if (error === 'no-speech' || error === 'network') {
        if (this.isActive) this.attemptRestart();
      } else if (error === 'not-allowed' || error === 'service-not-allowed') {
        this.config.onError('Microphone permission denied');
        this.stop();
      } else {
        this.config.onError(`Error: ${error}`);
        if (this.isActive) this.attemptRestart();
      }
    };

    this.recognition.onend = () => {
      console.log('🏁 Recognition ended');
      if (this.isActive) {
        this.attemptRestart();
      } else {
        this.config.onEnd();
      }
    };
  }

  private attemptRestart(): void {
    if (this.restartCount >= this.maxRestarts) {
      console.warn('⚠️ Max restarts reached');
      this.stop();
      return;
    }

    this.restartCount++;
    console.log(`🔄 Restarting (${this.restartCount}/${this.maxRestarts})`);

    setTimeout(() => {
      if (this.isActive && this.recognition) {
        try {
          this.recognition.start();
        } catch (e: any) {
          if (!e.message.includes('already started')) {
            console.error('Restart failed:', e);
          }
        }
      }
    }, 100);
  }

  private startAudioLevelMonitoring(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.audioLevelInterval = setInterval(() => {
      if (!this.analyser || !this.isActive) {
        this.stopAudioLevelMonitoring();
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1);
      
      this.config.onAudioLevel(normalizedLevel);
    }, 50);
  }

  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
  }

  private cleanup(): void {
    this.stopAudioLevelMonitoring();

    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  private getErrorMessage(error: any): string {
    if (error.name === 'NotAllowedError') return 'Microphone permission denied';
    if (error.name === 'NotFoundError') return 'No microphone found';
    if (error.name === 'NotReadableError') return 'Microphone in use by another app';
    return error.message || 'Failed to start speech recognition';
  }

  isRecording(): boolean {
    return this.isActive;
  }

  static getPlatform() {
    return this.platform;
  }
}
