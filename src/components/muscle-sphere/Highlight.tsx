import { motion } from 'framer-motion';
import type { LayerProps } from './types';

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 60 };
const RELEASE = { type: 'spring' as const, damping: 13, stiffness: 45, mass: 1.1 };

export default function Highlight({ phase }: LayerProps) {
  const isIdle = phase === 'idle';
  const isContract = phase === 'contract';
  const isHold = phase === 'hold';
  const isRelease = phase === 'relax';

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      animate={
        isIdle
          ? {
              x: [0, 4, 0, -3, 0],
              y: [0, -2.5, 0, 2, 0],
              opacity: [0.20, 0.38, 0.20],
            }
          : isContract
            ? { x: 0, y: -4, opacity: 0.58 }
            : isHold
              ? { x: 0, y: -4, opacity: [0.50, 0.60, 0.50] }
              : { x: 0, y: -1, opacity: 0.35 }
      }
      transition={
        isIdle
          ? {
              x: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            }
          : isHold
            ? {
                opacity: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
                x: { duration: 0.3 },
                y: { duration: 0.3 },
              }
            : isRelease
              ? RELEASE
              : SPRING
      }
    >
      <img src={`${import.meta.env.BASE_URL}muscle-sphere/highlight.svg`} className="w-full h-full" alt="" />
    </motion.div>
  );
}
