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

  return (
    <section className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 pb-4 pt-2">
        <Toggle
          id="schedule-enabled"
          label="启用训练提醒"
          description="在设定的时间提醒你进行训练"
          checked={settings.enabled}
          onChange={onToggleEnabled}
        />

        <fieldset className="py-2.5" disabled={!settings.enabled}>
          <legend className="mb-2 text-sm text-slate-300">训练日</legend>
          <div className="grid grid-cols-4 gap-2">
            {DAY_LABELS.map((label, index) => (
              <label
                key={index}
                className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-xs font-medium transition-colors ${
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

        <label className={`block py-2.5 ${settings.enabled ? '' : 'opacity-40'}`}>
          <span className="mb-2 block text-sm text-slate-300">提醒时间</span>
          <input
            type="time"
            value={`${hour}:${minute}`}
            disabled={!settings.enabled}
            aria-label="提醒时间"
            onChange={(event) => {
              const [nextHour, nextMinute] = event.target.value.split(':').map(Number);
              if (Number.isInteger(nextHour) && Number.isInteger(nextMinute)) {
                onSetReminderTime(nextHour, nextMinute);
              }
            }}
            className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 text-base text-slate-100 scheme-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          />
        </label>
    </section>
  );
}
