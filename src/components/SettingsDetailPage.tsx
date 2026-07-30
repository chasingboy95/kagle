import type { ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  onBack: () => void;
  children: ReactNode;
}

export default function SettingsDetailPage({ title, description, onBack, children }: Props) {
  return (
    <main className="relative z-10 w-full max-w-sm flex-1 px-5 pt-4 pb-6">
      <header className="mb-5 flex items-start gap-3">
        <button
          type="button"
          aria-label="返回设置"
          onClick={onBack}
          className="grid min-h-11 min-w-11 place-items-center rounded-full text-xl text-warm-200 hover:bg-warm-200/10"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div className="pt-1">
          <h1 className="text-lg font-semibold text-warm-100">{title}</h1>
          <p className="mt-0.5 text-xs leading-5 text-warm-400">{description}</p>
        </div>
      </header>
      {children}
    </main>
  );
}
