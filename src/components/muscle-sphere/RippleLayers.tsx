import { motion } from 'framer-motion';
import type { LayerProps } from './types';

const IDLE = { duration: 6, repeat: Infinity, ease: 'easeInOut' as const };
const HOLD = { duration: 2, repeat: Infinity, ease: 'easeInOut' as const };
const SPRING = { type: 'spring' as const, damping: 20, stiffness: 60 };
const RELEASE = { type: 'spring' as const, damping: 13, stiffness: 45, mass: 1.1 };

export default function RippleLayers({ phase }: LayerProps) {
  const isIdle = phase === 'idle';
  const isContract = phase === 'contract';
  const isHold = phase === 'hold';
  const isRelease = phase === 'relax';

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      animate={
        isIdle
          ? { scale: [0.99, 1.015, 0.99], opacity: [0.10, 0.18, 0.10], rotate: [0, 3, -2, 0] }
          : isContract
            ? { scale: 0.88, opacity: 0.38, rotate: 5 }
            : isHold
              ? { scale: [0.88, 0.92, 0.88], opacity: [0.32, 0.40, 0.32], rotate: 5 }
              : { scale: 1.04, opacity: 0.20, rotate: -2 }
      }
      transition={
        isIdle ? IDLE : isHold ? HOLD : isRelease ? RELEASE : SPRING
      }
    >
      <img src="/muscle-sphere/ripple.svg" className="w-full h-full" alt="" />
    </motion.div>
  );
}
