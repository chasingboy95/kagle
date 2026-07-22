import { motion } from 'framer-motion';
import type { LayerProps } from './types';

const IDLE = { duration: 6, repeat: Infinity, ease: 'easeInOut' as const };
const HOLD = { duration: 2, repeat: Infinity, ease: 'easeInOut' as const };
const SPRING = { type: 'spring' as const, damping: 20, stiffness: 60 };
const RELEASE = { type: 'spring' as const, damping: 13, stiffness: 45, mass: 1.1 };

export default function Fascia({ phase }: LayerProps) {
  const isIdle = phase === 'idle';
  const isContract = phase === 'contract';
  const isHold = phase === 'hold';
  const isRelease = phase === 'relax';

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      animate={
        isIdle
          ? { opacity: [0.18, 0.28, 0.18], rotate: [0, 3, -2, 0] }
          : isContract
            ? { opacity: 0.58, rotate: 15 }
            : isHold
              ? { opacity: [0.50, 0.60, 0.50], rotate: 15 }
              : { opacity: 0.32, rotate: -3 }
      }
      transition={
        isIdle ? IDLE : isHold ? HOLD : isRelease ? RELEASE : SPRING
      }
    >
      <img src="/muscle-sphere/fascia.svg" className="w-full h-full" alt="" />
    </motion.div>
  );
}
