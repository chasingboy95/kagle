/** 格式化毫秒为整数秒（倒计时用） */
export function formatSeconds(ms: number): string {
  return String(Math.ceil(Math.max(0, ms) / 1000));
}

export const READY_DURATION_MS = 5000;
export const FEEDBACK_DURATION_MS = 6000;

/** 计算总训练时长（毫秒） */
export function calcTotalDuration(
  contractTime: number,
  holdTime: number,
  relaxTime: number,
  rounds: number,
): number {
  const singleRound = (contractTime + holdTime + relaxTime) * 1000;
  return READY_DURATION_MS + singleRound * rounds + FEEDBACK_DURATION_MS;
}

export interface DisplayPhaseTiming {
  /** User-facing phase key. Contract and hold intentionally share one key. */
  key: 'idle' | 'ready' | 'contract-hold' | 'relax' | 'feedback';
  remainingMs: number;
  progress: number;
  durationMs: number;
}

/**
 * Resolve user-facing timing without changing the engine state machine.
 * Contract and hold are presented as one continuous "收缩并保持" phase.
 */
export function calcDisplayPhaseTiming(
  phase: 'idle' | 'ready' | 'contract' | 'hold' | 'relax' | 'feedback',
  phaseRemainingMs: number,
  contractTime: number,
  holdTime: number,
  relaxTime: number,
): DisplayPhaseTiming {
  if (phase === 'idle') {
    return { key: 'idle', remainingMs: 0, progress: 0, durationMs: 0 };
  }

  if (phase === 'ready') {
    const durationMs = READY_DURATION_MS;
    const remainingMs = Math.max(0, phaseRemainingMs);
    return {
      key: 'ready',
      remainingMs,
      progress: durationMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / durationMs)) : 0,
      durationMs,
    };
  }

  if (phase === 'feedback') {
    const durationMs = FEEDBACK_DURATION_MS;
    const remainingMs = Math.max(0, phaseRemainingMs);
    return {
      key: 'feedback',
      remainingMs,
      progress: durationMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / durationMs)) : 0,
      durationMs,
    };
  }

  if (phase === 'contract' || phase === 'hold') {
    const contractMs = contractTime * 1000;
    const holdMs = holdTime * 1000;
    const durationMs = contractMs + holdMs;
    const remainingMs = phase === 'contract'
      ? Math.max(0, phaseRemainingMs) + holdMs
      : Math.max(0, phaseRemainingMs);

    return {
      key: 'contract-hold',
      remainingMs,
      progress: durationMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / durationMs)) : 0,
      durationMs,
    };
  }

  const durationMs = relaxTime * 1000;
  const remainingMs = Math.max(0, phaseRemainingMs);
  return {
    key: 'relax',
    remainingMs,
    progress: durationMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / durationMs)) : 0,
    durationMs,
  };
}

/** 阶段提示（无呼吸指导） */
export function phaseHint(phase: 'ready' | 'contract' | 'hold' | 'relax' | 'feedback'): string {
  switch (phase) {
    case 'ready': return '准备开始';
    case 'contract':
    case 'hold': return '收缩并保持';
    case 'feedback': return '训练完成';
    case 'relax': return '放松';
  }
}

/** 完整动作提示 */
export function actionHint(phase: 'idle' | 'ready' | 'contract' | 'hold' | 'relax' | 'feedback'): string {
  switch (phase) {
    case 'idle': return '';
    case 'ready': return '准备开始';
    case 'contract':
    case 'hold': return '收缩并保持';
    case 'feedback': return '训练完成';
    case 'relax': return '慢慢放松';
  }
}
