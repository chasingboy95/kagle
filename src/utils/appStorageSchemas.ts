import {
  DEFAULT_PROGRESSIVE_STATE,
  type ProgressiveSuggestionState,
} from './progressiveTraining';
import { defineSchema } from './storage';

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
