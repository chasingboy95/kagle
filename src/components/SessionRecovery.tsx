import { useRef } from 'react';
import type { SessionSnapshot } from '../types/training';
import { calcTotalDuration } from '../utils/time';
import { formatSeconds } from '../utils/time';
import { useModalFocus } from '../hooks/useModalFocus';

interface Props {
  snapshot: SessionSnapshot;
  onContinue: () => void;
  onDiscard: () => void;
}

export default function SessionRecovery({ snapshot, onContinue, onDiscard }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Recovery requires an explicit continue/discard choice, so Escape is ignored.
  useModalFocus(dialogRef);
  const totalSec = calcTotalDuration(
    snapshot.config.contractTime,
    snapshot.config.holdTime,
    snapshot.config.relaxTime,
    snapshot.config.rounds,
    snapshot.config.sets ?? 1,
    snapshot.config.restBetweenSets ?? 30,
  );
  const elapsedSec = Math.floor(snapshot.sessionElapsedMs / 1000);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-recovery-title"
      aria-describedby="session-recovery-description"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-4 pb-8 sm:pb-0"
    >
      <div className="w-full max-w-sm bg-warm-900 border border-warm-200/[0.08] rounded-2xl px-6 py-6 space-y-4">
        <h2 id="session-recovery-title" className="text-lg font-semibold text-warm-100 text-center">
          恢复训练
        </h2>
        <p id="session-recovery-description" className="text-sm text-warm-400 text-center leading-relaxed">
          检测到未完成的训练。已用时 {formatSeconds(elapsedSec)} / {formatSeconds(totalSec)}，完成 {snapshot.round + 1} / {snapshot.config.rounds} 组。
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onDiscard}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-warm-400 hover:text-warm-200 transition-colors"
          >
            放弃
          </button>
          <button
            type="button"
            onClick={onContinue}
            data-autofocus
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-accent/30 text-accent hover:bg-accent/40 transition-colors"
          >
            继续训练
          </button>
        </div>
      </div>
    </div>
  );
}
