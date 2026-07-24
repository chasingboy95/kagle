/** Training lifecycle timing constants. */
export const TRAINING_LIFECYCLE = {
  /** Preparation phase before the first contraction. */
  READY_DURATION_MS: 5000,

  /** Completion feedback phase after the final relaxation. */
  FEEDBACK_DURATION_MS: 6000,
} as const;
