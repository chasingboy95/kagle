import { motion } from 'framer-motion';
import type { LayerProps } from './types';

const IDLE_T = { duration: 4, repeat: Infinity, ease: 'easeInOut' as const };
const IDLE_Y = { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const };
const HOLD_T = { duration: 2, repeat: Infinity, ease: 'easeInOut' as const };
const SPRING = { type: 'spring' as const, damping: 20, stiffness: 60 };
const RELEASE = { type: 'spring' as const, damping: 13, stiffness: 45, mass: 1.1 };

export default function Particles({ phase }: LayerProps) {
  const isIdle = phase === 'idle';
  const isContract = phase === 'contract';
  const isHold = phase === 'hold';
  const isRelease = phase === 'relax';

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      animate={
        isIdle
          ? { opacity: [0.20, 0.32, 0.20], rotate: [0, 2, -1, 0] }
          : isContract
            ? { opacity: 0.55, scale: 0.93, rotate: 2 }
            : isHold
              ? { opacity: [0.48, 0.58, 0.48], scale: 0.93, rotate: 2 }
              : { opacity: 0.32, scale: 1.04, rotate: -1 }
      }
      transition={
        isIdle
          ? { opacity: IDLE_T, rotate: IDLE_T }
          : isHold
            ? { opacity: HOLD_T, scale: { duration: 0.3 }, rotate: { duration: 0.3 } }
            : isRelease
              ? { ...RELEASE, scale: RELEASE, rotate: RELEASE }
              : { ...SPRING, scale: SPRING, rotate: SPRING }
      }
    >
      <motion.div
        animate={
          isIdle
            ? { y: [0, -3, 0] }
            : isContract
              ? { y: 0 }
              : isHold
                ? { y: [0, -1.5, 0] }
                : { y: 0 }
        }
        transition={isIdle ? IDLE_Y : isHold ? HOLD_T : { duration: 0.4, ease: 'easeOut' }}
        className="w-full h-full"
      >
        <img src={`${import.meta.env.BASE_URL}muscle-sphere/particles.svg`} className="w-full h-full" alt="" />
      </motion.div>
    </motion.div>
  );
}
