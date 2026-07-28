import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type TrainingConfig, type TrainingPhase, type TrainingStatus } from '../types/training';
import {
  buildSessionResult,
  getActiveElapsedMs,
  getCompletedRepetitions,
  type SessionCalculationState,
} from './sessionResult';

function state(overrides: Partial<SessionCalculationState> = {}): SessionCalculationState {
  return {
    status: 'running',
    phase: 'ready',
    round: 0,
    sessionStartedAt: 1_000,
    sessionStartedAtIso: '2026-07-28T00:00:00.000Z',
    totalPausedMs: 0,
    pauseStartedAt: 0,
    feedbackElapsedSnapshot: 0,
    config: DEFAULT_CONFIG as TrainingConfig,
    ...overrides,
  };
}

describe('getCompletedRepetitions', () => {
  it.each<{
    status: TrainingStatus;
    phase: TrainingPhase;
    round: number;
    expected: number;
  }>([
    { status: 'running', phase: 'ready', round: 0, expected: 0 },
    { status: 'running', phase: 'contract', round: 0, expected: 0 },
    { status: 'running', phase: 'hold', round: 0, expected: 0 },
    { status: 'running', phase: 'relax', round: 0, expected: 0 },
    { status: 'running', phase: 'contract', round: 1, expected: 1 },
    { status: 'paused', phase: 'hold', round: 2, expected: 2 },
    { status: 'feedback', phase: 'feedback', round: 2, expected: 3 },
  ])('returns $expected completed repetitions for $status/$phase at round $round', ({ status, phase, round, expected }) => {
    expect(getCompletedRepetitions(state({ status, phase, round }))).toBe(expected);
  });

  it('returns zero for idle and clamps invalid negative rounds', () => {
    expect(getCompletedRepetitions(state({ status: 'idle', phase: 'idle', round: 5 }))).toBe(0);
    expect(getCompletedRepetitions(state({ round: -2 }))).toBe(0);
    expect(getCompletedRepetitions(state({ round: Number.NaN }))).toBe(0);
  });
});

describe('getActiveElapsedMs', () => {
  it('uses the current clock while running', () => {
    expect(getActiveElapsedMs(state({
      sessionStartedAt: 1_000,
      totalPausedMs: 2_000,
    }), 10_000)).toBe(7_000);
  });

  it('freezes at the pause boundary and resumes after accumulated pause time', () => {
    expect(getActiveElapsedMs(state({
      status: 'paused',
      sessionStartedAt: 1_000,
      pauseStartedAt: 8_000,
      totalPausedMs: 2_000,
    }), 50_000)).toBe(5_000);

    expect(getActiveElapsedMs(state({
      status: 'running',
      sessionStartedAt: 1_000,
      totalPausedMs: 6_000,
    }), 12_000)).toBe(5_000);
  });

  it('uses the frozen duration in feedback and sanitizes invalid clocks', () => {
    expect(getActiveElapsedMs(state({
      status: 'feedback',
      phase: 'feedback',
      feedbackElapsedSnapshot: 7_500,
    }), 50_000)).toBe(7_500);
    expect(getActiveElapsedMs(state({ sessionStartedAt: Number.NaN }), 10_000)).toBe(0);
    expect(getActiveElapsedMs(state({ sessionStartedAt: 20_000 }), 10_000)).toBe(0);
  });
});

describe('buildSessionResult', () => {
  it.each(['completed', 'stopped'] as const)('builds the canonical %s payload', (status) => {
    expect(buildSessionResult(state({
      status: 'feedback',
      phase: 'feedback',
      round: 2,
      feedbackElapsedSnapshot: 7_500,
    }), status, 50_000)).toEqual({
      completedReps: 3,
      actualDurationMs: 7_500,
      status,
      startedAt: '2026-07-28T00:00:00.000Z',
      config: DEFAULT_CONFIG,
    });
  });
});
