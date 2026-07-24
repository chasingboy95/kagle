import { describe, expect, it } from 'vitest';
import { actionHint, calcDisplayPhaseTiming, READY_DURATION_MS, FEEDBACK_DURATION_MS } from './time';

describe('calcDisplayPhaseTiming', () => {
  it('keeps contract and hold in one continuous display phase', () => {
    const contract = calcDisplayPhaseTiming('contract', 2_000, 3, 5, 3);
    const hold = calcDisplayPhaseTiming('hold', 5_000, 3, 5, 3);

    expect(contract.key).toBe('contract-hold');
    expect(contract.remainingMs).toBe(7_000);
    expect(contract.progress).toBeCloseTo(1 / 8);

    expect(hold.key).toBe('contract-hold');
    expect(hold.remainingMs).toBe(5_000);
    expect(hold.progress).toBeCloseTo(3 / 8);
  });

  it('uses a separate progress range for relax', () => {
    const relax = calcDisplayPhaseTiming('relax', 1_500, 3, 5, 3);

    expect(relax.key).toBe('relax');
    expect(relax.durationMs).toBe(3_000);
    expect(relax.progress).toBeCloseTo(0.5);
  });

  it('returns ready phase timing with correct duration and progress', () => {
    const ready = calcDisplayPhaseTiming('ready', 3_000, 3, 5, 3);

    expect(ready.key).toBe('ready');
    expect(ready.durationMs).toBe(READY_DURATION_MS);
    expect(ready.remainingMs).toBe(3_000);
    expect(ready.progress).toBeCloseTo(0.4);
  });

  it('returns feedback phase timing with correct duration and progress', () => {
    const feedback = calcDisplayPhaseTiming('feedback', 4_000, 3, 5, 3);

    expect(feedback.key).toBe('feedback');
    expect(feedback.durationMs).toBe(FEEDBACK_DURATION_MS);
    expect(feedback.remainingMs).toBe(4_000);
    expect(feedback.progress).toBeCloseTo(1 / 3);
  });
});

describe('actionHint', () => {
  it('uses the same user-facing label for contract and hold', () => {
    expect(actionHint('contract')).toBe('收缩并保持');
    expect(actionHint('hold')).toBe('收缩并保持');
    expect(actionHint('relax')).toBe('慢慢放松');
  });

  it('returns correct hints for ready and feedback phases', () => {
    expect(actionHint('ready')).toBe('准备开始');
    expect(actionHint('feedback')).toBe('训练完成');
  });
});
