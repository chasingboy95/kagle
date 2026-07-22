import { motion } from 'framer-motion';
import type { LayerProps } from './types';

const IDLE = { duration: 4, repeat: Infinity, ease: 'easeInOut' as const };
const HOLD = { duration: 2, repeat: Infinity, ease: 'easeInOut' as const };
const SPRING = { type: 'spring' as const, damping: 20, stiffness: 60 };
const RELEASE = { type: 'spring' as const, damping: 13, stiffness: 45, mass: 1.1 };

export default function ShadowLayer({ phase }: LayerProps) {
  const isIdle = phase === 'idle';
  const isContract = phase === 'contract';
  const isHold = phase === 'hold';
  const isRelease = phase === 'relax';

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      animate={
        isIdle
          ? { opacity: [0.35, 0.45, 0.35] }
          : isContract
            ? { opacity: 0.72 }
            : isHold
              ? { opacity: [0.65, 0.72, 0.65] }
              : { opacity: 0.42 }
      }
      transition={
        isIdle ? IDLE : isHold ? HOLD : isRelease ? RELEASE : SPRING
      }
    >
      <img src="/muscle-sphere/shadow.svg" className="w-full h-full" alt="" />
    </motion.div>
  );
}
