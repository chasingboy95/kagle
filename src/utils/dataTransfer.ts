import {
  TRAINING_CONFIG_SCHEMA,
  TRAINING_HISTORY_SCHEMA,
  normalizeTrainingHistory,
  type TrainingConfig,
  type TrainingRecord,
} from '../types/training';
import {
  PROGRESSIVE_SCHEMA,
  SAVED_CONFIGS_SCHEMA,
  WEEKLY_GOAL_SCHEMA,
  type SavedTrainingConfig,
  type WeeklyGoalSettings,
} from './appStorageSchemas';
import {
  createStorageAdapter,
  type MinimalStorage,
  type StorageSchema,
} from './storage';
import {
  loadVoiceSettings,
  validateVoiceSettings,
  VOICE_SETTINGS_KEY,
} from '../voice/voiceSettings';
import type { VoiceSettings } from '../voice/types';
import type { ProgressiveSuggestionState } from './progressiveTraining';

export const DATA_EXPORT_SCHEMA_VERSION = 1;
export const IMPORT_BACKUP_KEY = 'kegel.import-backup.v1';
export const CLEAR_ALL_BACKUP_KEY = 'kegel.clear-all-backup.v1';

export interface ExportedAppData {
  trainingConfig: TrainingConfig;
  voiceSettings: VoiceSettings;
  trainingHistory: TrainingRecord[];
  progressiveState: ProgressiveSuggestionState;
  weeklyGoal: WeeklyGoalSettings;
  savedConfigs: SavedTrainingConfig[];
}

export interface AppDataExport {
  schemaVersion: typeof DATA_EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  data: ExportedAppData;
}

export type ImportStrategy = 'replace' | 'merge-history' | 'settings-only';

export interface ImportPreview {
  schemaVersion: number;
  exportedAt: string;
  historyCount: number;
  completedCount: number;
  stoppedCount: number;
  savedConfigCount: number;
  trainingSummary: string;
}

