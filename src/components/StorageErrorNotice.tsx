interface Props {
  message: string;
  onDismiss: () => void;
}

export default function StorageErrorNotice({ message, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="fixed left-4 right-4 top-4 z-50 mx-auto flex max-w-sm items-start gap-3 rounded-xl border border-amber-400/20 bg-slate-900/95 px-4 py-3 text-sm text-amber-100 shadow-xl"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-amber-300 hover:bg-white/10"
      >
        知道了
      </button>
    </div>
  );
}
