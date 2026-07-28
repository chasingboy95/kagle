import type { StorageSchema } from '../utils/storage';
import { defineSchema } from '../utils/storage';

/** 训练配置 */
export interface TrainingConfig {
  contractTime: number;
  holdTime: number;
  relaxTime: number;
  rounds: number;
}

/** 训练状态枚举 */
export type TrainingStatus = 'idle' | 'running' | 'paused' | 'finished' | 'feedback';

/** 训练阶段枚举 */
export type TrainingPhase =
  | 'idle'
  | 'ready'
  | 'contract'
  | 'hold'
  | 'relax'
  | 'feedback';

/** 引擎运行时快照 */
export interface EngineState {
  status: TrainingStatus;
  phase: TrainingPhase;
  currentRound: number;
  phaseRemainingMs: number;
  totalElapsedMs: number;
  totalDurationMs: number;
}

export const DEFAULT_CONFIG: TrainingConfig = {
  contractTime: 3,
  holdTime: 3,
  relaxTime: 3,
  rounds: 10,
};

export const CONFIG_RANGE = {
  contractTime: { min: 3, max: 20, step: 1 },
  holdTime: { min: 1, max: 30, step: 1 },
  relaxTime: { min: 3, max: 20, step: 1 },
  rounds: { min: 1, max: 50, step: 1 },
} as const;

function clampConfig(key: keyof typeof CONFIG_RANGE, value: number): number {
  const range = CONFIG_RANGE[key];
  if (value < range.min) return range.min;
  if (value > range.max) return range.max;
  return value;
}

/** Storage schema for training config.
 *  Key: kegel.training-config.v1 */
export const TRAINING_CONFIG_SCHEMA: StorageSchema<TrainingConfig> = defineSchema({
  category: 'training-config',
  version: 1,
  defaultValue: DEFAULT_CONFIG,
  validate(value: unknown): TrainingConfig {
    if (!value || typeof value !== 'object') return { ...DEFAULT_CONFIG };
    const v = value as Record<string, unknown>;
    return {
      contractTime: typeof v.contractTime === 'number' && Number.isFinite(v.contractTime)
        ? clampConfig('contractTime', Math.round(v.contractTime))
        : DEFAULT_CONFIG.contractTime,
      holdTime: typeof v.holdTime === 'number' && Number.isFinite(v.holdTime)
        ? clampConfig('holdTime', Math.round(v.holdTime))
        : DEFAULT_CONFIG.holdTime,
      relaxTime: typeof v.relaxTime === 'number' && Number.isFinite(v.relaxTime)
        ? clampConfig('relaxTime', Math.round(v.relaxTime))
        : DEFAULT_CONFIG.relaxTime,
      rounds: typeof v.rounds === 'number' && Number.isFinite(v.rounds)
        ? clampConfig('rounds', Math.round(v.rounds))
        : DEFAULT_CONFIG.rounds,
    };
  },
});


/* ── Training Presets ──────────────────────────────────────────── */

export interface TrainingPreset {
  id: string;
  label: string;
  /** Short description shown in the preset selector. */
  description: string;
  config: TrainingConfig;
}

/** Detects which preset matches the given config, or null if none match. */
export function resolvePreset(config: TrainingConfig): TrainingPreset | null {
  return TRAINING_PRESETS.find(
    (p) =>
      p.config.contractTime === config.contractTime &&
      p.config.holdTime === config.holdTime &&
      p.config.relaxTime === config.relaxTime &&
      p.config.rounds === config.rounds,
  ) ?? null;
}

export const TRAINING_PRESETS: TrainingPreset[] = [
  {
    id: 'gentle',
    label: '轻松入门',
    description: '低强度，适合初次尝试凯格尔训练',
    config: { contractTime: 3, holdTime: 3, relaxTime: 3, rounds: 5 },
  },
  {
    id: 'daily',
    label: '日常训练',
    description: '中等强度，适合日常维持',
    config: { contractTime: 3, holdTime: 3, relaxTime: 3, rounds: 10 },
  },
  {
    id: 'endurance',
    label: '耐力提升',
    description: '延长保持时间，逐步增强耐力',
    config: { contractTime: 5, holdTime: 8, relaxTime: 5, rounds: 10 },
  },
];

/* ── Training History ──────────────────────────────────────────── */

/** Completion status of a training session. */
export type CompletionStatus = 'completed' | 'stopped';

/** A single training session record. */
export type ComfortFeedback = 'comfortable' | 'slightly_hard' | 'painful';

export interface TrainingRecord {
  /** Unique ID, e.g. timestamp-based. */
  id: string;
  /** ISO 8601 start time. */
  startedAt: string;
  /** ISO 8601 end time (may equal startedAt if stopped immediately). */
  endedAt: string;
  /** Configured contract seconds. */
  contractSec: number;
  /** Configured hold seconds. */
  holdSec: number;
  /** Configured relax seconds. */
  relaxSec: number;
  /** Target repetitions (configured rounds). */
  targetReps: number;
  /** Actually completed repetitions (currentRound at stop/completion). */
  completedReps: number;
  /** How the session ended. */
  status: CompletionStatus;
  /** Actual elapsed training time in ms (excludes pause duration). */
  actualDurationMs: number;
  /** Optional post-training comfort feedback. */
  comfortFeedback?: ComfortFeedback;
}

/** Keep the most recent sessions within a predictable localStorage budget. */
export const TRAINING_HISTORY_MAX_RECORDS = 500;

