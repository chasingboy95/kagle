import { useState } from 'react';
import { motion } from 'framer-motion';
import { completionSummary, formatDuration } from '../utils/trainingFeedback';
import type { CompletionProgress } from '../utils/completionProgress';
import type { ComfortFeedback } from '../types/training';

interface TrainingFeedbackProps {
  completedRepetitions: number;
  totalRepetitions: number;
  completedSets: number;
  totalSets: number;
  durationMs: number;
  onRestart?: () => void;
  onDone?: () => void;
  onViewHistory?: () => void;
  onComfortFeedback?: (feedback: ComfortFeedback) => void;
  progress?: CompletionProgress | null;
}

function FeedbackSelector({ onComfortFeedback }: { onComfortFeedback?: (feedback: ComfortFeedback) => void }) {
  const [selected, setSelected] = useState<ComfortFeedback | null>(null);

  if (!onComfortFeedback) return null;

  const options: { value: ComfortFeedback; label: string; icon: string; color: string }[] = [
    { value: 'comfortable', label: '舒适', icon: '😊', color: 'border-emerald-500/30 text-emerald-300' },
    { value: 'slightly_hard', label: '有点吃力', icon: '😐', color: 'border-amber-500/30 text-amber-300' },
    { value: 'painful', label: '疼痛或不适', icon: '😣', color: 'border-red-500/30 text-red-300' },
  ];

  return (
    <div className="mt-4 rounded-2xl bg-warm-200/[0.04] p-4">
      <p className="text-xs font-medium text-warm-400 mb-3">本次训练感受如何？</p>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setSelected(opt.value);
              onComfortFeedback(opt.value);
            }}
            className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
              selected === opt.value
                ? opt.color + ' bg-warm-200/[0.06]'
                : 'border-warm-200/[0.06] text-warm-400 hover:bg-warm-200/[0.04]'
            }`}
          >
            <span className="block text-base mb-0.5">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>
      {selected === 'painful' && (
        <p className="mt-3 text-xs leading-5 text-red-300/80 bg-red-500/10 rounded-lg px-3 py-2">
          如感觉疼痛或明显不适，请停止训练并咨询医生。本应用不提供诊断。
        </p>
      )}
    </div>
  );
}

export default function TrainingFeedback({
  completedRepetitions,
  totalRepetitions,
  completedSets,
  totalSets,
  durationMs,
  onRestart,
  onDone,
  onViewHistory,
  onComfortFeedback,
  progress,
}: TrainingFeedbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-sm rounded-3xl border border-warm-200/10 bg-warm-200/5 p-6 text-center backdrop-blur"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warm-200/10 text-3xl">
        ✓
      </div>
      <h2 className="text-xl font-semibold text-warm-100">训练完成</h2>
      <p className="mt-1 text-sm text-warm-400">
        {completionSummary(completedRepetitions, totalRepetitions)}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3 text-sm text-warm-200">
        <div className="rounded-2xl bg-warm-200/5 p-3">
          <div className="text-2xl font-semibold text-warm-100">{formatDuration(durationMs)}</div>
          <div className="mt-0.5">训练时长</div>
        </div>
        <div className="rounded-2xl bg-warm-200/5 p-3">
          <div className="text-2xl font-semibold text-warm-100 tabular-nums">
            {completedSets}/{totalSets}
          </div>
          <div className="mt-0.5">完成组数</div>
        </div>
        <div className="rounded-2xl bg-warm-200/5 p-3">
          <div className="text-2xl font-semibold text-warm-100 tabular-nums">
            {completedRepetitions}/{totalRepetitions}
          </div>
          <div className="mt-0.5">完成次数</div>
        </div>
      </div>

      {progress && (
        <section aria-labelledby="weekly-progress-title" className="mt-4 rounded-2xl bg-warm-200/[0.04] p-4 text-left">
          <h3 id="weekly-progress-title" className="text-sm font-medium text-warm-200">本周真实进度</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-warm-400">本周完成</dt>
              <dd className="mt-1 text-sm font-medium text-warm-200">{progress.weeklyCompletions} 次</dd>
            </div>
            <div>
              <dt className="text-warm-400">连续训练</dt>
              <dd className="mt-1 text-sm font-medium text-warm-200">{progress.streakDays} 天</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-warm-400">本周累计时长</dt>
              <dd className="mt-1 text-sm font-medium text-warm-200">
                {formatDuration(progress.weeklyDurationMs)}
                <span className="ml-2 text-xs font-normal text-emerald-300/80">
                  本次 +{formatDuration(progress.addedDurationMs)}
                </span>
              </dd>
            </div>
          </dl>
          {progress.goal && (
            <p className="mt-3 border-t border-warm-200/[0.05] pt-3 text-xs text-warm-400">
              {progress.goal.remainingDays > 0
                ? `每周目标 ${progress.goal.completedDays}/${progress.goal.targetDays} 天，还差 ${progress.goal.remainingDays} 天。`
                : `每周目标 ${progress.goal.completedDays}/${progress.goal.targetDays} 天，本周已完成。`}
            </p>
          )}
        </section>
      )}

      {/* Comfort feedback */}
      <FeedbackSelector onComfortFeedback={onComfortFeedback || undefined} />

      <div className="mt-6 flex flex-col gap-2">
        {onRestart && (
          <button
            onClick={onRestart}
            className="w-full rounded-full bg-warm-200/10 py-3 text-sm font-medium text-warm-100 transition-colors active:bg-warm-200/15"
          >
            再次训练
          </button>
        )}
        {onDone && (
          <button
            onClick={onDone}
            className="w-full rounded-full border border-warm-200/10 bg-transparent py-3 text-sm font-medium text-warm-200 transition-colors active:bg-warm-200/[0.06]"
          >
            完成
          </button>
        )}
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="w-full rounded-full bg-warm-200/5 py-3 text-sm font-medium text-accent/80 transition-colors active:bg-warm-200/10"
          >
            查看训练记录
          </button>
        )}
      </div>
    </motion.div>
  );
}
