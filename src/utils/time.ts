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
  repetitions: number,
  sets: number = 1,
  restBetweenSets: number = 30,
): number {
  const singleRepetition = (contractTime + holdTime + relaxTime) * 1000;
  const totalReps = repetitions * sets;
  const totalRest = Math.max(0, sets - 1) * restBetweenSets * 1000;
  return READY_DURATION_MS + singleRepetition * totalReps + totalRest + FEEDBACK_DURATION_MS;
}

export interface DisplayPhaseTiming {
  key: 'idle' | 'ready' | 'contract' | 'hold' | 'relax' | 'rest' | 'feedback';
  remainingMs: number;
  progress: number;
  durationMs: number;
}

export function calcDisplayPhaseTiming(
  phase: 'idle' | 'ready' | 'contract' | 'hold' | 'relax' | 'rest' | 'feedback',
  phaseRemainingMs: number,
  contractTime: number,
  holdTime: number,
  relaxTime: number,
  restBetweenSets: number = 30,
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

  if (phase === 'rest') {
    const durationMs = restBetweenSets * 1000;
    const remainingMs = Math.max(0, phaseRemainingMs);
    return {
      key: 'rest',
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

  const durationMs = (
    phase === 'contract' ? contractTime
      : phase === 'hold' ? holdTime
        : relaxTime
  ) * 1000;
  const remainingMs = Math.max(0, phaseRemainingMs);
  return {
    key: phase,
    remainingMs,
    progress: durationMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / durationMs)) : 0,
    durationMs,
  };
}

/** 阶段提示（无呼吸指导） */
export function phaseHint(phase: 'ready' | 'contract' | 'hold' | 'relax' | 'rest' | 'feedback'): string {
  switch (phase) {
    case 'ready': return '准备开始';
    case 'contract': return '开始收缩';
    case 'hold': return '保持住';
    case 'feedback': return '训练完成';
    case 'relax': return '放松';
    case 'rest': return '组间休息';
  }
}

/** 完整动作提示 */
export function actionHint(phase: 'idle' | 'ready' | 'contract' | 'hold' | 'relax' | 'rest' | 'feedback'): string {
  switch (phase) {
    case 'idle': return '';
    case 'ready': return '准备开始';
    case 'contract': return '开始收缩';
    case 'hold': return '保持住';
    case 'feedback': return '训练完成';
    case 'relax': return '慢慢放松';
    case 'rest': return '休息一下';
  }
}
