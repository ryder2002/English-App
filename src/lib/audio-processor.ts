'use client';

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private noiseGate: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeAudioContext();
    }
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }

  // Enhanced audio processing pipeline
  async setupAudioPipeline(stream: MediaStream): Promise<MediaStream> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    const source = this.audioContext.createMediaStreamSource(stream);
    
    // Create processing nodes
    this.analyser = this.audioContext.createAnalyser();
    this.gainNode = this.audioContext.createGain();
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.noiseGate = this.audioContext.createGain();

    // Configure analyser for voice frequency analysis
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Configure compressor for dynamic range control
    this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
    this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
    this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
    this.compressor.attack.setValueAtTime(0, this.audioContext.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

    // Configure gain for voice amplification
    this.gainNode.gain.setValueAtTime(1.5, this.audioContext.currentTime);

    // Create audio processing chain
    // Input → Compressor → Gain → NoiseGate → Analyser → Output
    source.connect(this.compressor);
    this.compressor.connect(this.gainNode);
    this.gainNode.connect(this.noiseGate);
    this.noiseGate.connect(this.analyser);

    // Create output stream
    const destination = this.audioContext.createMediaStreamDestination();
    this.analyser.connect(destination);

    // Apply noise gate based on audio level
    this.startNoiseGate();

    return destination.stream;
  }

  // Noise gate to reduce background noise
  private startNoiseGate() {
    if (!this.analyser || !this.noiseGate) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateNoiseGate = () => {
      this.analyser!.getByteFrequencyData(dataArray);
      
      // Calculate average amplitude
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      
      // Noise gate threshold
      const threshold = 30; // Adjust based on testing
      const gateValue = average > threshold ? 1 : 0.1;
      
      // Smooth gain changes to avoid clicks
      if (this.noiseGate && this.audioContext) {
        const currentTime = this.audioContext.currentTime;
        this.noiseGate.gain.setTargetAtTime(gateValue, currentTime, 0.01);
      }
      
      requestAnimationFrame(updateNoiseGate);
    };

    updateNoiseGate();
  }

  // Voice activity detection
  isVoiceActive(): boolean {
    if (!this.analyser) return false;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Focus on voice frequency range (85Hz - 255Hz for fundamental, 255Hz - 2000Hz for harmonics)
    const voiceStart = Math.floor((85 / (this.audioContext!.sampleRate / 2)) * bufferLength);
    const voiceEnd = Math.floor((2000 / (this.audioContext!.sampleRate / 2)) * bufferLength);

    let voiceEnergy = 0;
    for (let i = voiceStart; i < voiceEnd; i++) {
      voiceEnergy += dataArray[i];
    }

    const avgVoiceEnergy = voiceEnergy / (voiceEnd - voiceStart);
    return avgVoiceEnergy > 40; // Threshold can be adjusted
  }

  // Get audio level for visualization
  getAudioLevel(): number {
    if (!this.analyser) return 0;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
    return Math.min(average / 128, 1); // Normalize to 0-1
  }

  // Clean up resources
  cleanup() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.analyser = null;
    this.gainNode = null;
    this.compressor = null;
    this.noiseGate = null;
  }
}
