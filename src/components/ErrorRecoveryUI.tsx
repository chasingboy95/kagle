import { motion } from 'framer-motion';

interface ErrorRecoveryUIProps {
  /** Error message shown only in dev mode. */
  message?: string;
  /** Component stack shown only in dev mode. */
  stack?: string | null;
  onReload: () => void;
  onReset: () => void;
  /** Whether the user is in the second step of "清除数据并重置" confirmation. */
  confirmingReset?: boolean;
  onConfirmReset?: () => void;
  onCancelReset?: () => void;
}

export default function ErrorRecoveryUI({
  message,
  stack,
  onReload,
  onReset,
  confirmingReset,
  onConfirmReset,
  onCancelReset,
}: ErrorRecoveryUIProps) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-[var(--color-warm-950)] via-warm-900 to-[var(--color-warm-900)] flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm rounded-2xl border border-warm-200/10 bg-warm-200/5 p-6 text-center backdrop-blur"
        role="alert"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl">
          !
        </div>
        <h2 className="text-lg font-semibold text-warm-100">
          出了点问题
        </h2>
        <p className="mt-2 text-sm text-warm-400 leading-relaxed">
          应用遇到了意外错误。请尝试重新加载，或清除本地数据后重新开始。
        </p>
        <p className="mt-1 text-xs text-warm-400">
          您的数据不会上传至任何第三方服务。
        </p>

        {isDev && message && (
          <details className="mt-4 text-left">
            <summary className="text-xs text-warm-400 cursor-pointer hover:text-warm-400">
              技术详情（仅开发环境可见）
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-warm-950/80 p-3 text-[11px] text-red-300/80 leading-relaxed whitespace-pre-wrap break-all">
              {message}
            </pre>
            {stack && (
              <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-warm-950/80 p-3 text-[11px] text-warm-400 leading-relaxed whitespace-pre-wrap">
                {stack}
              </pre>
            )}
          </details>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {confirmingReset ? (
            <>
              <p className="text-sm text-amber-400 leading-relaxed">
                此操作将清除训练历史、配置、收藏和设置，且不可恢复。确定继续？
              </p>
              <button
                onClick={onConfirmReset}
                className="w-full rounded-full bg-red-500 py-3 text-sm font-medium text-warm-100 transition-colors active:bg-red-600"
              >
                确认清除
              </button>
              <button
                onClick={onCancelReset}
                className="w-full rounded-full border border-warm-200/10 bg-transparent py-3 text-sm font-medium text-warm-400 transition-colors active:bg-warm-200/[0.06]"
              >
                取消
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onReload}
                className="w-full rounded-full bg-white py-3 text-sm font-medium text-warm-900 transition-colors active:bg-warm-200/90"
              >
                重新加载
              </button>
              <button
                onClick={onReset}
                className="w-full rounded-full border border-warm-200/10 bg-transparent py-3 text-sm font-medium text-warm-400 transition-colors active:bg-warm-200/[0.06]"
              >
                清除数据并重置
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
