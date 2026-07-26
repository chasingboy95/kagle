import { AnimatePresence, motion } from 'framer-motion';
import { formatSeconds, actionHint } from '../utils/time';
import type { TrainingPhase } from '../types/training';
import type { DisplayPhaseTiming } from '../utils/time';

interface Props {
  phase: TrainingPhase;
  displayPhaseKey: DisplayPhaseTiming['key'];
  phaseRemainingMs: number;
  currentRepetition: number;
  totalRepetitions: number;
  isRunning: boolean;
}

export default function TimerDisplay({
  phase,
  displayPhaseKey,
  phaseRemainingMs,
  currentRepetition,
  totalRepetitions,
  isRunning,
}: Props) {
  const showTimer = isRunning && phase !== 'idle';
  const seconds = formatSeconds(phaseRemainingMs);

  return (
    <div className="flex flex-col items-center space-y-1.5">
      {/* 用户阶段提示：contract 与 hold 不再触发文案切换 */}
      <AnimatePresence mode="wait">
        {showTimer && (
          <motion.div
            key={displayPhaseKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-[11px] tracking-[0.2em] text-slate-400 font-medium"
          >
            {actionHint(phase)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* contract + hold 使用同一个连续倒计时 */}
      <motion.div
        key={seconds}
        initial={{ opacity: 0.5, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="text-6xl sm:text-7xl font-light tracking-tight text-slate-100 tabular-nums"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {showTimer ? seconds : '--'}
      </motion.div>

      {/* 当前组内的动作次数 */}
      <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums mt-1">
        <span className="text-[10px] tracking-widest text-slate-600">第</span>
        <span className="font-semibold text-slate-300 text-sm">
          {showTimer ? currentRepetition : 0}
        </span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-400">{totalRepetitions}</span>
        <span className="text-[10px] tracking-widest text-slate-600">次</span>
      </div>
    </div>
  );
}
