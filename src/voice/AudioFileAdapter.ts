import type { SoundCue, SpeakOptions, VoicePlaybackAdapter } from './types';

interface AudioScope {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

const cueTones: Record<SoundCue, { frequency: number; duration: number }> = {
  ready: { frequency: 440, duration: 0.09 },
  contract: { frequency: 520, duration: 0.08 },
  hold: { frequency: 460, duration: 0.07 },
  relax: { frequency: 360, duration: 0.1 },
  pause: { frequency: 320, duration: 0.08 },
  resume: { frequency: 430, duration: 0.08 },
  complete: { frequency: 560, duration: 0.12 },
  stop: { frequency: 300, duration: 0.08 },
};

export class AudioFileAdapter implements VoicePlaybackAdapter {
  private context?: AudioContext;
  private readonly active = new Set<OscillatorNode>();

  constructor(private readonly scope: AudioScope = globalThis as AudioScope) {}

  async preload(): Promise<void> {
    const Context = this.scope.AudioContext ?? this.scope.webkitAudioContext;
    if (!Context) return;
    try {
      this.context ??= new Context();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch {
      this.context = undefined;
    }
  }

  async speak(_options: SpeakOptions): Promise<void> {}

  async playCue(cue: SoundCue): Promise<void> {
    await this.preload();
    if (!this.context) return;

    try {
      const { frequency, duration } = cueTones[cue];
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.addEventListener('ended', () => this.active.delete(oscillator), { once: true });
      this.active.add(oscillator);
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch {
      // Audio is optional.
    }
  }

  stop(): void {
    for (const oscillator of this.active) {
      try { oscillator.stop(); } catch { /* already stopped */ }
    }
    this.active.clear();
  }

  pause(): void { this.stop(); }
  resume(): void {}

  isSupported(): boolean {
    return Boolean(this.scope.AudioContext ?? this.scope.webkitAudioContext);
  }
}
