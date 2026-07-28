import { describe, expect, it, vi } from 'vitest';
import { HapticAdapter } from './HapticAdapter';

class FakeAudioContext {
  state: AudioContextState = 'suspended';
  currentTime = 1;
  destination = {} as AudioDestinationNode;
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  oscillators: FakeOscillator[] = [];

  createOscillator(): OscillatorNode {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  }

  createGain(): GainNode {
    return new FakeGain() as unknown as GainNode;
  }
}

class FakeOscillator {
  type: OscillatorType = 'sine';
  frequency = { setValueAtTime: vi.fn() };
  connect = vi.fn(() => new FakeGain());
  start = vi.fn();
  stop = vi.fn();
}

class FakeGain {
  gain = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn(() => this);
}

function audioScope(context: FakeAudioContext) {
  return {
    AudioContext: class {
      constructor() {
        return context;
      }
    } as unknown as typeof AudioContext,
  };
}

describe('HapticAdapter', () => {
  it('uses real vibration when the API is available', () => {
    const vibrate = vi.fn(() => true);
    const adapter = new HapticAdapter({ vibrate });

    adapter.trigger({ type: 'stage-enter', stage: 'contract' }, true);

    expect(vibrate).toHaveBeenCalledWith(40);
  });

  it('unlocks the iOS audio fallback before a later training event', async () => {
    const context = new FakeAudioContext();
    const adapter = new HapticAdapter({}, audioScope(context));

    await adapter.preload();
    adapter.trigger({ type: 'stage-enter', stage: 'relax' }, true);

    expect(context.resume).toHaveBeenCalledOnce();
    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(660, 1);
    expect(context.oscillators[0].start).toHaveBeenCalledWith(1);
  });

  it('does not pretend a suspended, non-unlocked context can play', () => {
    const context = new FakeAudioContext();
    const adapter = new HapticAdapter({}, audioScope(context));

    adapter.trigger({ type: 'completed' }, true);

    expect(context.resume).not.toHaveBeenCalled();
    expect(context.oscillators).toHaveLength(0);
  });
});
