export interface VoicePlayback {
  speak(text: string): Promise<void>;
  stop(): void;
}
