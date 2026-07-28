import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_CONFIG,
  type TrainingRecord,
} from '../types/training';
import { DEFAULT_VOICE_SETTINGS, VOICE_SETTINGS_KEY } from '../voice/voiceSettings';
import { DEFAULT_PROGRESSIVE_STATE } from './progressiveTraining';
import {
  DEFAULT_WEEKLY_GOAL,
  PROGRESSIVE_SCHEMA,
  SAVED_CONFIGS_SCHEMA,
  WEEKLY_GOAL_SCHEMA,
} from './appStorageSchemas';
import type { MinimalStorage, StorageSchema } from './storage';
import {
  applyDataImport,
  createDataExport,
  DATA_EXPORT_SCHEMA_VERSION,
  IMPORT_BACKUP_KEY,
  parseDataImport,
  serializeDataExport,
  summarizeDataImport,
  type AppDataExport,
} from './dataTransfer';

const completed: TrainingRecord = {
  id: 'shared-record',
  startedAt: '2026-07-27T08:00:00.000Z',
  endedAt: '2026-07-27T08:01:00.000Z',
  contractSec: 3,
  holdSec: 3,
  relaxSec: 3,
  targetReps: 10,
  completedReps: 10,
  status: 'completed',
  actualDurationMs: 60_000,
};

const stopped: TrainingRecord = {
  ...completed,
  id: 'stopped-record',
  endedAt: '2026-07-28T08:01:00.000Z',
  completedReps: 2,
  status: 'stopped',
  actualDurationMs: 20_000,
};

function key(schema: StorageSchema<unknown>) {
  return `kegel.${schema.category}.v${schema.version}`;
}

function validExport(overrides: Partial<AppDataExport['data']> = {}): AppDataExport {
  return {
    schemaVersion: DATA_EXPORT_SCHEMA_VERSION,
    exportedAt: '2026-07-28T03:00:00.000Z',
    data: {
      trainingConfig: { ...DEFAULT_CONFIG },
      voiceSettings: { ...DEFAULT_VOICE_SETTINGS },
      trainingHistory: [completed, stopped],
      progressiveState: { ...DEFAULT_PROGRESSIVE_STATE },
      weeklyGoal: { ...DEFAULT_WEEKLY_GOAL },
      savedConfigs: [],
      ...overrides,
    },
  };
}

