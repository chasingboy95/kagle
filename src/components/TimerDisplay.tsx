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
  currentSet: number;
  totalSets: number;
  isRunning: boolean;
}

export default function TimerDisplay({
  phase,
  displayPhaseKey,
  phaseRemainingMs,
  currentRepetition,
  totalRepetitions,
  currentSet,
  totalSets,
  isRunning,
}: Props) {
  const showTimer = isRunning && phase !== 'idle';
  const seconds = formatSeconds(phaseRemainingMs);

  return (
    <div
      className="flex flex-col items-center space-y-1.5"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* 用户阶段提示：contract 与 hold 不再触发文案切换 */}
      <AnimatePresence mode="wait">
        {showTimer && (
          <motion.div
            key={displayPhaseKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-[11px] tracking-[0.2em] text-warm-400 font-medium"
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
        className="text-6xl sm:text-7xl font-light tracking-tight text-warm-100 tabular-nums"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {showTimer ? seconds : '--'}
      </motion.div>

      {/* 组信息 */}
      <div className="flex items-center gap-2 text-xs text-warm-400 tabular-nums mt-1">
        <span className="text-[10px] tracking-widest text-warm-500">组</span>
        <span className="font-semibold text-warm-200 text-sm">
          {showTimer ? currentSet : 0}
        </span>
        <span className="text-warm-500">/</span>
        <span className="text-warm-400">{totalSets}</span>
        <span className="mx-2 text-warm-500">|</span>
        <span className="text-[10px] tracking-widest text-warm-500">第</span>
        <span className="font-semibold text-warm-200 text-sm">
          {showTimer ? currentRepetition : 0}
        </span>
        <span className="text-warm-500">/</span>
        <span className="text-warm-400">{totalRepetitions}</span>
        <span className="text-[10px] tracking-widest text-warm-500">次</span>
      </div>
    </div>
  );
}
