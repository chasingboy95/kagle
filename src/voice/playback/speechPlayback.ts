import type { VoicePlayback } from './voicePlayback';

export class SpeechPlayback implements VoicePlayback {
  private current?: SpeechSynthesisUtterance;

  async speak(text: string): Promise<void> {
    if (!('speechSynthesis' in window)) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    this.current = utterance;

    await new Promise<void>((resolve) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.current = undefined;
  }
}
