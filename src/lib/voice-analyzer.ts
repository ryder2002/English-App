'use client';

export interface VoiceAnalysis {
  stressPattern: StressAnalysis;
  intonation: IntonationAnalysis;
  pronunciation: PronunciationAnalysis;
  emotion: EmotionAnalysis;
}

export interface StressAnalysis {
  detectedStresses: number[];
  expectedStresses: number[];
  accuracy: number;
  feedback: string;
}

export interface IntonationAnalysis {
  pattern: 'rising' | 'falling' | 'flat' | 'complex';
  confidence: number;
  naturalness: number;
  feedback: string;
}

export interface PronunciationAnalysis {
  vowelAccuracy: number;
  consonantAccuracy: number;
  overallClarity: number;
  problemAreas: string[];
  suggestions: string[];
}

export interface EmotionAnalysis {
  detectedEmotion: 'neutral' | 'happy' | 'sad' | 'excited' | 'nervous' | 'confident';
  confidence: number;
  energyLevel: number;
}

export class VoiceAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioData: Float32Array[] = [];
  private sampleRate: number = 44100;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeAudioContext();
    }
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.sampleRate = this.audioContext.sampleRate;
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }

  // Start voice analysis
  async startAnalysis(stream: MediaStream): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    
    // Configure for voice analysis
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant = 0.3;
    
    source.connect(this.analyser);
    
    // Start collecting audio data
    this.collectAudioData();
  }

  private collectAudioData() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const collectData = () => {
      this.analyser!.getFloatTimeDomainData(dataArray);
      
      // Store audio samples for analysis
      this.audioData.push(new Float32Array(dataArray));
      
      // Keep only last 5 seconds of data to prevent memory issues
      if (this.audioData.length > (this.sampleRate / bufferLength) * 5) {
        this.audioData.shift();
      }
      
      requestAnimationFrame(collectData);
    };

    collectData();
  }

  // Analyze voice stress patterns
  analyzeStressPattern(text: string): StressAnalysis {
    if (this.audioData.length === 0) {
      return {
        detectedStresses: [],
        expectedStresses: [],
        accuracy: 0,
        feedback: 'No audio data available for stress analysis'
      };
    }

    const words = text.toLowerCase().split(' ');
    const expectedStresses: number[] = [];
    
    // Simple stress pattern detection based on word length and common patterns
    words.forEach((word, index) => {
      if (this.isContentWord(word)) {
        expectedStresses.push(index);
      }
    });

    // Analyze audio for stress (higher amplitude and pitch variations)
    const detectedStresses = this.detectStressFromAudio(words.length);
    
    // Calculate accuracy
    const matchingStresses = expectedStresses.filter(stress => 
      detectedStresses.some(detected => Math.abs(detected - stress) <= 1)
    );
    
    const accuracy = expectedStresses.length > 0 ? 
      (matchingStresses.length / expectedStresses.length) * 100 : 100;

    let feedback = '';
    if (accuracy >= 80) {
      feedback = 'Great stress pattern! Very natural sounding.';
    } else if (accuracy >= 60) {
      feedback = 'Good stress pattern, but some content words could be emphasized more.';
    } else {
      feedback = 'Try to emphasize important content words (nouns, verbs, adjectives).';
    }

    return {
      detectedStresses,
      expectedStresses,
      accuracy: Math.round(accuracy),
      feedback
    };
  }

  private isContentWord(word: string): boolean {
    const functionWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can'];
    return !functionWords.includes(word) && word.length > 2;
  }

  private detectStressFromAudio(wordCount: number): number[] {
    if (this.audioData.length === 0) return [];

    const stresses: number[] = [];
    const segmentSize = Math.floor(this.audioData.length / wordCount);

    for (let i = 0; i < wordCount; i++) {
      const startIdx = i * segmentSize;
      const endIdx = Math.min((i + 1) * segmentSize, this.audioData.length);
      
      let maxAmplitude = 0;
      
      for (let j = startIdx; j < endIdx; j++) {
        const segment = this.audioData[j];
        const amplitude = this.calculateRMS(segment);
        maxAmplitude = Math.max(maxAmplitude, amplitude);
      }
      
      // If amplitude is significantly higher than average, consider it stressed
      if (maxAmplitude > 0.1) { // Threshold can be adjusted
        stresses.push(i);
      }
    }

    return stresses;
  }

  private calculateRMS(audioBuffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      sum += audioBuffer[i] * audioBuffer[i];
    }
    return Math.sqrt(sum / audioBuffer.length);
  }

  // Analyze intonation patterns
  analyzeIntonation(text: string): IntonationAnalysis {
    if (this.audioData.length === 0) {
      return {
        pattern: 'flat',
        confidence: 0,
        naturalness: 0,
        feedback: 'No audio data available for intonation analysis'
      };
    }

    const pitchVariations = this.extractPitchVariations();
    const pattern = this.classifyIntonationPattern(pitchVariations, text);
    const naturalness = this.calculateIntonationNaturalness(pitchVariations);

    let feedback = '';
    switch (pattern) {
      case 'rising':
        feedback = 'Good rising intonation detected. Suitable for questions.';
        break;
      case 'falling':
        feedback = 'Clear falling intonation. Good for statements.';
        break;
      case 'flat':
        feedback = 'Try to add more pitch variation for natural-sounding speech.';
        break;
      case 'complex':
        feedback = 'Complex intonation pattern detected. Sounds very natural!';
        break;
    }

    return {
      pattern,
      confidence: Math.min(pitchVariations.length / 10, 1), // More data = higher confidence
      naturalness,
      feedback
    };
  }

  private extractPitchVariations(): number[] {
    const variations: number[] = [];
    
    this.audioData.forEach(segment => {
      // Simple pitch estimation using zero crossing rate
      let crossings = 0;
      for (let i = 1; i < segment.length; i++) {
        if ((segment[i] >= 0) !== (segment[i - 1] >= 0)) {
          crossings++;
        }
      }
      
      // Estimate fundamental frequency
      const estimatedF0 = (crossings / 2) * (this.sampleRate / segment.length);
      if (estimatedF0 > 50 && estimatedF0 < 500) { // Valid voice range
        variations.push(estimatedF0);
      }
    });

    return variations;
  }

  private classifyIntonationPattern(pitchVariations: number[], text: string): IntonationAnalysis['pattern'] {
    if (pitchVariations.length < 3) return 'flat';

    const start = pitchVariations.slice(0, 3).reduce((a, b) => a + b) / 3;
    const end = pitchVariations.slice(-3).reduce((a, b) => a + b) / 3;
    const diff = end - start;
    const variance = this.calculateVariance(pitchVariations);

    // Check if it's a question
    if (text.trim().endsWith('?')) {
      return diff > 10 ? 'rising' : 'flat';
    }

    // Classify based on pitch movement
    if (variance > 100) {
      return 'complex';
    } else if (diff > 20) {
      return 'rising';
    } else if (diff < -20) {
      return 'falling';
    } else {
      return 'flat';
    }
  }

  private calculateVariance(array: number[]): number {
    const mean = array.reduce((a, b) => a + b) / array.length;
    const variance = array.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / array.length;
    return variance;
  }

  private calculateIntonationNaturalness(pitchVariations: number[]): number {
    if (pitchVariations.length === 0) return 0;

    const variance = this.calculateVariance(pitchVariations);
    
    // Natural speech has moderate pitch variation (not too flat, not too wild)
    const idealVariance = 200; // Adjust based on testing
    const naturalness = Math.max(0, 100 - Math.abs(variance - idealVariance) / 5);
    
    return Math.round(naturalness);
  }

  // Analyze pronunciation clarity
  analyzePronunciation(text: string): PronunciationAnalysis {
    if (this.audioData.length === 0) {
      return {
        vowelAccuracy: 0,
        consonantAccuracy: 0,
        overallClarity: 0,
        problemAreas: ['No audio data available'],
        suggestions: ['Please speak into the microphone']
      };
    }

    const clarity = this.calculateOverallClarity();
    const vowelAccuracy = this.analyzeVowelClarity();
    const consonantAccuracy = this.analyzeConsonantClarity();
    
    const problemAreas: string[] = [];
    const suggestions: string[] = [];

    if (vowelAccuracy < 70) {
      problemAreas.push('Vowel pronunciation');
      suggestions.push('Focus on clear vowel sounds (a, e, i, o, u)');
    }

    if (consonantAccuracy < 70) {
      problemAreas.push('Consonant clarity');
      suggestions.push('Articulate consonants more clearly (p, t, k, s, th)');
    }

    if (clarity < 60) {
      problemAreas.push('Overall clarity');
      suggestions.push('Speak slower and open your mouth wider');
    }

    if (problemAreas.length === 0) {
      suggestions.push('Excellent pronunciation! Keep it up!');
    }

    return {
      vowelAccuracy: Math.round(vowelAccuracy),
      consonantAccuracy: Math.round(consonantAccuracy),
      overallClarity: Math.round(clarity),
      problemAreas,
      suggestions
    };
  }

  private calculateOverallClarity(): number {
    let totalEnergy = 0;
    let clearSamples = 0;

    this.audioData.forEach(segment => {
      const rms = this.calculateRMS(segment);
      totalEnergy += rms;
      
      // Count samples with good signal-to-noise ratio
      if (rms > 0.05) {
        clearSamples++;
      }
    });

    const avgEnergy = totalEnergy / this.audioData.length;
    const clarityRatio = clearSamples / this.audioData.length;
    
    return Math.min((avgEnergy * 1000 + clarityRatio * 100) / 2, 100);
  }

  private analyzeVowelClarity(): number {
    // Simplified vowel analysis based on frequency content
    let vowelScore = 0;
    let totalSegments = 0;

    this.audioData.forEach(segment => {
      const spectrum = this.getFrequencySpectrum(segment);
      
      // Check for vowel formants (simplified)
      const f1Range = spectrum.slice(200, 800); // First formant range
      const f2Range = spectrum.slice(800, 2500); // Second formant range
      
      const f1Energy = f1Range.reduce((a, b) => a + b, 0);
      const f2Energy = f2Range.reduce((a, b) => a + b, 0);
      
      if (f1Energy > 0.1 && f2Energy > 0.1) {
        vowelScore += Math.min((f1Energy + f2Energy) * 100, 100);
      }
      
      totalSegments++;
    });

    return totalSegments > 0 ? vowelScore / totalSegments : 0;
  }

  private analyzeConsonantClarity(): number {
    // Simplified consonant analysis based on high-frequency content
    let consonantScore = 0;
    let totalSegments = 0;

    this.audioData.forEach(segment => {
      const spectrum = this.getFrequencySpectrum(segment);
      
      // Check for consonant frequencies (simplified)
      const highFreqRange = spectrum.slice(2000, 8000);
      const highFreqEnergy = highFreqRange.reduce((a, b) => a + b, 0);
      
      if (highFreqEnergy > 0.05) {
        consonantScore += Math.min(highFreqEnergy * 200, 100);
      }
      
      totalSegments++;
    });

    return totalSegments > 0 ? consonantScore / totalSegments : 0;
  }

  private getFrequencySpectrum(audioBuffer: Float32Array): number[] {
    // Simple FFT approximation for frequency analysis
    const fftSize = Math.min(audioBuffer.length, 1024);
    const spectrum: number[] = new Array(fftSize / 2).fill(0);
    
    // This is a simplified version - in production, you'd use a proper FFT library
    for (let i = 0; i < fftSize / 2; i++) {
      let real = 0, imag = 0;
      
      for (let n = 0; n < fftSize; n++) {
        const angle = -2 * Math.PI * i * n / fftSize;
        real += audioBuffer[n] * Math.cos(angle);
        imag += audioBuffer[n] * Math.sin(angle);
      }
      
      spectrum[i] = Math.sqrt(real * real + imag * imag) / fftSize;
    }
    
    return spectrum;
  }

  // Analyze emotional tone
  analyzeEmotion(): EmotionAnalysis {
    if (this.audioData.length === 0) {
      return {
        detectedEmotion: 'neutral',
        confidence: 0,
        energyLevel: 0
      };
    }

    const energyLevel = this.calculateEnergyLevel();
    const pitchVariations = this.extractPitchVariations();
    const pitchVariance = this.calculateVariance(pitchVariations);

    let detectedEmotion: EmotionAnalysis['detectedEmotion'] = 'neutral';
    let confidence = 0.5;

    // Simple emotion classification based on energy and pitch
    if (energyLevel > 0.8 && pitchVariance > 300) {
      detectedEmotion = 'excited';
      confidence = 0.8;
    } else if (energyLevel > 0.6 && pitchVariance > 150) {
      detectedEmotion = 'happy';
      confidence = 0.7;
    } else if (energyLevel < 0.3 && pitchVariance < 50) {
      detectedEmotion = 'sad';
      confidence = 0.6;
    } else if (energyLevel > 0.4 && pitchVariance < 100) {
      detectedEmotion = 'confident';
      confidence = 0.7;
    } else if (energyLevel < 0.5 && pitchVariance > 200) {
      detectedEmotion = 'nervous';
      confidence = 0.6;
    }

    return {
      detectedEmotion,
      confidence: Math.round(confidence * 100) / 100,
      energyLevel: Math.round(energyLevel * 100)
    };
  }

  private calculateEnergyLevel(): number {
    let totalEnergy = 0;
    
    this.audioData.forEach(segment => {
      const rms = this.calculateRMS(segment);
      totalEnergy += rms;
    });

    const avgEnergy = totalEnergy / this.audioData.length;
    return Math.min(avgEnergy * 5, 1); // Normalize to 0-1
  }

  // Get comprehensive voice analysis
  getComprehensiveAnalysis(text: string): VoiceAnalysis {
    return {
      stressPattern: this.analyzeStressPattern(text),
      intonation: this.analyzeIntonation(text),
      pronunciation: this.analyzePronunciation(text),
      emotion: this.analyzeEmotion()
    };
  }

  // Clean up resources
  cleanup() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.analyser = null;
    this.audioData = [];
  }
}
