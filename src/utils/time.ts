/** 格式化毫秒为整数秒（倒计时用） */
export function formatSeconds(ms: number): string {
  return String(Math.ceil(Math.max(0, ms) / 1000));
}

/** 计算总训练时长（毫秒） */
export function calcTotalDuration(
  contractTime: number,
  holdTime: number,
  relaxTime: number,
  rounds: number,
): number {
  const singleRound = (contractTime + holdTime + relaxTime) * 1000;
  return singleRound * rounds;
}

/** 阶段提示（无呼吸指导） */
export function phaseHint(phase: 'contract' | 'hold' | 'relax'): string {
  switch (phase) {
    case 'contract': return '收缩';
    case 'hold': return '保持';
    case 'relax': return '放松';
  }
}

/** 完整动作提示 */
export function actionHint(phase: 'contract' | 'hold' | 'relax'): string {
  switch (phase) {
    case 'contract': return '收缩并保持';
    case 'hold': return '坚持住';
    case 'relax': return '放松';
  }
}
