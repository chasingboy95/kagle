import { DAY_LABELS } from '../hooks/useTrainingSchedule';
import type { TrainingScheduleSettings } from '../utils/appStorageSchemas';

interface Props {
  settings: TrainingScheduleSettings;
  onToggleEnabled: () => void;
  onSetDaysOfWeek: (days: number[]) => void;
  onSetReminderTime: (hour: number, minute: number) => void;
}

function Toggle({ id, label, description, checked, onChange }: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span>
        <span className="block text-sm text-slate-200">{label}</span>
        {description && <span className="block text-[11px] leading-4 text-slate-500">{description}</span>}
      </span>
      <span className="relative shrink-0">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="block h-6 w-11 rounded-full bg-slate-700 transition-colors peer-checked:bg-indigo-500 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900" />
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export default function ScheduleSettings({
  settings,
  onToggleEnabled,
  onSetDaysOfWeek,
  onSetReminderTime,
}: Props) {
  const hour = String(settings.reminderHour).padStart(2, '0');
  const minute = String(settings.reminderMinute).padStart(2, '0');

  const toggleDay = (dayIndex: number) => {
    const next = settings.daysOfWeek.includes(dayIndex)
      ? settings.daysOfWeek.filter((d) => d !== dayIndex)
      : [...settings.daysOfWeek, dayIndex];
    onSetDaysOfWeek(next);
  };

  const handleHourChange = (delta: number) => {
    const next = Math.min(23, Math.max(0, settings.reminderHour + delta));
    onSetReminderTime(next, settings.reminderMinute);
  };

  const handleMinuteChange = (delta: number) => {
    let nextMinute = settings.reminderMinute + delta;
    let nextHour = settings.reminderHour;
    if (nextMinute >= 60) { nextMinute = 0; nextHour = Math.min(23, nextHour + 1); }
    if (nextMinute < 0) { nextMinute = 59; nextHour = Math.max(0, nextHour - 1); }
    onSetReminderTime(nextHour, nextMinute);
  };

  return (
    <details className="group w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-300">
        <span>
          <span className="block text-[10px] font-medium tracking-[0.15em] text-slate-500">训练提醒</span>
          <span className="mt-0.5 block text-sm text-slate-200">
            {settings.enabled
              ? `每周 ${settings.daysOfWeek.map((d) => DAY_LABELS[d]).join('、')} · ${hour}:${minute}`
              : '已关闭'}
          </span>
        </span>
        <span aria-hidden="true" className="text-slate-500 transition-transform group-open:rotate-180">⌄</span>
      </summary>

      <div className="border-t border-white/[0.05] px-4 pb-4 pt-2">
        <Toggle
          id="schedule-enabled"
          label="启用训练提醒"
          description="在设定的时间提醒你进行训练"
          checked={settings.enabled}
          onChange={onToggleEnabled}
        />

        <fieldset className="py-2.5" disabled={!settings.enabled}>
          <legend className="mb-2 text-sm text-slate-300">训练日</legend>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, index) => (
              <label
                key={index}
                className={`flex cursor-pointer items-center justify-center w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                  settings.daysOfWeek.includes(index)
                    ? 'bg-indigo-500/30 text-indigo-200'
                    : 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.10]'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={settings.daysOfWeek.includes(index)}
                  onChange={() => toggleDay(index)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="py-2.5" disabled={!settings.enabled}>
          <legend className="mb-2 text-sm text-slate-300">提醒时间</legend>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleHourChange(1)}
              className="w-9 h-9 rounded-full bg-white/[0.07] text-sm text-slate-300 hover:bg-white/[0.12] transition-colors"
              aria-label="增加小时"
            >
              +
            </button>
            <span className="text-2xl font-light text-slate-100 tabular-nums">
              {String(settings.reminderHour).padStart(2, '0')}
            </span>
            <span className="text-lg text-slate-500">:</span>
            <span className="text-2xl font-light text-slate-100 tabular-nums">
              {String(settings.reminderMinute).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => handleMinuteChange(1)}
              className="w-9 h-9 rounded-full bg-white/[0.07] text-sm text-slate-300 hover:bg-white/[0.12] transition-colors"
              aria-label="增加分钟"
            >
              +
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 mt-1">
            <button
              type="button"
              onClick={() => handleHourChange(-1)}
              className="w-9 h-9 rounded-full bg-white/[0.07] text-sm text-slate-300 hover:bg-white/[0.12] transition-colors"
              aria-label="减少小时"
            >
              −
            </button>
            <span className="w-16 text-center" />
            <span className="w-4" />
            <span className="w-16 text-center" />
            <button
              type="button"
              onClick={() => handleMinuteChange(-1)}
              className="w-9 h-9 rounded-full bg-white/[0.07] text-sm text-slate-300 hover:bg-white/[0.12] transition-colors"
              aria-label="减少分钟"
            >
              −
            </button>
          </div>
        </fieldset>
      </div>
    </details>
  );
}
