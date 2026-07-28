import {
  DEFAULT_PROGRESSIVE_STATE,
  type ProgressiveSuggestionState,
} from './progressiveTraining';
import { defineSchema } from './storage';

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
    };
  },
});

export const ONBOARDING_SCHEMA = defineSchema<boolean>({
  category: 'onboarding',
  version: 1,
  defaultValue: true,
  validate: (value: unknown) => typeof value === 'boolean' ? value : true,
});