const ISO_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/;

function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = ISO_TIMESTAMP_PATTERN.exec(value);
  if (!match) return false;

  const [, year, month, day, hour, minute, second, fraction = '0'] = match;
  const parts = [year, month, day, hour, minute, second].map(Number);
  const [y, m, d, h, min, sec] = parts;
  const ms = Number(fraction.padEnd(3, '0'));
  const wallTime = new Date(Date.UTC(y, m - 1, d, h, min, sec, ms));
  const fieldsAreValid =
    wallTime.getUTCFullYear() === y
    && wallTime.getUTCMonth() === m - 1
    && wallTime.getUTCDate() === d
    && wallTime.getUTCHours() === h
    && wallTime.getUTCMinutes() === min
    && wallTime.getUTCSeconds() === sec
    && wallTime.getUTCMilliseconds() === ms;
  return fieldsAreValid && Number.isFinite(Date.parse(value));
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return isFiniteNonNegative(value) && Number.isInteger(value);
}

function isTrainingRecord(value: unknown): value is TrainingRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (!isValidIsoTimestamp(v.startedAt) || !isValidIsoTimestamp(v.endedAt)) {
    return false;
  }
  return typeof v.id === 'string'
    && Date.parse(v.endedAt) >= Date.parse(v.startedAt)
    && isFiniteNonNegative(v.contractSec)
    && isFiniteNonNegative(v.holdSec)
    && isFiniteNonNegative(v.relaxSec)
    && isNonNegativeInteger(v.targetReps)
    && isNonNegativeInteger(v.completedReps)
    && v.completedReps <= v.targetReps
    && (v.status === 'completed' || v.status === 'stopped')
    && isFiniteNonNegative(v.actualDurationMs);
}

export function normalizeTrainingHistory(value: unknown): TrainingRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isTrainingRecord)
    .sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt))
    .slice(0, TRAINING_HISTORY_MAX_RECORDS);
}

 
 /** localStorage key for pre-clear backup of training history. */
 export const CLEAR_ALL_BACKUP_KEY = 'kegel.clear-all-backup.v1';
 
 /** Storage schema for training history.
  *  Key: kegel.training-history.v1 */
export const TRAINING_HISTORY_SCHEMA: StorageSchema<TrainingRecord[]> = defineSchema({
  category: 'training-history',
  version: 1,
  defaultValue: [] as TrainingRecord[],
  validate(value: unknown): TrainingRecord[] {
    return normalizeTrainingHistory(value);
  },
});


/* ── Session Recovery Snapshot ──────────────────────────────────────────── */

/** Snapshot of an in-progress training session, saved to localStorage
 *  so the user can resume after a page refresh or tab close. */
export interface SessionSnapshot {
  status: 'running' | 'paused' | 'feedback';
  phase: TrainingPhase;
  round: number;
  /** How many ms of the current phase have elapsed. */
  phaseElapsedMs: number;
  /** Total session elapsed ms (excludes pauses). */
  sessionElapsedMs: number;
  totalPausedMs: number;
  config: TrainingConfig;
  announcedCountdowns: number[];
  sessionStartedAtIso: string;
}

const RECOVERABLE_PHASES: TrainingPhase[] = [
  'ready',
  'contract',
  'hold',
  'relax',
];

function isStrictTrainingConfig(value: unknown): value is TrainingConfig {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<keyof TrainingConfig, unknown>;
  const normalized = TRAINING_CONFIG_SCHEMA.validate(value);
  return (Object.keys(CONFIG_RANGE) as Array<keyof TrainingConfig>).every(
    (key) =>
      typeof candidate[key] === 'number'
      && Number.isFinite(candidate[key])
      && Number.isInteger(candidate[key])
      && candidate[key] === normalized[key],
  );
}

function isRecoverableStatusPhase(
  status: unknown,
  phase: unknown,
): status is SessionSnapshot['status'] {
  if (status === 'feedback') return phase === 'feedback';
  return (status === 'running' || status === 'paused')
    && typeof phase === 'string'
    && RECOVERABLE_PHASES.includes(phase as TrainingPhase);
}

/** Storage schema for the session snapshot. Key: kegel.session-snapshot.v1 */
export const SESSION_SNAPSHOT_SCHEMA = defineSchema<SessionSnapshot | null>({
  category: 'session-snapshot',
  version: 1,
  defaultValue: null,
  validate(value: unknown): SessionSnapshot | null {
    if (!value || typeof value !== 'object') return null;
    const v = value as Record<string, unknown>;
    if (!isRecoverableStatusPhase(v.status, v.phase)) return null;
    if (!isStrictTrainingConfig(v.config)) return null;
    if (
      !isNonNegativeInteger(v.round)
      || v.round >= v.config.rounds
    ) return null;
    if (!isFiniteNonNegative(v.phaseElapsedMs)) return null;
    if (!isFiniteNonNegative(v.sessionElapsedMs)) return null;
    if (!isFiniteNonNegative(v.totalPausedMs)) return null;
    if (
      !Array.isArray(v.announcedCountdowns)
      || !v.announcedCountdowns.every(
        (seconds) =>
          Number.isInteger(seconds)
          && seconds >= 1
          && seconds <= 5,
      )
    ) return null;
    if (!isValidIsoTimestamp(v.sessionStartedAtIso)) return null;
    return value as SessionSnapshot;
  },
});
