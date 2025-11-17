declare module 'recordrtc' {
  export interface RecordRTCOptions {
    type?: 'audio' | 'video' | 'canvas' | 'gif';
    mimeType?: string;
    recorderType?: any;
    numberOfAudioChannels?: number;
    desiredSampRate?: number;
    timeSlice?: number;
  }

  export default class RecordRTC {
    constructor(stream: MediaStream, options?: RecordRTCOptions);
    
    startRecording(): void;
    stopRecording(callback?: () => void): void;
    getBlob(): Blob;
    destroy(): void;
    
    static StereoAudioRecorder: any;
  }
}
