import { describe, expect, it } from 'vitest';
import {
  normalizeTrainingHistory,
  SESSION_SNAPSHOT_SCHEMA,
  type SessionSnapshot,
  type TrainingRecord,
} from './training';

function record(overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  return {
    id: 'valid',
    startedAt: '2026-07-28T10:00:00.000Z',
    endedAt: '2026-07-28T10:01:30.000Z',
    contractSec: 3,
    holdSec: 3,
    relaxSec: 3,
    targetReps: 10,
    completedReps: 10,
    status: 'completed',
    actualDurationMs: 90_000,
    ...overrides,
  };
}

describe('normalizeTrainingHistory validation', () => {
  it('keeps valid boundary values and ISO timestamps with offsets', () => {
    const boundary = record({
      id: 'boundary',
      startedAt: '2026-07-28T14:00:00+04:00',
      endedAt: '2026-07-28T14:00:00+04:00',
      contractSec: 0,
      holdSec: 0,
      relaxSec: 0,
      targetReps: 0,
      completedReps: 0,
      actualDurationMs: 0,
      status: 'stopped',
    });

    expect(normalizeTrainingHistory([boundary])).toEqual([boundary]);
  });

  it.each([
    ['non-ISO start', { startedAt: '2026-07-28' }],
    ['invalid calendar date', { endedAt: '2026-02-30T10:01:30.000Z' }],
    ['invalid time', { endedAt: '2026-07-28T25:01:30.000Z' }],
    ['unparseable end', { endedAt: 'not-a-date' }],
    ['end before start', { endedAt: '2026-07-28T09:59:59.999Z' }],
  ])('drops a record with %s', (_case, overrides) => {
    expect(normalizeTrainingHistory([record(overrides)])).toEqual([]);
  });

  it.each([
    ['contractSec', -1],
    ['holdSec', Number.NaN],
    ['relaxSec', Number.POSITIVE_INFINITY],
    ['targetReps', -1],
    ['completedReps', -1],
    ['actualDurationMs', -1],
  ] as const)('drops a record when %s is not finite and non-negative', (field, value) => {
    expect(normalizeTrainingHistory([record({ [field]: value })])).toEqual([]);
  });

  it.each([
    ['targetReps', 1.5],
    ['completedReps', 1.5],
  ] as const)('drops a record when %s is not an integer', (field, value) => {
    expect(normalizeTrainingHistory([record({ [field]: value })])).toEqual([]);
  });

  it('drops a record when completed repetitions exceed the target', () => {
    expect(normalizeTrainingHistory([
      record({ targetReps: 9, completedReps: 10 }),
    ])).toEqual([]);
  });

  it('drops only corrupt entries and keeps valid entries sorted newest-first', () => {
    const older = record({
      id: 'older',
      startedAt: '2026-07-27T10:00:00.000Z',
      endedAt: '2026-07-27T10:01:30.000Z',
    });
    const corrupt = record({ id: 'corrupt', actualDurationMs: Number.NaN });
    const newer = record({ id: 'newer' });

    expect(normalizeTrainingHistory([older, corrupt, newer]).map(({ id }) => id))
      .toEqual(['newer', 'older']);
  });
});

function snapshot(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return {
    status: 'running',
    phase: 'contract',
    round: 0,
    phaseElapsedMs: 500,
    sessionElapsedMs: 5_500,
    totalPausedMs: 0,
    config: {
      contractTime: 3,
      holdTime: 3,
      relaxTime: 3,
      rounds: 10,
      sets: 1,
      restBetweenSets: 30,
    },
    announcedCountdowns: [3, 2, 1],
    sessionStartedAtIso: '2026-07-28T10:00:00.000Z',
    ...overrides,
  };
}

describe('SESSION_SNAPSHOT_SCHEMA validation', () => {
  it.each([
    snapshot({ status: 'running', phase: 'ready', round: 0 }),
    snapshot({ status: 'paused', phase: 'hold', round: 5 }),
    snapshot({ status: 'feedback', phase: 'feedback', round: 9 }),
  ])('accepts a recoverable boundary snapshot', (value) => {
    expect(SESSION_SNAPSHOT_SCHEMA.validate(value)).toEqual(value);
  });

  it.each([
    ['unknown status', { status: 'finished' }],
    ['unknown phase', { phase: 'unknown' }],
    ['feedback status in an active phase', { status: 'feedback', phase: 'relax' }],
    ['active status in feedback', { status: 'running', phase: 'feedback' }],
    ['negative round', { round: -1 }],
    ['fractional round', { round: 1.5 }],
    ['round equal to configured count', { round: 10 }],
    ['negative phase time', { phaseElapsedMs: -1 }],
    ['non-finite session time', { sessionElapsedMs: Number.POSITIVE_INFINITY }],
    ['non-finite paused time', { totalPausedMs: Number.NaN }],
    ['invalid start timestamp', { sessionStartedAtIso: '2026-02-30T10:00:00Z' }],
    ['countdown outside supported range', { announcedCountdowns: [6] }],
    ['fractional countdown', { announcedCountdowns: [2.5] }],
  ])('rejects %s', (_case, overrides) => {
    expect(SESSION_SNAPSHOT_SCHEMA.validate(snapshot(
      overrides as Partial<SessionSnapshot>,
    ))).toBeNull();
  });

  it.each([
    ['missing config field', { contractTime: 3, holdTime: 3, rounds: 10 }],
    ['out-of-range contract time', { contractTime: 2, holdTime: 3, relaxTime: 3, rounds: 10 }],
    ['out-of-range hold time', { contractTime: 3, holdTime: 31, relaxTime: 3, rounds: 10 }],
    ['fractional repetitions', { contractTime: 3, holdTime: 3, relaxTime: 3, rounds: 2.5 }],
    ['non-finite relaxation time', { contractTime: 3, holdTime: 3, relaxTime: Number.NaN, rounds: 10 }],
  ])('rejects a snapshot with %s', (_case, config) => {
    expect(SESSION_SNAPSHOT_SCHEMA.validate(snapshot({
      config: config as SessionSnapshot['config'],
    }))).toBeNull();
  });

  it.each([null, 42, [], 'legacy'])('rejects non-snapshot input: %j', (value) => {
    expect(SESSION_SNAPSHOT_SCHEMA.validate(value)).toBeNull();
  });
});
