import type { VoicePlayback } from './voicePlayback';

export class AudioPlayback implements VoicePlayback {
  constructor(private readonly audioMap: Record<string, string>) {}

  async speak(key: string): Promise<void> {
    const source = this.audioMap[key];
    if (!source) return;

    const audio = new Audio(source);

    await audio.play().catch(() => undefined);
  }

  stop(): void {
    // Audio instances are short lived. Future versions can track and stop active clips.
  }
}
