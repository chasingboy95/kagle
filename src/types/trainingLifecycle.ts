/** Training lifecycle timing constants. */
export const TRAINING_LIFECYCLE = {
  /** Preparation phase before the first contraction. */
  READY_DURATION_MS: 5000,

  /** Completion feedback is user-confirmed, not a timed training phase. */
  FEEDBACK_DURATION_MS: 0,
} as const;
