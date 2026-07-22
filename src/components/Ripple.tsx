import { motion } from 'framer-motion';
import type { TrainingPhase } from '../types/training';

interface Props {
  phase: TrainingPhase;
  isRunning: boolean;
}

export default function Ripple({ phase, isRunning }: Props) {
  const isContracting = phase === 'contract' || phase === 'hold';
  const isActive = isRunning && phase !== 'idle';

  return (
    <>
      {/* 外层液态波纹 */}
      <motion.div
        animate={
          isActive
            ? {
                scale: isContracting ? [1, 0.9, 1] : [1, 1.3, 1],
                opacity: isContracting ? [0.18, 0.04, 0.18] : [0.15, 0.03, 0.15],
              }
            : { scale: 1, opacity: 0.1 }
        }
        transition={{
          duration: 3,
          repeat: isActive ? Infinity : 0,
          ease: 'easeInOut',
        }}
        className="absolute w-72 h-72 rounded-full border border-sky-300/20"
      />

      {/* 内层波纹（相位差） */}
      <motion.div
        animate={
          isActive
            ? {
                scale: isContracting ? [1.08, 0.96, 1.08] : [1.12, 1.48, 1.12],
                opacity: isContracting ? [0.1, 0.02, 0.1] : [0.08, 0.015, 0.08],
              }
            : { scale: 1.08, opacity: 0.06 }
        }
        transition={{
          duration: 3,
          repeat: isActive ? Infinity : 0,
          ease: 'easeInOut',
          delay: 0.35,
        }}
        className="absolute w-72 h-72 rounded-full border border-sky-300/15"
      />
    </>
  );
}