describe('local data transfer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exports versioned metadata and every supported local data category', () => {
    localStorage.setItem('kegel.training-history.v1', JSON.stringify([completed]));
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify({
      ...DEFAULT_VOICE_SETTINGS,
      mode: 'sound-only',
    }));
    localStorage.setItem(key(SAVED_CONFIGS_SCHEMA), JSON.stringify([{
      id: 'morning',
      name: '早晨',
      config: { ...DEFAULT_CONFIG, rounds: 5 },
    }]));

    const data = createDataExport(
      localStorage,
      new Date('2026-07-28T03:00:00.000Z'),
    );
    expect(data).toMatchObject({
      schemaVersion: 1,
      exportedAt: '2026-07-28T03:00:00.000Z',
      data: {
        trainingConfig: DEFAULT_CONFIG,
        voiceSettings: { mode: 'sound-only' },
        trainingHistory: [{ id: 'shared-record' }],
        progressiveState: DEFAULT_PROGRESSIVE_STATE,
        weeklyGoal: DEFAULT_WEEKLY_GOAL,
        savedConfigs: [{ id: 'morning' }],
      },
    });
    expect(parseDataImport(serializeDataExport(data))).toEqual(data);
  });

  it('rejects unsupported versions, malformed JSON, and corrupt nested data', () => {
    expect(() => parseDataImport('{broken')).toThrow('无法读取');
    expect(() => parseDataImport(JSON.stringify({
      ...validExport(),
      schemaVersion: 2,
    }))).toThrow('版本');
    expect(() => parseDataImport(JSON.stringify(validExport({
      trainingConfig: { ...DEFAULT_CONFIG, rounds: 2.5 },
    })))).toThrow('损坏');
    expect(() => parseDataImport(JSON.stringify(validExport({
      trainingHistory: [{ ...completed, endedAt: '2026-02-30T08:00:00.000Z' }],
    })))).toThrow('损坏');
  });

  it('summarizes settings and completed/stopped history before import', () => {
    expect(summarizeDataImport(validExport({
      savedConfigs: [{
        id: 'night',
        name: '睡前',
        config: { contractTime: 5, holdTime: 8, relaxTime: 5, rounds: 10 },
      }],
    }))).toEqual({
      schemaVersion: 1,
      exportedAt: '2026-07-28T03:00:00.000Z',
      historyCount: 2,
      completedCount: 1,
      stoppedCount: 1,
      savedConfigCount: 1,
      trainingSummary: '3-3-3 × 10 次',
    });
  });

  it('replaces data only after creating an automatic backup', () => {
    localStorage.setItem('kegel.training-history.v1', JSON.stringify([{
      ...completed,
      id: 'current-only',
    }]));
    const imported = validExport({
      trainingConfig: { contractTime: 5, holdTime: 8, relaxTime: 5, rounds: 10 },
      trainingHistory: [stopped],
      weeklyGoal: { enabled: true, targetDays: 4 },
    });

    applyDataImport(imported, 'replace');

    const backup = parseDataImport(localStorage.getItem(IMPORT_BACKUP_KEY) ?? '');
    expect(backup.data.trainingHistory[0].id).toBe('current-only');
    expect(JSON.parse(localStorage.getItem('kegel.training-config.v1') ?? '{}')).toEqual(
      imported.data.trainingConfig,
    );
    expect(JSON.parse(localStorage.getItem('kegel.training-history.v1') ?? '[]')).toEqual([stopped]);
    expect(JSON.parse(localStorage.getItem(key(WEEKLY_GOAL_SCHEMA)) ?? '{}')).toEqual(
      imported.data.weeklyGoal,
    );
  });

  it('merges history by ID and lets the incoming duplicate win', () => {
    localStorage.setItem('kegel.training-history.v1', JSON.stringify([
      completed,
      {
        ...completed,
        id: 'local-only',
        startedAt: '2026-07-26T08:00:00.000Z',
        endedAt: '2026-07-26T08:01:00.000Z',
      },
    ]));
    const incomingDuplicate = {
      ...completed,
      actualDurationMs: 75_000,
    };

    applyDataImport(validExport({
      trainingHistory: [incomingDuplicate, stopped],
    }), 'merge-history');

    const history = JSON.parse(
      localStorage.getItem('kegel.training-history.v1') ?? '[]',
    ) as TrainingRecord[];
    expect(history.map((record) => record.id)).toEqual([
      'stopped-record',
      'shared-record',
      'local-only',
    ]);
    expect(history.find((record) => record.id === 'shared-record')?.actualDurationMs).toBe(75_000);
  });

  it('deduplicates repeated IDs when replacing history', () => {
    applyDataImport(validExport({
      trainingHistory: [
        completed,
        { ...completed, actualDurationMs: 90_000 },
      ],
    }), 'replace');

    const history = JSON.parse(
      localStorage.getItem('kegel.training-history.v1') ?? '[]',
    ) as TrainingRecord[];
    expect(history).toHaveLength(1);
    expect(history[0].actualDurationMs).toBe(90_000);
  });

  it('imports only settings without changing local history', () => {
    const localHistory = [{ ...completed, id: 'keep-local' }];
    localStorage.setItem('kegel.training-history.v1', JSON.stringify(localHistory));

    applyDataImport(validExport({
      trainingConfig: { ...DEFAULT_CONFIG, rounds: 5 },
      trainingHistory: [stopped],
    }), 'settings-only');

    expect(JSON.parse(localStorage.getItem('kegel.training-history.v1') ?? '[]')).toEqual(
      localHistory,
    );
    expect(JSON.parse(localStorage.getItem('kegel.training-config.v1') ?? '{}').rounds).toBe(5);
  });

  it('rolls back every changed key when a write fails', () => {
    class FailingStorage implements MinimalStorage {
      private values = new Map<string, string>();
      private failed = false;

      get length() { return this.values.size; }
      key(index: number) { return [...this.values.keys()][index] ?? null; }
      getItem(storageKey: string) { return this.values.get(storageKey) ?? null; }
      removeItem(storageKey: string) { this.values.delete(storageKey); }
      setItem(storageKey: string, value: string) {
        if (storageKey === VOICE_SETTINGS_KEY && !this.failed) {
          this.failed = true;
          throw new Error('quota');
        }
        this.values.set(storageKey, value);
      }
    }

    const storage = new FailingStorage();
    const currentConfig = { ...DEFAULT_CONFIG, rounds: 4 };
    storage.setItem('kegel.training-config.v1', JSON.stringify(currentConfig));

    expect(() => applyDataImport(validExport({
      trainingConfig: { ...DEFAULT_CONFIG, rounds: 20 },
    }), 'replace', storage)).toThrow('现有数据保持不变');
    expect(JSON.parse(storage.getItem('kegel.training-config.v1') ?? '{}')).toEqual(currentConfig);
    expect(storage.getItem(key(PROGRESSIVE_SCHEMA))).toBeNull();
  });
});
