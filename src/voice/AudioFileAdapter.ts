import type { SoundCue, SpeakOptions, VoicePlaybackAdapter } from './types';

interface AudioScope {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

interface ToneStep {
  frequency: number;
  duration: number;
  offset?: number;
  gain?: number;
}

const cueTones: Record<SoundCue, readonly ToneStep[]> = {
  ready: [
    { frequency: 392, duration: 0.11, gain: 0.12 },
    { frequency: 523, duration: 0.14, offset: 0.12, gain: 0.13 },
  ],
  'contraction-start': [
    { frequency: 392, duration: 0.1, gain: 0.13 },
    { frequency: 494, duration: 0.14, offset: 0.1, gain: 0.14 },
  ],
  'contraction-sustain': [
    { frequency: 466, duration: 0.12, gain: 0.09 },
  ],
  'release-start': [
    { frequency: 440, duration: 0.1, gain: 0.12 },
    { frequency: 330, duration: 0.16, offset: 0.1, gain: 0.13 },
  ],
  'countdown-5': [{ frequency: 349, duration: 0.09, gain: 0.09 }],
  'countdown-4': [{ frequency: 370, duration: 0.09, gain: 0.09 }],
  'countdown-3': [{ frequency: 392, duration: 0.09, gain: 0.1 }],
  'countdown-2': [{ frequency: 440, duration: 0.1, gain: 0.11 }],
  'countdown-1': [{ frequency: 523, duration: 0.13, gain: 0.13 }],
  pause: [{ frequency: 294, duration: 0.14, gain: 0.11 }],
  resume: [
    { frequency: 392, duration: 0.09, gain: 0.11 },
    { frequency: 494, duration: 0.12, offset: 0.1, gain: 0.12 },
  ],
  complete: [
    { frequency: 392, duration: 0.11, gain: 0.12 },
    { frequency: 494, duration: 0.11, offset: 0.11, gain: 0.12 },
    { frequency: 587, duration: 0.18, offset: 0.22, gain: 0.14 },
  ],
  stop: [{ frequency: 262, duration: 0.16, gain: 0.1 }],
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
    if (!this.context || this.context.state !== 'running') return;

    try {
      const now = this.context.currentTime;
      for (const step of cueTones[cue]) {
        const start = now + (step.offset ?? 0);
        const end = start + step.duration;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(step.frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(step.gain ?? 0.11, start + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        oscillator.connect(gain).connect(this.context.destination);
        oscillator.addEventListener('ended', () => this.active.delete(oscillator), { once: true });
        this.active.add(oscillator);
        oscillator.start(start);
        oscillator.stop(end);
      }
    } catch {
      // Audio is optional and must never interrupt training.
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
