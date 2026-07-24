import type { VoicePlayback } from './voicePlayback';
import { SpeechPlayback } from './speechPlayback';

export class FallbackPlayback implements VoicePlayback {
  private readonly speech = new SpeechPlayback();

  async speak(text: string): Promise<void> {
    await this.speech.speak(text);
  }

  stop(): void {
    this.speech.stop();
  }
}
