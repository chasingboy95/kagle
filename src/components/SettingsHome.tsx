interface Props {
  planSummary: string;
  voiceSummary: string;
  reminderSummary: string;
  progressiveDisabled: boolean;
  onOpenPlan: () => void;
  onOpenVoice: () => void;
  onOpenReminder: () => void;
  onShowOnboarding: () => void;
  onOpenData: () => void;
  onReenableProgressive: () => void;
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
      className="flex min-h-14 w-full items-center justify-between gap-4 border-b border-warm-200/[0.05] px-4 py-3 text-left last:border-b-0 hover:bg-warm-200/[0.04]"
    >
      <span>
        <span className="block text-sm font-medium text-warm-200">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-warm-400">{summary}</span>
      </span>
      <span aria-hidden="true" className="text-lg text-warm-500">›</span>
    </button>
  );
}

export default function SettingsHome({
  planSummary,
  voiceSummary,
  reminderSummary,
  progressiveDisabled,
  onOpenPlan,
  onOpenVoice,
  onOpenReminder,
  onShowOnboarding,
  onOpenData,
  onReenableProgressive,
}: Props) {
  return (
    <main className="relative z-10 w-full max-w-sm flex-1 px-5 pt-4">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-warm-100">设置</h1>
        <p className="mt-1 text-sm text-warm-400">调整训练方式和应用偏好</p>
      </header>

      <section aria-labelledby="training-settings-title">
        <h2 id="training-settings-title" className="mb-2 px-1 text-xs font-medium tracking-[0.12em] text-warm-400">训练</h2>
        <div className="overflow-hidden rounded-2xl border border-warm-200/[0.06] bg-warm-200/[0.03]">
          <SettingRow label="训练计划" summary={planSummary} onClick={onOpenPlan} />
          <SettingRow label="声音与反馈" summary={voiceSummary} onClick={onOpenVoice} />
          <SettingRow label="训练提醒" summary={reminderSummary} onClick={onOpenReminder} />
        </div>
      </section>

      <section aria-labelledby="general-settings-title" className="mt-6">
        <h2 id="general-settings-title" className="mb-2 px-1 text-xs font-medium tracking-[0.12em] text-warm-400">通用</h2>
        <div className="overflow-hidden rounded-2xl border border-warm-200/[0.06] bg-warm-200/[0.03]">
          <SettingRow label="新手引导" summary="重新查看使用与安全说明" onClick={onShowOnboarding} />
          {progressiveDisabled && (
            <SettingRow label="渐进训练建议" summary="已关闭 · 点击重新开启" onClick={onReenableProgressive} />
          )}
          <SettingRow label="数据备份与恢复" summary="导出、导入和恢复本地数据" onClick={onOpenData} />
        </div>
      </section>
    </main>
  );
}
