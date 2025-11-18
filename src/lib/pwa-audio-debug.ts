/**
 * PWA Audio Debug Helper
 * Helps diagnose microphone and speech recognition issues in PWA mode
 */

export class PWAAudioDebug {
  /**
   * Check if app is running as PWA
   */
  static isPWA(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')
    );
  }

  /**
   * Get detailed device and browser info
   */
  static getDeviceInfo() {
    const ua = navigator.userAgent;
    return {
      userAgent: ua,
      isIOS: /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream,
      isAndroid: /Android/.test(ua),
      isMobile: /Mobi/.test(ua),
      isPWA: this.isPWA(),
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      protocol: window.location.protocol,
      platform: navigator.platform,
      vendor: navigator.vendor,
    };
  }

  /**
   * Check microphone permission status
   */
  static async checkMicrophonePermission(): Promise<string> {
    if (!navigator.permissions || !navigator.permissions.query) {
      return 'Permissions API not supported';
    }

    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
      return `Error checking permission: ${error}`;
    }
  }

  /**
   * Check if getUserMedia is available
   */
  static isGetUserMediaAvailable(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  }

  /**
   * Check if Speech Recognition is available
   */
  static isSpeechRecognitionAvailable(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Run comprehensive diagnostic
   */
  static async runDiagnostics(): Promise<{
    device: ReturnType<typeof PWAAudioDebug.getDeviceInfo>;
    micPermission: string;
    getUserMedia: boolean;
    speechRecognition: boolean;
    https: boolean;
    issues: string[];
  }> {
    const device = this.getDeviceInfo();
    const micPermission = await this.checkMicrophonePermission();
    const getUserMedia = this.isGetUserMediaAvailable();
    const speechRecognition = this.isSpeechRecognitionAvailable();
    const https = window.location.protocol === 'https:';

    const issues: string[] = [];

    if (!https && device.isPWA) {
      issues.push('⚠️ PWA should run on HTTPS for microphone access');
    }

    if (!getUserMedia) {
      issues.push('❌ getUserMedia API not available');
    }

    if (!speechRecognition) {
      issues.push('❌ Speech Recognition API not available');
    }

    if (micPermission === 'denied') {
      issues.push('❌ Microphone permission denied - user must re-grant in browser settings');
    }

    if (device.isPWA && !https) {
      issues.push('❌ PWA on HTTP - microphone will not work');
    }

    return {
      device,
      micPermission,
      getUserMedia,
      speechRecognition,
      https,
      issues,
    };
  }

  /**
   * Log diagnostics to console
   */
  static async logDiagnostics(): Promise<void> {
    console.log('🔍 PWA Audio Diagnostics');
    console.log('========================');
    
    const diagnostics = await this.runDiagnostics();
    
    console.log('📱 Device Info:', diagnostics.device);
    console.log('🎤 Mic Permission:', diagnostics.micPermission);
    console.log('📹 getUserMedia Available:', diagnostics.getUserMedia);
    console.log('🗣️ Speech Recognition Available:', diagnostics.speechRecognition);
    console.log('🔒 HTTPS:', diagnostics.https);
    
    if (diagnostics.issues.length > 0) {
      console.log('⚠️ Issues Found:');
      diagnostics.issues.forEach(issue => console.log('  ', issue));
    } else {
      console.log('✅ No issues detected');
    }
    
    console.log('========================');
  }

  /**
   * Test microphone access
   */
  static async testMicrophoneAccess(): Promise<{
    success: boolean;
    error?: string;
    stream?: MediaStream;
  }> {
    try {
      console.log('🧪 Testing microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log('✅ Microphone access successful');
      console.log('📊 Audio tracks:', stream.getAudioTracks().length);
      
      stream.getAudioTracks().forEach((track, index) => {
        console.log(`  Track ${index + 1}:`, {
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        });
      });

      // Clean up
      stream.getTracks().forEach(track => track.stop());

      return { success: true, stream };
    } catch (error: any) {
      console.error('❌ Microphone access failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }
}

// Auto-run diagnostics in development mode when PWA is detected
if (typeof window !== 'undefined' && PWAAudioDebug.isPWA()) {
  console.log('🔧 PWA Mode Detected - Running Audio Diagnostics...');
  PWAAudioDebug.logDiagnostics();
}
