import type { VoicePlayback } from './voicePlayback';

export class AudioPlayback implements VoicePlayback {
  private activeAudio: HTMLAudioElement | null = null;

  constructor(private readonly audioMap: Record<string, string>) {}

  async speak(key: string): Promise<void> {
    const source = this.audioMap[key];
    if (!source) {
      throw new Error(`No recorded voice asset mapped for: ${key}`);
    }

    this.stop();

    const audio = new Audio(source);
    this.activeAudio = audio;

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        audio.onended = null;
        audio.onerror = null;
        if (this.activeAudio === audio) this.activeAudio = null;
      };

      audio.onended = () => {
        cleanup();
        resolve();
      };

      audio.onerror = () => {
        cleanup();
        reject(new Error(`Failed to play recorded voice asset: ${source}`));
      };

      audio.play().catch((error: unknown) => {
        cleanup();
        reject(error instanceof Error ? error : new Error('Recorded audio playback failed'));
      });
    });
  }

  stop(): void {
    if (!this.activeAudio) return;

    this.activeAudio.pause();
    this.activeAudio.currentTime = 0;
    this.activeAudio.onended = null;
    this.activeAudio.onerror = null;
    this.activeAudio = null;
  }
}
