import type { VoicePlayback } from './voicePlayback';
import { SpeechPlayback } from './speechPlayback';

export class FallbackPlayback implements VoicePlayback {
  private readonly fallback: VoicePlayback;

  constructor(
    private readonly primary?: VoicePlayback,
    fallback: VoicePlayback = new SpeechPlayback(),
  ) {
    this.fallback = fallback;
  }

  async speak(value: string): Promise<void> {
    if (this.primary) {
      try {
        await this.primary.speak(value);
        return;
      } catch {
        // Recorded audio can fail because a file is missing, decoding fails, or
        // the browser blocks playback. Fall through to platform speech.
      }
    }

    await this.fallback.speak(value);
  }

  stop(): void {
    this.primary?.stop();
    this.fallback.stop();
  }
}
