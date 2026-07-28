import { useState } from 'react';

export interface StorageErrorEntry {
  source: string;
  message: string;
  retry?: () => void;
}

interface Props {
  errors: StorageErrorEntry[];
  onDismiss: () => void;
}

export default function StorageErrorNotice({ errors, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (errors.length === 0) return null;

  const primary = errors[0];
  const extraCount = errors.length - 1;

  return (
    <div
      role="alert"
      className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-sm rounded-xl border border-amber-400/20 bg-slate-900/95 px-4 py-3 text-sm text-amber-100 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-300">{primary.source}</p>
          <p className="mt-0.5 text-sm leading-5">{primary.message}</p>
          {extraCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-xs font-medium text-amber-400/70 hover:text-amber-300"
            >
              {expanded ? '收起' : `还有 ${extraCount} 个错误`}
            </button>
          )}
          {expanded && extraCount > 0 && (
            <ul className="mt-2 space-y-2 border-t border-amber-400/10 pt-2">
              {errors.slice(1).map((e, i) => (
                <li key={i} className="text-xs leading-5 text-amber-200/80">
                  <span className="font-medium text-amber-300">{e.source}：</span>
                  {e.message}
                  {e.retry && (
                    <button
                      type="button"
                      onClick={e.retry}
                      className="ml-2 underline hover:text-amber-100"
                    >
                      重试
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex shrink-0 items-start gap-1">
          {primary.retry && (
            <button
              type="button"
              onClick={primary.retry}
              className="rounded-md px-2 py-1 text-xs font-medium text-amber-300 hover:bg-white/10"
            >
              重试
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md px-2 py-1 text-xs font-medium text-amber-300 hover:bg-white/10"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
