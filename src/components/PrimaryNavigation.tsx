export type PrimaryPage = 'training' | 'records' | 'settings';

interface Props {
  current: PrimaryPage;
  onNavigate: (page: PrimaryPage) => void;
}

const items: Array<{ page: PrimaryPage; label: string }> = [
  { page: 'training', label: '训练' },
  { page: 'records', label: '记录' },
  { page: 'settings', label: '设置' },
];

function NavigationIcon({ page }: { page: PrimaryPage }) {
  if (page === 'training') {
    return (
      <svg aria-hidden="true" className="size-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  if (page === 'records') {
    return (
      <svg aria-hidden="true" className="size-6" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 4.75h10A2.25 2.25 0 0 1 19.25 7v10A2.25 2.25 0 0 1 17 19.25H7A2.25 2.25 0 0 1 4.75 17V7A2.25 2.25 0 0 1 7 4.75Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-6" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19 12a7.1 7.1 0 0 0-.08-1l1.57-1.22-1.8-3.12-1.86.75a7.2 7.2 0 0 0-1.72-1L14.82 4h-3.6l-.29 2.4a7.2 7.2 0 0 0-1.72 1l-1.86-.75-1.8 3.12L7.12 11a7.1 7.1 0 0 0 0 2l-1.57 1.22 1.8 3.12 1.86-.75a7.2 7.2 0 0 0 1.72 1l.29 2.4h3.6l.29-2.4a7.2 7.2 0 0 0 1.72-1l1.86.75 1.8-3.12L18.92 13c.05-.33.08-.66.08-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PrimaryNavigation({ current, onNavigate }: Props) {
  return (
    <nav
      aria-label="主要导航"
      className="fixed inset-x-0 bottom-0 z-20 w-full bg-[#111827] pb-[var(--safe-area-bottom)]"
    >
      <div className="primary-navigation-content mx-auto grid h-12 w-full max-w-sm grid-cols-3 px-3">
        {items.map(({ page, label }) => {
          const selected = current === page;
          return (
            <button
              key={page}
              type="button"
              data-page={page}
              aria-current={selected ? 'page' : undefined}
              onClick={() => onNavigate(page)}
              className={`relative flex min-h-11 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                selected ? 'text-indigo-300' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {selected && (
                <span aria-hidden="true" className="absolute top-1 h-1 w-1 rounded-full bg-indigo-300" />
              )}
              <NavigationIcon page={page} />
              <span className="leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
