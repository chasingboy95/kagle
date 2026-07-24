import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface TrainingFeedbackProps {
  rounds: number;
  durationMs: number;
  onRestart?: () => void;
  quality?: number;
  maxQuality?: number;
}

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function QualityDots({ value, max }: { value: number; max: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-2 w-2 rounded-full transition-colors duration-300 ${
            i < value ? 'bg-indigo-400' : 'bg-white/15'
          }`}
        />
      ))}
    </div>
  );
}

export default function TrainingFeedback({ rounds, durationMs, onRestart, quality = 4, maxQuality = 5 }: TrainingFeedbackProps) {
  const qualityValue = useMemo(() => Math.min(quality, maxQuality), [quality, maxQuality]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
        ✓
      </div>
      <h2 className="text-xl font-semibold text-white">训练完成</h2>
      <p className="mt-1 text-sm text-slate-400">{rounds} 次训练完成</p>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-300">
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-2xl font-semibold text-white">{formatDuration(durationMs)}</div>
          <div className="mt-0.5">训练时长</div>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="mb-1.5">
            <QualityDots value={qualityValue} max={maxQuality} />
          </div>
          <div className="mt-0.5">训练质量</div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {onRestart && (
          <button
            onClick={onRestart}
            className="w-full rounded-full bg-white/10 py-3 text-sm font-medium text-white transition-colors active:bg-white/15"
          >
            再次训练
          </button>
        )}
        <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
          <span className="inline-block h-1 w-1 rounded-full bg-slate-600/40" />
          <button
            onClick={() => {}}
            className="transition-colors hover:text-slate-400"
          >
            查看训练历史
          </button>
          <span className="inline-block h-1 w-1 rounded-full bg-slate-600/40" />
        </div>
      </div>
    </motion.div>
  );
}