function schemaKey(schema: StorageSchema<unknown>): string {
  return `kegel.${schema.category}.v${schema.version}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isCanonicalIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function hasExactConfig(value: unknown): value is TrainingConfig {
  if (!isPlainObject(value)) return false;
  const normalized = TRAINING_CONFIG_SCHEMA.validate(value);
  return value.contractTime === normalized.contractTime
    && value.holdTime === normalized.holdTime
    && value.relaxTime === normalized.relaxTime
    && value.rounds === normalized.rounds
    && Number.isInteger(value.contractTime)
    && Number.isInteger(value.holdTime)
    && Number.isInteger(value.relaxTime)
    && Number.isInteger(value.rounds);
}

function hasExactVoiceSettings(value: unknown): value is VoiceSettings {
  if (!isPlainObject(value)) return false;
  const normalized = validateVoiceSettings(value);
  const requiredKeys: Array<keyof VoiceSettings> = [
    'enabled',
    'mode',
    'language',
    'volume',
    'rate',
    'pitch',
    'countdownFrom',
    'announceRound',
    'announceNextStage',
    'hapticsEnabled',
  ];
  return requiredKeys.every((key) => value[key] === normalized[key])
    && (
      value.voiceName === undefined
      || (
        typeof value.voiceName === 'string'
        && value.voiceName.trim().length > 0
        && value.voiceName === normalized.voiceName
      )
    );
}

function hasExactProgressiveState(
  value: unknown,
): value is ProgressiveSuggestionState {
  if (!isPlainObject(value)) return false;
  return (
    value.lastSuggestedAt === ''
    || isCanonicalIsoTimestamp(value.lastSuggestedAt)
  )
    && (
      value.lastAction === null
      || value.lastAction === 'accept'
      || value.lastAction === 'ignore'
      || value.lastAction === 'dismiss'
    )
    && typeof value.ignoreCount === 'number'
    && Number.isInteger(value.ignoreCount)
    && value.ignoreCount >= 0
    && typeof value.dismissedPermanently === 'boolean';
}

function hasExactWeeklyGoal(value: unknown): value is WeeklyGoalSettings {
  if (!isPlainObject(value)) return false;
  return typeof value.enabled === 'boolean'
    && typeof value.targetDays === 'number'
    && Number.isInteger(value.targetDays)
    && value.targetDays >= 1
    && value.targetDays <= 7;
}

function hasExactSavedConfigs(value: unknown): value is SavedTrainingConfig[] {
  if (!Array.isArray(value)) return false;
  const normalized = SAVED_CONFIGS_SCHEMA.validate(value);
  return normalized.length === value.length
    && JSON.stringify(normalized) === JSON.stringify(value);
}

function hasExactHistory(value: unknown): value is TrainingRecord[] {
  if (!Array.isArray(value)) return false;
  const normalized = TRAINING_HISTORY_SCHEMA.validate(value);
  return normalized.length === value.length
    && value.every((record) => (
      isPlainObject(record)
      && typeof record.id === 'string'
      && record.id.length > 0
    ));
}

function validateExport(value: unknown): AppDataExport {
  if (!isPlainObject(value)) throw new Error('文件不是有效的数据备份。');
  if (value.schemaVersion !== DATA_EXPORT_SCHEMA_VERSION) {
    throw new Error('该备份版本暂不受支持。');
  }
  if (!isCanonicalIsoTimestamp(value.exportedAt) || !isPlainObject(value.data)) {
    throw new Error('备份元数据无效。');
  }

  const data = value.data;
  if (
    !hasExactConfig(data.trainingConfig)
    || !hasExactVoiceSettings(data.voiceSettings)
    || !hasExactHistory(data.trainingHistory)
    || !hasExactProgressiveState(data.progressiveState)
    || !hasExactWeeklyGoal(data.weeklyGoal)
    || !hasExactSavedConfigs(data.savedConfigs)
  ) {
    throw new Error('备份包含无效或损坏的数据。');
  }

  return {
    schemaVersion: DATA_EXPORT_SCHEMA_VERSION,
    exportedAt: value.exportedAt,
    data: {
      trainingConfig: { ...data.trainingConfig },
      voiceSettings: { ...data.voiceSettings },
      trainingHistory: normalizeTrainingHistory(data.trainingHistory),
      progressiveState: { ...data.progressiveState },
      weeklyGoal: { ...data.weeklyGoal },
      savedConfigs: data.savedConfigs.map((item) => ({
        ...item,
        config: { ...item.config },
      })),
    },
  };
}

export function createDataExport(
  storage: MinimalStorage = globalThis.localStorage,
  now = new Date(),
): AppDataExport {
  const adapter = createStorageAdapter(storage);
  const progressiveState = adapter.read(PROGRESSIVE_SCHEMA);
  return {
    schemaVersion: DATA_EXPORT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data: {
      trainingConfig: adapter.read(TRAINING_CONFIG_SCHEMA),
      voiceSettings: loadVoiceSettings(storage),
      trainingHistory: adapter.read(TRAINING_HISTORY_SCHEMA),
      progressiveState: {
        ...progressiveState,
        lastSuggestedAt: progressiveState.lastSuggestedAt === ''
          || isCanonicalIsoTimestamp(progressiveState.lastSuggestedAt)
          ? progressiveState.lastSuggestedAt
          : '',
      },
      weeklyGoal: adapter.read(WEEKLY_GOAL_SCHEMA),
      savedConfigs: adapter.read(SAVED_CONFIGS_SCHEMA),
    },
  };
}

export function serializeDataExport(data: AppDataExport): string {
  return JSON.stringify(data, null, 2);
}

export function parseDataImport(raw: string): AppDataExport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('无法读取该 JSON 文件。');
  }
  return validateExport(parsed);
}

export function summarizeDataImport(data: AppDataExport): ImportPreview {
  const completedCount = data.data.trainingHistory.filter(
    (record) => record.status === 'completed',
  ).length;
  return {
    schemaVersion: data.schemaVersion,
    exportedAt: data.exportedAt,
    historyCount: data.data.trainingHistory.length,
    completedCount,
    stoppedCount: data.data.trainingHistory.length - completedCount,
    savedConfigCount: data.data.savedConfigs.length,
    trainingSummary: `${data.data.trainingConfig.contractTime}-${data.data.trainingConfig.holdTime}-${data.data.trainingConfig.relaxTime} × ${data.data.trainingConfig.rounds} 次`,
  };
}

function mergeHistory(
  current: TrainingRecord[],
  incoming: TrainingRecord[],
): TrainingRecord[] {
  const byId = new Map<string, TrainingRecord>();
  for (const record of current) byId.set(record.id, record);
  for (const record of incoming) byId.set(record.id, record);
  return normalizeTrainingHistory([...byId.values()]);
}

function restoreRawValues(
  storage: MinimalStorage,
  before: Map<string, string | null>,
) {
  for (const [key, value] of before) {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  }
}

export function applyDataImport(
  candidate: AppDataExport,
  strategy: ImportStrategy,
  storage: MinimalStorage = globalThis.localStorage,
): AppDataExport {
  const imported = validateExport(candidate);
  const current = createDataExport(storage);
  const adapter = createStorageAdapter(storage);
  const history = strategy === 'replace'
    ? mergeHistory([], imported.data.trainingHistory)
    : strategy === 'merge-history'
      ? mergeHistory(current.data.trainingHistory, imported.data.trainingHistory)
      : current.data.trainingHistory;

  const entries = new Map<string, string>([
    [schemaKey(TRAINING_CONFIG_SCHEMA), JSON.stringify(imported.data.trainingConfig)],
    [VOICE_SETTINGS_KEY, JSON.stringify(imported.data.voiceSettings)],
    [schemaKey(PROGRESSIVE_SCHEMA), JSON.stringify(imported.data.progressiveState)],
    [schemaKey(WEEKLY_GOAL_SCHEMA), JSON.stringify(imported.data.weeklyGoal)],
    [schemaKey(SAVED_CONFIGS_SCHEMA), JSON.stringify(imported.data.savedConfigs)],
  ]);
  if (strategy !== 'settings-only') {
    entries.set(schemaKey(TRAINING_HISTORY_SCHEMA), JSON.stringify(history));
  }

  const before = new Map<string, string | null>();
  for (const key of entries.keys()) before.set(key, storage.getItem(key));

  try {
    storage.setItem(IMPORT_BACKUP_KEY, serializeDataExport(current));
    for (const [key, value] of entries) storage.setItem(key, value);
  } catch {
    try {
      restoreRawValues(storage, before);
    } catch {
      // The original values remain available in the import backup when storage
      // permits it; callers still receive a failure and do not reload the app.
    }
    throw new Error('导入未完成，现有数据保持不变。');
  }

  return {
    ...imported,
    data: {
      ...imported.data,
      trainingHistory: adapter.read(TRAINING_HISTORY_SCHEMA),
    },
  };
}
