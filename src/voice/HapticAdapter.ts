import type { VoiceEvent } from './types';

interface HapticNavigator {
  vibrate?: (pattern: VibratePattern) => boolean;
}

interface AudioScope {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

export class HapticAdapter {
  /** Very short "tap" tone frequencies for each event type (audio fallback). */
  private static readonly tone: Record<string, readonly number[]> = {
    contract: [880],
    relax: [660],
    completed: [660, 880, 1100],
  };

  private audioCtx?: AudioContext;

  constructor(
    private readonly target: HapticNavigator = globalThis.navigator as HapticNavigator,
    private readonly scope: AudioScope = globalThis as AudioScope,
  ) {}

  /** Check whether real device vibration is available. */
  isSupported(): boolean {
    return typeof this.target?.vibrate === 'function';
  }

  /**
   * Unlock the audio fallback while still inside the user's start/preview gesture.
   * iOS will not resume a suspended AudioContext from a later timer callback.
   */
  async preload(): Promise<void> {
    if (this.isSupported()) return;

    const Context = this.scope.AudioContext ?? this.scope.webkitAudioContext;
    if (!Context) return;

    try {
      this.audioCtx ??= new Context();
      if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
    } catch {
      this.audioCtx = undefined;
    }
  }

  trigger(event: VoiceEvent, enabled: boolean): void {
    if (!enabled) return;

    // Real vibration — works on Android, not on iOS
    if (this.isSupported()) {
      const pattern = this.vibratePattern(event);
      if (pattern !== null) {
        try { this.target.vibrate!(pattern); return; } catch { /* optional */ }
      }
    }

    // iOS fallback: very short audio "tap"
    this.playAudioFallback(event);
  }

  private vibratePattern(event: VoiceEvent): VibratePattern | null {
    if (event.type === 'stage-enter' && event.stage === 'contract') return 40;
    if (event.type === 'stage-enter' && event.stage === 'relax') return 25;
    if (event.type === 'completed') return [35, 80, 35];
    return null;
  }

  private playAudioFallback(event: VoiceEvent): void {
    const freqs = ((): readonly number[] | null => {
      if (event.type === 'stage-enter') {
        const f = HapticAdapter.tone[event.stage];
        if (f !== undefined) return f;
      }
      if (event.type === 'completed') return HapticAdapter.tone.completed;
      return null;
    })();
    if (!freqs || !this.audioCtx) return;

    try {
      if (this.audioCtx.state !== 'running') return;

      const now = this.audioCtx.currentTime;
      for (let i = 0; i < freqs.length; i++) {
        const start = now + i * 0.065;
        const end = start + 0.045;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqs[i], start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.06, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(gain).connect(this.audioCtx.destination);
        osc.start(start);
        osc.stop(end);
      }
    } catch { /* audio fallback is optional */ }
  }
}
