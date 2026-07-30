import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { TrainingStatus } from '../types/training';

interface Props {
  status: TrainingStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRestart: () => void;
}

export default function ControlButtons({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
  onRestart,
}: Props) {
  /* Auto-focus primary action after state transitions */
  const primaryRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    primaryRef.current?.focus();
  }, [status]);
  return (
    <AnimatePresence mode="wait">
      {status === 'idle' && (
        <motion.div
          key="idle"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex justify-center"
        >
          <motion.button
            ref={primaryRef}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onStart}
            className="w-4/5 max-w-[260px] h-14 rounded-[28px] bg-white text-warm-900
              text-sm font-semibold tracking-wide shadow-lg shadow-white/8
              active:bg-warm-200/90 transition-colors select-none"
          >
            开始训练
          </motion.button>
        </motion.div>
      )}

      {status === 'running' && (
        <motion.div
          key="running"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center gap-3"
        >
          <motion.button
            ref={primaryRef}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onPause}
            className="h-12 px-8 rounded-[24px] bg-white/[0.08] text-warm-200
              text-sm font-medium border border-warm-200/[0.08]
              hover:bg-white/[0.12] transition-colors select-none"
          >
            暂停
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onStop}
            className="h-12 px-8 rounded-[24px] bg-white/[0.05] text-red-400/70
              text-sm font-medium border border-warm-200/[0.06]
              hover:bg-white/[0.08] transition-colors select-none"
          >
            停止
          </motion.button>
        </motion.div>
      )}

      {status === 'paused' && (
        <motion.div
          key="paused"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center gap-3"
        >
          <motion.button
            ref={primaryRef}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onResume}
            className="h-14 px-10 rounded-[28px] bg-white text-warm-900
              text-sm font-semibold tracking-wide shadow-lg shadow-white/8
              active:bg-warm-200/90 transition-colors select-none"
          >
            继续
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onStop}
            className="h-12 px-6 rounded-[24px] bg-white/[0.05] text-red-400/70
              text-sm font-medium border border-warm-200/[0.06]
              hover:bg-white/[0.08] transition-colors select-none"
          >
            停止
          </motion.button>
        </motion.div>
      )}

      {status === 'finished' && (
        <motion.div
          key="finished"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center gap-4"
        >
          <div className="flex items-center gap-2 text-emerald-400/80 text-sm font-medium">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px] tracking-wider">完成</span>
          </div>
          <motion.button
            ref={primaryRef}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onRestart}
            className="h-14 px-10 rounded-[28px] bg-white text-warm-900
              text-sm font-semibold tracking-wide shadow-lg shadow-white/8
              active:bg-warm-200/90 transition-colors select-none"
          >
            再来一次
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
