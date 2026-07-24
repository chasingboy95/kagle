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
