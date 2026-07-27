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
}

function isTrainingRecord(value: unknown): value is TrainingRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string'
    && typeof v.startedAt === 'string'
    && typeof v.endedAt === 'string'
    && typeof v.contractSec === 'number'
    && typeof v.holdSec === 'number'
    && typeof v.relaxSec === 'number'
    && typeof v.targetReps === 'number'
    && typeof v.completedReps === 'number'
    && (v.status === 'completed' || v.status === 'stopped')
    && typeof v.actualDurationMs === 'number';
}

/** Storage schema for training history.
 *  Key: kegel.training-history.v1 */
export const TRAINING_HISTORY_SCHEMA: StorageSchema<TrainingRecord[]> = defineSchema({
  category: 'training-history',
  version: 1,
  defaultValue: [] as TrainingRecord[],
  validate(value: unknown): TrainingRecord[] {
    if (!Array.isArray(value)) return [];
    return value.filter(isTrainingRecord);
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

/** Storage schema for the session snapshot. Key: kegel.session-snapshot.v1 */
export const SESSION_SNAPSHOT_SCHEMA = defineSchema<SessionSnapshot | null>({
  category: 'session-snapshot',
  version: 1,
  defaultValue: null,
  validate(value: unknown): SessionSnapshot | null {
    if (!value || typeof value !== 'object') return null;
    const v = value as Record<string, unknown>;
    if (typeof v.status !== 'string' || !['running', 'paused', 'feedback'].includes(v.status)) return null;
    if (typeof v.phase !== 'string') return null;
    if (typeof v.round !== 'number') return null;
    if (typeof v.phaseElapsedMs !== 'number') return null;
    if (typeof v.sessionElapsedMs !== 'number') return null;
    if (typeof v.totalPausedMs !== 'number') return null;
    if (!v.config || typeof v.config !== 'object') return null;
    if (!Array.isArray(v.announcedCountdowns)) return null;
    if (typeof v.sessionStartedAtIso !== 'string') return null;
    return value as SessionSnapshot;
  },
});
