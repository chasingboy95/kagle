import type { SoundCue, SpeakOptions, VoicePlaybackAdapter } from './types';

interface SpeechScope {
  speechSynthesis?: SpeechSynthesis;
  SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
}

interface ActiveSpeak {
  utterance: SpeechSynthesisUtterance;
  settle: () => void;
}

const SPEAK_TIMEOUT_MS = 8_000;

export class SpeechSynthesisAdapter implements VoicePlaybackAdapter {
  private readonly synthesis?: SpeechSynthesis;
  private readonly Utterance?: typeof SpeechSynthesisUtterance;
  private voices: SpeechSynthesisVoice[] = [];
  private activeSpeak?: ActiveSpeak;

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

    const previous = this.activeSpeak;
    try {
      this.synthesis.cancel();
    } catch {
      // Cancellation support varies across browser implementations.
    } finally {
      previous?.settle();
    }

    try {
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
      return this.startSpeak(utterance);
    } catch {
      return Promise.resolve();
    }
  }

  private startSpeak(utterance: SpeechSynthesisUtterance): Promise<void> {
    return new Promise(resolve => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      let settled = false;
      const settle = (): void => {
        if (settled) return;
        settled = true;
        if (timer !== undefined) clearTimeout(timer);
        try { utterance.removeEventListener('end', settle); } catch { /* unavailable */ }
        try { utterance.removeEventListener('error', settle); } catch { /* unavailable */ }
        if (this.activeSpeak?.utterance === utterance) this.activeSpeak = undefined;
        resolve();
      };
      const active: ActiveSpeak = { utterance, settle };
      this.activeSpeak = active;

      try {
        utterance.addEventListener('end', settle);
        utterance.addEventListener('error', settle);
        timer = setTimeout(() => {
          if (this.activeSpeak !== active) return;
          try { this.synthesis?.cancel(); } catch { /* unavailable */ }
          settle();
        }, SPEAK_TIMEOUT_MS);
        const result = this.synthesis?.speak(utterance) as unknown;
        if (result && typeof (result as PromiseLike<void>).then === 'function') {
          Promise.resolve(result).catch(settle);
        }
      } catch {
        settle();
      }
    });
  }

  async playCue(_cue: SoundCue): Promise<void> {}

  stop(): void {
    const active = this.activeSpeak;
    try { this.synthesis?.cancel(); } catch { /* unavailable */ }
    finally { active?.settle(); }
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
