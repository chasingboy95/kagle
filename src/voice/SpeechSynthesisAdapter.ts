import type { SoundCue, SpeakOptions, VoicePlaybackAdapter } from './types';

interface SpeechScope {
  speechSynthesis?: SpeechSynthesis;
  SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
}

export class SpeechSynthesisAdapter implements VoicePlaybackAdapter {
  private readonly synthesis?: SpeechSynthesis;
  private readonly Utterance?: typeof SpeechSynthesisUtterance;
  private voices: SpeechSynthesisVoice[] = [];

  constructor(scope: SpeechScope = globalThis as SpeechScope) {
    this.synthesis = scope.speechSynthesis;
    this.Utterance = scope.SpeechSynthesisUtterance;
    this.refreshVoices();

    try {
      this.synthesis?.addEventListener('voiceschanged', this.refreshVoices);
    } catch {
      // Some implementations expose the API but reject event registration.
    }
  }

  private readonly refreshVoices = (): void => {
    try {
      this.voices = this.synthesis?.getVoices() ?? [];
    } catch {
      this.voices = [];
    }
  };

  async preload(): Promise<void> {
    this.refreshVoices();
  }

  speak(options: SpeakOptions): Promise<void> {
    if (!this.isSupported() || !this.synthesis || !this.Utterance) return Promise.resolve();

    try {
      this.synthesis.cancel();
      const utterance = new this.Utterance(options.text);
      utterance.lang = options.language;
      utterance.volume = options.volume;
      utterance.rate = options.rate;
      utterance.pitch = options.pitch;
      const selected = options.voiceName
        ? this.voices.find(voice => voice.name === options.voiceName)
        : undefined;
      utterance.voice = selected
        ?? this.voices.find(voice => voice.lang.toLowerCase().startsWith(options.language.toLowerCase()))
        ?? null;

      return new Promise(resolve => {
        utterance.addEventListener('end', () => resolve(), { once: true });
        utterance.addEventListener('error', () => resolve(), { once: true });
        try {
          this.synthesis?.speak(utterance);
        } catch {
          resolve();
        }
      });
    } catch {
      return Promise.resolve();
    }
  }

  async playCue(_cue: SoundCue): Promise<void> {}

  stop(): void {
    try { this.synthesis?.cancel(); } catch { /* unavailable */ }
  }

  pause(): void {
    try { this.synthesis?.pause(); } catch { /* inconsistent across browsers */ }
  }

  resume(): void {
    try { this.synthesis?.resume(); } catch { /* inconsistent across browsers */ }
  }

  isSupported(): boolean {
    return Boolean(this.synthesis && this.Utterance);
  }
}
