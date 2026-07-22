import { motion } from 'framer-motion';

interface Props {
  streakDays: number;
  isRunning: boolean;
  isPaused: boolean;
  currentRound: number;
  totalRounds: number;
}

export default function TrainingStatus({
  streakDays,
  isRunning,
  isPaused,
  currentRound,
  totalRounds,
}: Props) {
  return (
    <div className="text-center">
      <h1 className="text-sm font-semibold tracking-[0.15em] text-slate-300/90">
        Kegel Training
      </h1>
      <div className="mt-1.5 flex items-center justify-center gap-1.5">
        {isRunning && !isPaused ? (
          <motion.span
            key="running"
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] tracking-wider text-slate-500"
          >
            Round {currentRound} / {totalRounds}
          </motion.span>
        ) : (
          <motion.span
            key="streak"
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-[10px] tracking-wider"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
            <span className="text-slate-500">连续 {streakDays} 天</span>
          </motion.span>
        )}
      </div>
    </div>
  );
}
