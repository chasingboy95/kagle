import { motion } from 'framer-motion';
import { completionSummary, formatDuration } from '../utils/trainingFeedback';

interface TrainingFeedbackProps {
  completedRepetitions: number;
  totalRepetitions: number;
  durationMs: number;
  onRestart?: () => void;
  onDone?: () => void;
  onViewHistory?: () => void;
}

export default function TrainingFeedback({
  completedRepetitions,
  totalRepetitions,
  durationMs,
  onRestart,
  onDone,
  onViewHistory,
}: TrainingFeedbackProps) {
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
      <p className="mt-1 text-sm text-slate-400">
        {completionSummary(completedRepetitions, totalRepetitions)}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-300">
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-2xl font-semibold text-white">{formatDuration(durationMs)}</div>
          <div className="mt-0.5">训练时长</div>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-2xl font-semibold text-white tabular-nums">
            {completedRepetitions}/{totalRepetitions}
          </div>
          <div className="mt-0.5">完成次数</div>
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
        {onDone && (
          <button
            onClick={onDone}
            className="w-full rounded-full border border-white/10 bg-transparent py-3 text-sm font-medium text-slate-300 transition-colors active:bg-white/[0.06]"
          >
            完成
          </button>
        )}
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="w-full rounded-full bg-white/5 py-3 text-sm font-medium text-indigo-300/80 transition-colors active:bg-white/10"
          >
            查看训练记录
          </button>
        )}
      </div>
    </motion.div>
  );
}
