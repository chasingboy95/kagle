import { motion } from 'framer-motion';
import type { LayerProps } from './types';

const IDLE = { duration: 5, repeat: Infinity, ease: 'easeInOut' as const };
const HOLD = { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const };
const SPRING = { type: 'spring' as const, damping: 20, stiffness: 60 };
const RELEASE = { type: 'spring' as const, damping: 13, stiffness: 45, mass: 1.1 };

export default function Aura({ phase }: LayerProps) {
  const isIdle = phase === 'idle';
  const isContract = phase === 'contract';
  const isHold = phase === 'hold';
  const isRelease = phase === 'relax';

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      animate={
        isIdle
          ? { scale: [0.93, 1.03, 0.93], opacity: [0.22, 0.42, 0.22] }
          : isContract
            ? { scale: 1.12, opacity: 0.78 }
            : isHold
              ? { scale: [1.08, 1.14, 1.08], opacity: [0.7, 0.82, 0.7] }
              : { scale: 1.04, opacity: 0.48 }
      }
      transition={
        isIdle ? IDLE : isHold ? HOLD : isRelease ? RELEASE : SPRING
      }
    >
      <img src={`${import.meta.env.BASE_URL}muscle-sphere/aura.svg`} className="w-full h-full" alt="" />
    </motion.div>
  );
}
