import type { SessionSnapshot } from '../types/training';
import { calcTotalDuration } from '../utils/time';
import { formatSeconds } from '../utils/time';

interface Props {
  snapshot: SessionSnapshot;
  onContinue: () => void;
  onDiscard: () => void;
}

export default function SessionRecovery({ snapshot, onContinue, onDiscard }: Props) {
  const totalSec = calcTotalDuration(
    snapshot.config.contractTime,
    snapshot.config.holdTime,
    snapshot.config.relaxTime,
    snapshot.config.rounds,
  );
  const elapsedSec = Math.floor(snapshot.sessionElapsedMs / 1000);

  return (
    <div
      role="alert"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-4 pb-8 sm:pb-0"
    >
      <div className="w-full max-w-sm bg-slate-900 border border-white/[0.08] rounded-2xl px-6 py-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-100 text-center">
          恢复训练
        </h2>
        <p className="text-sm text-slate-400 text-center leading-relaxed">
          检测到未完成的训练。已用时 {formatSeconds(elapsedSec)} / {formatSeconds(totalSec)}，完成 {snapshot.round + 1} / {snapshot.config.rounds} 组。
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onDiscard}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
          >
            放弃
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-indigo-500/30 text-indigo-200 hover:bg-indigo-500/40 transition-colors"
          >
            继续训练
          </button>
        </div>
      </div>
    </div>
  );
}
