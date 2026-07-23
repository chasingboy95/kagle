import type { RecordedVoicePlaybackAdapter } from './types';

interface AudioScope {
  Audio?: new (src?: string) => HTMLAudioElement;
}

interface ActivePlayback {
  audio: HTMLAudioElement;
  settle(result: boolean): void;
}

export class PreRecordedAudioAdapter implements RecordedVoicePlaybackAdapter {
  private readonly cache = new Map<string, HTMLAudioElement>();
  private active?: ActivePlayback;

  constructor(private readonly scope: AudioScope = globalThis as AudioScope) {}

  isSupported(): boolean {
    return typeof this.scope.Audio === 'function';
  }

  async preload(urls: readonly string[]): Promise<void> {
    for (const url of urls) {
      if (this.cache.has(url)) continue;
      const audio = this.createAudio(url);
      if (!audio) continue;
      try {
        audio.preload = 'auto';
        audio.load();
      } catch {
        // Preloading is optional; keep the element available for playback.
      }
    }
  }

  play(url: string, volume: number): Promise<boolean> {
    this.stop();
    const audio = this.cache.get(url) ?? this.createAudio(url);
    if (!audio) return Promise.resolve(false);

    return new Promise<boolean>((resolve) => {
      let settled = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;

      const settle = (result: boolean) => {
        if (settled) return;
        settled = true;
        if (timeout !== undefined) clearTimeout(timeout);
        try { audio.removeEventListener('ended', onEnded); } catch { /* optional API */ }
        try { audio.removeEventListener('error', onError); } catch { /* optional API */ }
        if (this.active?.settle === settle) this.active = undefined;
        resolve(result);
      };
      const onEnded = () => settle(true);
      const onError = () => settle(false);

      this.active = { audio, settle };
      try {
        audio.volume = Math.min(1, Math.max(0, volume));
        audio.currentTime = 0;
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);
        timeout = setTimeout(() => settle(false), 8_000);
        audio.play().catch(() => settle(false));
      } catch {
        settle(false);
      }
    });
  }

  stop(): void {
    const active = this.active;
    if (!active) return;
    try { active.audio.pause(); } catch { /* optional API */ }
    try { active.audio.currentTime = 0; } catch { /* optional API */ }
    active.settle(false);
  }

  private createAudio(url: string): HTMLAudioElement | undefined {
    const Audio = this.scope.Audio;
    if (!Audio) return undefined;
    try {
      const audio = new Audio(url);
      this.cache.set(url, audio);
      return audio;
    } catch {
      return undefined;
    }
  }
}
