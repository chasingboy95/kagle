import { motion } from 'framer-motion';
import type { LayerProps } from './types';

const IDLE = { duration: 6, repeat: Infinity, ease: 'easeInOut' as const };
const HOLD = { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const };
const SPRING = { type: 'spring' as const, damping: 20, stiffness: 60 };
const RELEASE = { type: 'spring' as const, damping: 13, stiffness: 45, mass: 1.1 };

export default function Fluid({ phase }: LayerProps) {
  const isIdle = phase === 'idle';
  const isContract = phase === 'contract';
  const isHold = phase === 'hold';
  const isRelease = phase === 'relax';

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      animate={
        isIdle
          ? { opacity: [0.42, 0.55, 0.42], rotate: [0, 2, -1.5, 0] }
          : isContract
            ? { opacity: 0.88, rotate: 3 }
            : isHold
              ? { opacity: [0.82, 0.90, 0.82], rotate: 3 }
              : { opacity: 0.62, rotate: -1 }
      }
      transition={
        isIdle ? IDLE : isHold ? HOLD : isRelease ? RELEASE : SPRING
      }
    >
      <img src="/muscle-sphere/fluid.svg" className="w-full h-full" alt="" />
    </motion.div>
  );
}
