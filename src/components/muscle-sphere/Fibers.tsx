import { motion } from 'framer-motion';
import type { LayerProps } from './types';

const IDLE = { duration: 4, repeat: Infinity, ease: 'easeInOut' as const };
const HOLD = { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const };
const SPRING = { type: 'spring' as const, damping: 20, stiffness: 60 };
const RELEASE = { type: 'spring' as const, damping: 13, stiffness: 45, mass: 1.1 };

export default function Fibers({ phase }: LayerProps) {
  const isIdle = phase === 'idle';
  const isContract = phase === 'contract';
  const isHold = phase === 'hold';
  const isRelease = phase === 'relax';

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      animate={
        isIdle
          ? { opacity: [0.12, 0.22, 0.12], scale: [0.995, 1.008, 0.995], rotate: [0, 1.5, -1, 0] }
          : isContract
            ? { opacity: 0.62, scale: 0.96, rotate: 10 }
            : isHold
              ? { opacity: [0.55, 0.65, 0.55], scale: [0.96, 0.985, 0.96], rotate: 10 }
              : { opacity: 0.28, scale: 1.01, rotate: -2 }
      }
      transition={
        isIdle ? IDLE : isHold ? HOLD : isRelease ? RELEASE : SPRING
      }
    >
      <img src="/muscle-sphere/fibers.svg" className="w-full h-full" alt="" />
    </motion.div>
  );
}
