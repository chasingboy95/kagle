import { AnimatePresence, motion } from 'framer-motion';
import { formatSeconds, actionHint } from '../utils/time';
import type { TrainingPhase } from '../types/training';

interface Props {
  phase: TrainingPhase;
  phaseRemainingMs: number;
  currentRound: number;
  totalRounds: number;
  isRunning: boolean;
}

export default function TimerDisplay({
  phase,
  phaseRemainingMs,
  currentRound,
  totalRounds,
  isRunning,
}: Props) {
  const showTimer = isRunning && phase !== 'idle';
  const seconds = formatSeconds(phaseRemainingMs);

  return (
    <div className="flex flex-col items-center space-y-1.5">
      {/* 阶段提示 */}
      <AnimatePresence mode="wait">
        {showTimer && (
          <motion.div
            key={phase}
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

      {/* 秒数倒计时 —— 整数 */}
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

      {/* Round 信息 */}
      <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums mt-1">
        <span className="text-[10px] tracking-widest text-slate-600">ROUND</span>
        <span className="font-semibold text-slate-300 text-sm">
          {showTimer ? String(currentRound).padStart(2, '0') : '00'}
        </span>
        <span className="text-slate-700">/</span>
        <span className="text-slate-500">{String(totalRounds).padStart(2, '0')}</span>
      </div>
    </div>
  );
}
