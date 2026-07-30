import { useRef } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';

interface Props {
  recordCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmClearAllDialog({
  recordCount,
  onCancel,
  onConfirm,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocus(dialogRef, onCancel);

  const desc =
    recordCount === 1
      ? '将删除 1 条训练记录，此操作不可撤销。'
      : `将删除全部 ${recordCount} 条训练记录，此操作不可撤销。`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-all-dialog-title"
        aria-describedby="clear-all-dialog-desc"
        className="mx-4 w-full max-w-sm rounded-2xl border border-warm-200/[0.06] bg-warm-900 p-6 shadow-xl"
      >
        <h2
          id="clear-all-dialog-title"
          className="text-lg font-semibold text-warm-100"
        >
          清除全部记录
        </h2>

        <p id="clear-all-dialog-desc" className="mt-2 text-sm leading-5 text-warm-400">
          {desc}
        </p>
        <p className="mt-1 text-xs leading-4 text-warm-400">
          清除前将自动备份当前数据，您可通过「数据备份与恢复」功能还原。
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            data-autofocus
            className="flex-1 rounded-lg bg-warm-200/10 py-2 text-sm font-medium text-warm-200 transition-colors hover:bg-warm-200/15"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500/15 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/25"
          >
            确认清除
          </button>
        </div>
      </div>
    </div>
  );
}
