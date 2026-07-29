interface Props {
  planSummary: string;
  voiceSummary: string;
  onOpenPlan: () => void;
  onOpenVoice: () => void;
  onOpenMore: () => void;
}

function SettingRow({ label, summary, onClick }: {
  label: string;
  summary: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center justify-between gap-4 border-b border-white/[0.05] px-4 py-3 text-left last:border-b-0 hover:bg-white/[0.04]"
    >
      <span>
        <span className="block text-sm font-medium text-slate-200">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{summary}</span>
      </span>
      <span aria-hidden="true" className="text-lg text-slate-600">›</span>
    </button>
  );
}

export default function SettingsHome({ planSummary, voiceSummary, onOpenPlan, onOpenVoice, onOpenMore }: Props) {
  return (
    <main className="relative z-10 w-full max-w-sm flex-1 px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-white">设置</h1>
        <p className="mt-1 text-sm text-slate-500">调整训练方式和应用偏好</p>
      </header>

      <section aria-labelledby="training-settings-title">
        <h2 id="training-settings-title" className="mb-2 px-1 text-xs font-medium tracking-[0.12em] text-slate-500">训练</h2>
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
          <SettingRow label="训练计划" summary={planSummary} onClick={onOpenPlan} />
          <SettingRow label="声音与反馈" summary={voiceSummary} onClick={onOpenVoice} />
        </div>
      </section>

      <section aria-labelledby="general-settings-title" className="mt-6">
        <h2 id="general-settings-title" className="mb-2 px-1 text-xs font-medium tracking-[0.12em] text-slate-500">通用</h2>
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
          <SettingRow label="提醒、引导与数据" summary="训练提醒 · 新手引导 · 本地数据" onClick={onOpenMore} />
        </div>
      </section>
    </main>
  );
}
