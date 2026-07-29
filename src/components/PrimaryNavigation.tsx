export type PrimaryPage = 'training' | 'records' | 'settings';

interface Props {
  current: PrimaryPage;
  onNavigate: (page: PrimaryPage) => void;
}

const items: Array<{ page: PrimaryPage; label: string; icon: string }> = [
  { page: 'training', label: '训练', icon: '◎' },
  { page: 'records', label: '记录', icon: '▤' },
  { page: 'settings', label: '设置', icon: '⚙' },
];

export default function PrimaryNavigation({ current, onNavigate }: Props) {
  return (
    <nav
      aria-label="主要导航"
      className="sticky bottom-0 z-20 w-full border-t border-white/[0.06] bg-[#111827]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <div className="mx-auto grid w-full max-w-sm grid-cols-3 px-4 py-2">
        {items.map(({ page, label, icon }) => {
          const selected = current === page;
          return (
            <button
              key={page}
              type="button"
              data-page={page}
              aria-current={selected ? 'page' : undefined}
              onClick={() => onNavigate(page)}
              className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium transition-colors ${
                selected ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
              }`}
            >
              <span aria-hidden="true" className="text-base leading-none">{icon}</span>
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
