import { useRef } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';

interface Props {
  title: string;
  onContinueEditing: () => void;
  onDiscard: () => void;
}

export default function DiscardChangesDialog({
  title,
  onContinueEditing,
  onDiscard,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocus(dialogRef, onContinueEditing);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 px-5 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="discard-changes-title"
        aria-describedby="discard-changes-description"
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl"
      >
        <h2 id="discard-changes-title" className="text-base font-semibold text-white">
          {title}
        </h2>
        <p id="discard-changes-description" className="mt-2 text-sm leading-6 text-slate-400">
          当前修改尚未应用。放弃后会恢复打开设置前的内容。
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            data-autofocus
            onClick={onContinueEditing}
            className="min-h-11 flex-1 rounded-xl bg-white/10 px-4 text-sm font-medium text-slate-200 hover:bg-white/15"
          >
            继续编辑
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="min-h-11 flex-1 rounded-xl bg-red-500/15 px-4 text-sm font-medium text-red-300 hover:bg-red-500/25"
          >
            放弃修改
          </button>
        </div>
      </div>
    </div>
  );
}
