import { describe, expect, it } from 'vitest';
import { normalizeTrainingHistory, type TrainingRecord } from './training';

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
