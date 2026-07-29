import type { TrainingStatus } from '../types/training';

interface Props {
  status: TrainingStatus;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  onDone?: () => void;
  idle?: boolean;
}

export default function BottomActionDock({ status, onStart, onPause, onResume, onStop, onRestart, onDone, idle }: Props) {
  return (
    <div className="bottom-action-dock sticky bottom-0 w-full bg-[#111827] bg-gradient-to-t from-[#111827] via-[#111827]/95 to-transparent pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-sm mx-auto px-5 pt-4 pb-3 space-y-2">
        {status === 'idle' && idle && (
          <button
            type="button"
            onClick={onStart}
            className="w-full rounded-full bg-white py-3.5 text-sm font-semibold text-slate-900 transition-colors active:bg-white/90 min-h-[56px]"
          >
            开始训练
          </button>
        )}

        {status === 'running' && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onPause}
              className="flex-1 rounded-full bg-white/10 py-3.5 text-sm font-medium text-slate-200 transition-colors active:bg-white/15 min-h-[56px]"
            >
              暂停
            </button>
            <button
              type="button"
              onClick={onStop}
              className="flex-[0.6] rounded-full bg-red-500/10 py-3.5 text-sm font-medium text-red-400 transition-colors active:bg-red-500/20 min-h-[56px]"
            >
              结束
            </button>
          </div>
        )}

        {status === 'paused' && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onResume}
              className="flex-1 rounded-full bg-white/10 py-3.5 text-sm font-medium text-slate-200 transition-colors active:bg-white/15 min-h-[56px]"
            >
              继续
            </button>
            <button
              type="button"
              onClick={onStop}
              className="flex-[0.6] rounded-full bg-red-500/10 py-3.5 text-sm font-medium text-red-400 transition-colors active:bg-red-500/20 min-h-[56px]"
            >
              结束
            </button>
          </div>
        )}

        {status === 'finished' && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRestart}
              className="flex-1 rounded-full bg-white/10 py-3.5 text-sm font-medium text-slate-200 transition-colors active:bg-white/15 min-h-[56px]"
            >
              再来一次
            </button>
            <button
              type="button"
              onClick={onDone}
              className="flex-1 rounded-full bg-white py-3.5 text-sm font-medium text-slate-900 transition-colors active:bg-white/90 min-h-[56px]"
            >
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
