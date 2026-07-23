import type { VoiceEvent } from './types';

interface HapticNavigator {
  vibrate?: (pattern: VibratePattern) => boolean;
}

export class HapticAdapter {
  constructor(private readonly target: HapticNavigator = globalThis.navigator as HapticNavigator) {}

  trigger(event: VoiceEvent, enabled: boolean): void {
    if (!enabled || typeof this.target?.vibrate !== 'function') return;

    let pattern: VibratePattern | null = null;
    if (event.type === 'stage-enter' && event.stage === 'contract') pattern = 40;
    if (event.type === 'stage-enter' && event.stage === 'relax') pattern = 25;
    if (event.type === 'completed') pattern = [35, 80, 35];
    if (pattern === null) return;

    try { this.target.vibrate(pattern); } catch { /* optional capability */ }
  }
}
