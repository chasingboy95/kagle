import {
  DEFAULT_PROGRESSIVE_STATE,
  type ProgressiveSuggestionState,
} from './progressiveTraining';
import { defineSchema } from './storage';
import { CONFIG_RANGE, type TrainingConfig } from '../types/training';

export const MAX_SAVED_CONFIGS = 5;

export interface SavedTrainingConfig {
  id: string;
  name: string;
  config: TrainingConfig;
}

function isValidConfigValue(
  value: unknown,
  key: keyof TrainingConfig,
): value is number {
  const range = CONFIG_RANGE[key];
  return typeof value === 'number'
    && Number.isFinite(value)
    && Number.isInteger(value)
    && value >= range.min
    && value <= range.max;
}

function parseSavedConfig(value: unknown): SavedTrainingConfig | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string'
    || candidate.id.length < 1
    || candidate.id.length > 80
    || typeof candidate.name !== 'string'
  ) {
    return null;
  }

  const name = candidate.name.trim();
  const config = candidate.config;
  if (
    name.length < 1
    || name.length > 24
    || !config
    || typeof config !== 'object'
  ) {
    return null;
  }

  const fields = config as Record<string, unknown>;
  if (
    !isValidConfigValue(fields.contractTime, 'contractTime')
    || !isValidConfigValue(fields.holdTime, 'holdTime')
    || !isValidConfigValue(fields.relaxTime, 'relaxTime')
    || !isValidConfigValue(fields.rounds, 'rounds')
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name,
    config: {
      contractTime: fields.contractTime,
      holdTime: fields.holdTime,
      relaxTime: fields.relaxTime,
      rounds: fields.rounds,
      sets: isValidConfigValue(fields.sets, 'sets') ? fields.sets : 1,
      restBetweenSets: isValidConfigValue(fields.restBetweenSets, 'restBetweenSets') ? fields.restBetweenSets : 30,
    },
  };
}

export const SAVED_CONFIGS_SCHEMA = defineSchema<SavedTrainingConfig[]>({
  category: 'saved-configs',
  version: 2,
  defaultValue: [],
  validate(value: unknown): SavedTrainingConfig[] {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const valid: SavedTrainingConfig[] = [];
    for (const candidate of value) {
      const parsed = parseSavedConfig(candidate);
      if (!parsed || seen.has(parsed.id)) continue;
      seen.add(parsed.id);
      valid.push(parsed);
      if (valid.length === MAX_SAVED_CONFIGS) break;
    }
    return valid;
  },
  upgrades: [{
    fromVersion: 1,
    migrate(value: unknown): unknown {
      if (!Array.isArray(value)) return value;
      return value.map((candidate) => {
        if (!candidate || typeof candidate !== 'object') return candidate;
        const record = candidate as Record<string, unknown>;
        if ('config' in record) return candidate;
        return {
          id: record.id,
          name: record.name,
          config: {
            contractTime: record.contractTime,
            holdTime: record.holdTime,
            relaxTime: record.relaxTime,
            rounds: record.rounds,
          },
        };
      });
    },
  }],
});

export interface WeeklyGoalSettings {
  enabled: boolean;
  targetDays: number;
}

export const DEFAULT_WEEKLY_GOAL: WeeklyGoalSettings = {
  enabled: false,
  targetDays: 3,
};

function validateTargetDays(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value)
    ? Math.min(7, Math.max(1, value))
    : DEFAULT_WEEKLY_GOAL.targetDays;
}

export const WEEKLY_GOAL_SCHEMA = defineSchema<WeeklyGoalSettings>({
  category: 'weekly-goal',
  version: 2,
  defaultValue: DEFAULT_WEEKLY_GOAL,
  validate(value: unknown): WeeklyGoalSettings {
    if (!value || typeof value !== 'object') return { ...DEFAULT_WEEKLY_GOAL };
    const candidate = value as Record<string, unknown>;
    return {
      enabled: typeof candidate.enabled === 'boolean'
        ? candidate.enabled
        : DEFAULT_WEEKLY_GOAL.enabled,
      targetDays: validateTargetDays(candidate.targetDays),
    };
  },
  upgrades: [{
    fromVersion: 1,
    migrate: (value: unknown) => (
      typeof value === 'number'
        ? { enabled: true, targetDays: value }
        : value
    ),
  }],
});

export const PROGRESSIVE_SCHEMA = defineSchema<ProgressiveSuggestionState>({
  category: 'progressive-suggestion',
  version: 1,
  defaultValue: DEFAULT_PROGRESSIVE_STATE,
  validate(value: unknown): ProgressiveSuggestionState {
    if (!value || typeof value !== 'object') {
      return { ...DEFAULT_PROGRESSIVE_STATE };
    }
    const candidate = value as Record<string, unknown>;
    return {
      lastSuggestedAt: typeof candidate.lastSuggestedAt === 'string'
        ? candidate.lastSuggestedAt
        : '',
      lastAction: candidate.lastAction === 'accept'
        || candidate.lastAction === 'ignore'
        || candidate.lastAction === 'dismiss'
        ? candidate.lastAction
        : null,
      ignoreCount: typeof candidate.ignoreCount === 'number'
        && Number.isFinite(candidate.ignoreCount)
        ? Math.max(0, Math.floor(candidate.ignoreCount))
        : 0,
      dismissedPermanently: candidate.dismissedPermanently === true,
    };
  },
});

export const ONBOARDING_SCHEMA = defineSchema<boolean>({
  category: 'onboarding',
  version: 1,
  defaultValue: true,
  validate: (value: unknown) => typeof value === 'boolean' ? value : true,
});

/* ── Training Schedule ──────────────────────────────────────────── */

export interface TrainingScheduleSettings {
  enabled: boolean;
  /** 0=Monday … 6=Sunday */
  daysOfWeek: number[];
  reminderHour: number;   // 0-23
  reminderMinute: number; // 0-59
  /** ISO date key (YYYY-MM-DD) of last reminder to avoid duplicates. */
  lastRemindedDateKey: string;
}

export const DEFAULT_TRAINING_SCHEDULE: TrainingScheduleSettings = {
  enabled: false,
  daysOfWeek: [0, 2, 4], // Mon, Wed, Fri
  reminderHour: 20,
  reminderMinute: 0,
  lastRemindedDateKey: '',
};

function isValidDayOfWeek(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export const TRAINING_SCHEDULE_SCHEMA = defineSchema<TrainingScheduleSettings>({
  category: 'training-schedule',
  version: 1,
  defaultValue: DEFAULT_TRAINING_SCHEDULE,
  validate(value: unknown): TrainingScheduleSettings {
    if (!value || typeof value !== 'object') return { ...DEFAULT_TRAINING_SCHEDULE };
    const candidate = value as Record<string, unknown>;
    const daysOfWeek = Array.isArray(candidate.daysOfWeek)
      ? candidate.daysOfWeek.filter(isValidDayOfWeek).slice(0, 7)
      : [...DEFAULT_TRAINING_SCHEDULE.daysOfWeek];
    return {
      enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : DEFAULT_TRAINING_SCHEDULE.enabled,
      daysOfWeek: [...new Set(daysOfWeek)].sort(),
      reminderHour: clamp(Number(candidate.reminderHour ?? DEFAULT_TRAINING_SCHEDULE.reminderHour), 0, 23),
      reminderMinute: clamp(Number(candidate.reminderMinute ?? DEFAULT_TRAINING_SCHEDULE.reminderMinute), 0, 59),
      lastRemindedDateKey: typeof candidate.lastRemindedDateKey === 'string' ? candidate.lastRemindedDateKey : '',
    };
  },
});
