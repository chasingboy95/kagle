import type { TrainingConfig, TrainingPhase, TrainingStatus } from '../types/training';

export type SessionEndStatus = 'completed' | 'stopped';

export interface SessionCalculationState {
  status: TrainingStatus;
  phase: TrainingPhase;
  round: number;
  sessionStartedAt: number;
  sessionStartedAtIso: string;
  totalPausedMs: number;
  pauseStartedAt: number;
  feedbackElapsedSnapshot: number;
  /** Config the session actually executed with (authoritative for history). */
  config: TrainingConfig;
}

export interface SessionResult {
  completedReps: number;
  actualDurationMs: number;
  status: SessionEndStatus;
  startedAt: string;
  /** Immutable config of the executed session, used to build the record. */
  config: TrainingConfig;
}

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** Return repetitions that have finished their relax phase. */
export function getCompletedRepetitions(state: SessionCalculationState): number {
  if (state.status === 'idle') return 0;
  const completed = state.phase === 'feedback'
    ? state.round + 1
    : state.round;
  return Math.floor(finiteNonNegative(completed));
}

/** Return active session time, excluding completed and currently-open pauses. */
export function getActiveElapsedMs(
  state: SessionCalculationState,
  now: number,
): number {
  if (state.status === 'idle') return 0;
  if (state.status === 'feedback' || state.status === 'finished') {
    return finiteNonNegative(state.feedbackElapsedSnapshot);
  }
  const activeUntil = state.status === 'paused'
    ? state.pauseStartedAt
    : now;
  return finiteNonNegative(
    activeUntil - state.sessionStartedAt - state.totalPausedMs,
  );
}

/** Build the canonical payload persisted when a session completes or stops. */
export function buildSessionResult(
  state: SessionCalculationState,
  status: SessionEndStatus,
  now: number,
): SessionResult {
  return {
    completedReps: getCompletedRepetitions(state),
    actualDurationMs: getActiveElapsedMs(state, now),
    status,
    startedAt: state.sessionStartedAtIso,
    config: state.config,
  };
}
