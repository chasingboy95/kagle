import { motion } from 'framer-motion';

interface Props {
  isRunning: boolean;
  isPaused: boolean;
  currentRepetition: number;
  totalRepetitions: number;
}

export default function TrainingStatus({
  isRunning,
  isPaused,
  currentRepetition,
  totalRepetitions,
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
            第 {currentRepetition} / {totalRepetitions} 次
          </motion.span>
        ) : (
          <motion.span
            key="ready"
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] tracking-wider text-slate-500"
          >
            准备开始
          </motion.span>
        )}
      </div>
    </div>
  );
}
