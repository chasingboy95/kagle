import { motion } from 'framer-motion';

interface TrainingFeedbackProps {
  rounds: number;
  durationMs: number;
  onRestart?: () => void;
}

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function TrainingFeedback({ rounds, durationMs, onRestart }: TrainingFeedbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
        ✓
      </div>
      <h2 className="text-xl font-semibold text-white">训练完成</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-300">
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-2xl font-semibold text-white">{rounds}</div>
          <div>完成次数</div>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-2xl font-semibold text-white">{formatDuration(durationMs)}</div>
          <div>训练时间</div>
        </div>
      </div>
      {onRestart && (
        <button
          onClick={onRestart}
          className="mt-6 w-full rounded-full bg-white/10 py-3 text-white"
        >
          再次训练
        </button>
      )}
    </motion.div>
  );
}
