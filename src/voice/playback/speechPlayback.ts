import type { VoicePlayback } from './voicePlayback';

export class SpeechPlayback implements VoicePlayback {
  async speak(text: string): Promise<void> {
    if (!('speechSynthesis' in window)) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);

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
  }
}
