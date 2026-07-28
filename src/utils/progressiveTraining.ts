import type { TrainingConfig, TrainingRecord } from '../types/training';
import { CONFIG_RANGE } from '../types/training';

/* ── Suggestion types ────────────────────────────────────────── */

export interface ProgressiveSuggestion {
  /** Type of suggestion: upgrade to higher intensity, downgrade to lower, or maintain. */
  type: 'upgrade' | 'downgrade' | 'maintain';
  /** Human-readable reason for the suggestion. */
  reason: string;
  /** Current config values. */
  before: TrainingConfig;
  /** Suggested new config values (only one field differs from before). */
  after: TrainingConfig;
  /** Which parameter is being changed. */
  changedKey: keyof TrainingConfig;
}

export type SuggestionAction = 'accept' | 'ignore' | 'dismiss';

/* ── Dismissal state (persisted via storage) ──────────────────── */

export interface ProgressiveSuggestionState {
  /** ISO timestamp of last suggestion shown. */
  lastSuggestedAt: string;
  /** User action taken on the last suggestion. */
  lastAction: SuggestionAction | null;
  /** Count of consecutive ignores (reset on accept/dismiss). */
  ignoreCount: number;
  /** Whether the user has permanently dismissed progressive suggestions. */
  dismissedPermanently: boolean;
}

export const DEFAULT_PROGRESSIVE_STATE: ProgressiveSuggestionState = {
  lastSuggestedAt: '',
  lastAction: null,
  ignoreCount: 0,
  dismissedPermanently: false,
};

/* ── Constants ────────────────────────────────────────────────── */

/** Number of consecutive same-config completions needed to trigger a suggestion. */
const MIN_CONSECUTIVE = 3;

/** Cooldown in ms after dismissal before showing another suggestion. */
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

/** How many completed records to examine. */
const MAX_LOOKBACK = 20;

/** Step sizes for each parameter. */
const SUGGESTION_STEPS: Record<keyof TrainingConfig, number> = {
  holdTime: 1,
  rounds: 2,
  contractTime: 1,
  relaxTime: 2,
};

/** Step sizes for decreasing (used when comfort feedback is "painful"). */
const DOWNGRADE_STEPS: Record<keyof TrainingConfig, number> = {
  holdTime: 1,
  rounds: 2,
  contractTime: 1,
  relaxTime: 2,
};

/** Priority order for suggesting parameter changes. */
const SUGGESTION_ORDER: (keyof TrainingConfig)[] = ['holdTime', 'rounds', 'contractTime', 'relaxTime'];

/* ── Helpers ──────────────────────────────────────────────────── */

function sameConfig(a: TrainingRecord, b: TrainingRecord): boolean {
  return a.contractSec === b.contractSec
    && a.holdSec === b.holdSec
    && a.relaxSec === b.relaxSec
    && a.targetReps === b.targetReps;
}

function configFromRecord(r: TrainingRecord): TrainingConfig {
  return {
    contractTime: r.contractSec,
    holdTime: r.holdSec,
    relaxTime: r.relaxSec,
    rounds: r.targetReps,
  };
}

/* ── Rule engine ──────────────────────────────────────────────── */

/**
 * Evaluate whether a progressive training suggestion should be shown.
 * Side-effect-free: never mutates the input records or their ordering.
 * Returns null if conditions are not met.
 */
export function evaluateSuggestion(
  records: TrainingRecord[],
  state: ProgressiveSuggestionState,
  now: Date = new Date(),
): ProgressiveSuggestion | null {
  // Only look at completed records, most recent first
  const completed = [...records]
    .filter((r) => r.status === 'completed')
    .sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime())
    .slice(0, MAX_LOOKBACK);

  if (completed.length < MIN_CONSECUTIVE) return null;

  // ── Check most recent comfort feedback ─────────────────────
  const latest = completed[0];
  const comfort = latest.comfortFeedback;

  if (comfort === 'painful') {
    // Check permanent dismiss
    if (state.dismissedPermanently) return null;

    const before = configFromRecord(latest);

    // Find a parameter to decrease that hasn't hit the minimum
    for (const key of SUGGESTION_ORDER) {
      const current = before[key];
      const min = CONFIG_RANGE[key].min;
      const step = DOWNGRADE_STEPS[key];

      if (current > min) {
        const after = { ...before, [key]: Math.max(current - step, min) };
        const labelMap: Record<string, string> = {
          holdTime: '保持时间',
          rounds: '次数',
          contractTime: '收缩时间',
          relaxTime: '放松时间',
        };
        return {
          type: 'downgrade',
          reason: `上次训练反馈"疼痛或不适"，建议降低${labelMap[key] || key}，避免过度训练。`,
          before,
          after,
          changedKey: key,
        };
      }
    }

    // All params at minimum — can't downgrade further
    return {
      type: 'maintain',
      reason: '已使用最轻松的配置。如果持续感到不适，请咨询医生。',
      before,
      after: before,
      changedKey: 'rounds',
    };
  }

  if (comfort === 'slightly_hard') {
    return null;
  }

  // ── "comfortable" or no feedback: existing progressive logic ──
  // Check if the most recent N consecutive completions have the same config
  const recent = completed.slice(0, MIN_CONSECUTIVE);
  const first = recent[0];
  const allSame = recent.every((r) => sameConfig(r, first));
  if (!allSame) return null;

  // Check permanent dismiss
  if (state.dismissedPermanently) return null;

  // Check cooldown after dismissal
  if (state.lastAction === 'dismiss' && state.lastSuggestedAt) {
    const lastTime = new Date(state.lastSuggestedAt).getTime();
    if (now.getTime() - lastTime < DISMISS_COOLDOWN_MS) return null;
  }

  // Max 3 consecutive ignores before auto-dismiss (treat as cooldown)
  if (state.ignoreCount >= 3 && state.lastSuggestedAt) {
    const lastTime = new Date(state.lastSuggestedAt).getTime();
    if (now.getTime() - lastTime < DISMISS_COOLDOWN_MS) return null;
  }

  const before = configFromRecord(first);

  // Find a parameter to increase that hasn't hit the cap
  for (const key of SUGGESTION_ORDER) {
    const current = before[key];
    const cap = CONFIG_RANGE[key].max;
    const step = SUGGESTION_STEPS[key];

    if (current < cap) {
      const after = { ...before, [key]: Math.min(current + step, cap) };
      const labelMap: Record<string, string> = {
        holdTime: '保持时间',
        rounds: '次数',
        contractTime: '收缩时间',
        relaxTime: '放松时间',
      };
      return {
        type: 'upgrade',
        reason: `已连续完成 ${MIN_CONSECUTIVE} 次相同训练，建议尝试增加${labelMap[key] || key}。`,
        before,
        after,
        changedKey: key,
      };
    }
  }

  // All parameters at cap — no suggestion
  return null;
}
