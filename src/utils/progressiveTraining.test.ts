import { describe, it, expect } from 'vitest';
import { evaluateSuggestion, DEFAULT_PROGRESSIVE_STATE, type ProgressiveSuggestionState } from './progressiveTraining';
import type { TrainingRecord, TrainingConfig } from '../types/training';
import { CONFIG_RANGE } from '../types/training';

let recordSequence = 0;

function makeRecord(overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  // Callers list records newest-first. Give each generated record a
  // deterministic, strictly decreasing time so equal-millisecond timestamps
  // cannot make the feedback tests depend on the runtime's sort behavior.
  const now = new Date(Date.UTC(2026, 0, 1) - recordSequence * 1_000);
  recordSequence += 1;
  return {
    id: Math.random().toString(36).slice(2),
    startedAt: now.toISOString(),
    endedAt: now.toISOString(),
    contractSec: 3,
    holdSec: 3,
    relaxSec: 3,
    targetReps: 10,
    completedReps: 10,
    status: 'completed',
    actualDurationMs: 90000,
    ...overrides,
  };
}

function freshState(): ProgressiveSuggestionState {
  return { ...DEFAULT_PROGRESSIVE_STATE };
}

describe('evaluateSuggestion', () => {
  it('does not mutate the input record order', () => {
    const records = [
      makeRecord({ id: 'middle', endedAt: '2026-07-27T12:00:00.000Z' }),
      makeRecord({ id: 'newest', endedAt: '2026-07-28T12:00:00.000Z' }),
      makeRecord({ id: 'oldest', endedAt: '2026-07-26T12:00:00.000Z' }),
    ];
    const originalOrder = records.map((record) => record.id);

    evaluateSuggestion(records, freshState());

    expect(records.map((record) => record.id)).toEqual(originalOrder);
  });

  it('returns null when not enough completed records', () => {
    const records = [makeRecord(), makeRecord()];
    expect(evaluateSuggestion(records, freshState())).toBeNull();
  });

  it('returns null when configs differ', () => {
    const records = [
      makeRecord({ holdSec: 4 }),
      makeRecord({ holdSec: 3 }),
      makeRecord({ holdSec: 5 }),
    ];
    expect(evaluateSuggestion(records, freshState())).toBeNull();
  });

  it('returns upgrade suggestion when 3 consecutive same-config completions', () => {
    const records = [makeRecord(), makeRecord(), makeRecord()];
    const suggestion = evaluateSuggestion(records, freshState());
    expect(suggestion).not.toBeNull();
    expect(suggestion!.type).toBe('upgrade');
    expect(suggestion!.changedKey).toBe('holdTime');
    expect(suggestion!.after.holdTime).toBe(4);
  });

  it('respects cooldown after dismiss', () => {
    const records = [makeRecord(), makeRecord(), makeRecord()];
    const state = freshState();
    state.lastAction = 'dismiss';
    state.lastSuggestedAt = new Date().toISOString(); // just dismissed
    expect(evaluateSuggestion(records, state, new Date())).toBeNull();
  });

  it('allows suggestion after cooldown expires', () => {
    const records = [makeRecord(), makeRecord(), makeRecord()];
    const state = freshState();
    state.lastAction = 'dismiss';
    state.lastSuggestedAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(); // 4 days ago
    const suggestion = evaluateSuggestion(records, state, new Date());
    expect(suggestion).not.toBeNull();
  });

  it('returns null when all params at cap', () => {
    const maxConfig: TrainingConfig = {
      contractTime: CONFIG_RANGE.contractTime.max,
      holdTime: CONFIG_RANGE.holdTime.max,
      relaxTime: CONFIG_RANGE.relaxTime.max,
      rounds: CONFIG_RANGE.rounds.max,
    };
    const records = [
      makeRecord({ contractSec: maxConfig.contractTime, holdSec: maxConfig.holdTime, relaxSec: maxConfig.relaxTime, targetReps: maxConfig.rounds }),
      makeRecord({ contractSec: maxConfig.contractTime, holdSec: maxConfig.holdTime, relaxSec: maxConfig.relaxTime, targetReps: maxConfig.rounds }),
      makeRecord({ contractSec: maxConfig.contractTime, holdSec: maxConfig.holdTime, relaxSec: maxConfig.relaxTime, targetReps: maxConfig.rounds }),
    ];
    expect(evaluateSuggestion(records, freshState())).toBeNull();
  });

  it('only suggests one parameter change', () => {
    const records = [makeRecord({ holdSec: 3 }), makeRecord({ holdSec: 3 }), makeRecord({ holdSec: 3 })];
    const suggestion = evaluateSuggestion(records, freshState());
    expect(suggestion).not.toBeNull();
    expect(suggestion!.type).toBe('upgrade');
    // Count how many fields differ
    let diffs = 0;
    for (const key of Object.keys(suggestion!.before) as (keyof TrainingConfig)[]) {
      if (suggestion!.before[key] !== suggestion!.after[key]) diffs++;
    }
    expect(diffs).toBe(1);
  });

  it('suggests rounds increase when holdTime is at cap', () => {
    const records = [
      makeRecord({ holdSec: CONFIG_RANGE.holdTime.max, targetReps: 10 }),
      makeRecord({ holdSec: CONFIG_RANGE.holdTime.max, targetReps: 10 }),
      makeRecord({ holdSec: CONFIG_RANGE.holdTime.max, targetReps: 10 }),
    ];
    const suggestion = evaluateSuggestion(records, freshState());
    expect(suggestion).not.toBeNull();
    expect(suggestion!.type).toBe('upgrade');
    expect(suggestion!.changedKey).toBe('rounds');
    expect(suggestion!.after.rounds).toBe(12);
  });

  it('does not suggest when ignoreCount >= 3 within cooldown', () => {
    const records = [makeRecord(), makeRecord(), makeRecord()];
    const state = freshState();
    state.ignoreCount = 3;
    state.lastSuggestedAt = new Date().toISOString();
    state.lastAction = 'ignore';
    expect(evaluateSuggestion(records, state, new Date())).toBeNull();
  });

  // ── Comfort feedback tests ────────────────────────────────

  it('returns downgrade suggestion when most recent record has painful feedback', () => {
    const records = [
      makeRecord({ comfortFeedback: 'painful' }),
      makeRecord({ comfortFeedback: 'comfortable' }),
      makeRecord({ comfortFeedback: 'comfortable' }),
    ];
    const suggestion = evaluateSuggestion(records, freshState());
    expect(suggestion).not.toBeNull();
    expect(suggestion!.type).toBe('downgrade');
    // Should suggest decreasing a parameter
    const key = suggestion!.changedKey;
    expect(suggestion!.after[key]).toBeLessThan(suggestion!.before[key]);
  });

  it('returns maintain suggestion when painful but already at min', () => {
    const records = [
      makeRecord({
        contractSec: CONFIG_RANGE.contractTime.min,
        holdSec: CONFIG_RANGE.holdTime.min,
        relaxSec: CONFIG_RANGE.relaxTime.min,
        targetReps: CONFIG_RANGE.rounds.min,
        comfortFeedback: 'painful',
      }),
      makeRecord({
        contractSec: CONFIG_RANGE.contractTime.min,
        holdSec: CONFIG_RANGE.holdTime.min,
        relaxSec: CONFIG_RANGE.relaxTime.min,
        targetReps: CONFIG_RANGE.rounds.min,
        comfortFeedback: 'comfortable',
      }),
      makeRecord({
        contractSec: CONFIG_RANGE.contractTime.min,
        holdSec: CONFIG_RANGE.holdTime.min,
        relaxSec: CONFIG_RANGE.relaxTime.min,
        targetReps: CONFIG_RANGE.rounds.min,
        comfortFeedback: 'comfortable',
      }),
    ];
    const suggestion = evaluateSuggestion(records, freshState());
    expect(suggestion).not.toBeNull();
    expect(suggestion!.type).toBe('maintain');
  });

  it('returns null when most recent record has slightly_hard feedback', () => {
    const records = [
      makeRecord({ comfortFeedback: 'slightly_hard' }),
      makeRecord({ comfortFeedback: 'comfortable' }),
      makeRecord({ comfortFeedback: 'comfortable' }),
    ];
    expect(evaluateSuggestion(records, freshState())).toBeNull();
  });

  it('returns upgrade suggestion when most recent record has comfortable feedback', () => {
    const records = [
      makeRecord({ comfortFeedback: 'comfortable' }),
      makeRecord({ comfortFeedback: 'comfortable' }),
      makeRecord({ comfortFeedback: 'comfortable' }),
    ];
    const suggestion = evaluateSuggestion(records, freshState());
    expect(suggestion).not.toBeNull();
    expect(suggestion!.type).toBe('upgrade');
  });

  it('returns upgrade suggestion when most recent record has no comfort feedback', () => {
    const records = [makeRecord(), makeRecord(), makeRecord()];
    const suggestion = evaluateSuggestion(records, freshState());
    expect(suggestion).not.toBeNull();
    expect(suggestion!.type).toBe('upgrade');
  });

  it('respects permanent dismiss even with painful feedback', () => {
    const records = [
      makeRecord({ comfortFeedback: 'painful' }),
      makeRecord({ comfortFeedback: 'comfortable' }),
      makeRecord({ comfortFeedback: 'comfortable' }),
    ];
    const state = freshState();
    state.dismissedPermanently = true;
    expect(evaluateSuggestion(records, state)).toBeNull();
  });
});
