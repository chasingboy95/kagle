import { motion } from 'framer-motion';
import type { LayerProps } from './types';

const IDLE = { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const };
const HOLD = { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const };
const SPRING = { type: 'spring' as const, damping: 20, stiffness: 60 };
const RELEASE = { type: 'spring' as const, damping: 13, stiffness: 45, mass: 1.1 };

export default function Core({ phase }: LayerProps) {
  const isIdle = phase === 'idle';
  const isContract = phase === 'contract';
  const isHold = phase === 'hold';
  const isRelease = phase === 'relax';

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      animate={
        isIdle
          ? { scale: [0.88, 0.96, 0.88], opacity: [0.40, 0.60, 0.40] }
          : isContract
            ? { scale: 1.12, opacity: 1 }
            : isHold
              ? { scale: [1.06, 1.15, 1.06], opacity: [0.90, 1, 0.90] }
              : { scale: 0.95, opacity: 0.60 }
      }
      transition={
        isIdle ? IDLE : isHold ? HOLD : isRelease ? RELEASE : SPRING
      }
    >
      <img src="/muscle-sphere/core.svg" className="w-full h-full" alt="" />
    </motion.div>
  );
}
