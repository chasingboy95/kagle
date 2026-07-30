import { useMemo, useState } from 'react';
import type { TrainingRecord } from '../types/training';
import {
  daysInMonth,
  mondayFirstOffset,
  monthForDate,
  shiftMonth,
  summarizeCalendarMonth,
  type CalendarMonth,
} from '../utils/trainingCalendar';

interface TrainingCalendarProps {
  records: TrainingRecord[];
  onOpenRecord: (id: string) => void;
  initialMonth?: CalendarMonth;
  timeZone?: string;
}

const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return totalMinutes > 0 ? `${totalMinutes}分${seconds}秒` : `${seconds}秒`;
}

function timeLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export default function TrainingCalendar({
  records,
  onOpenRecord,
  initialMonth,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}: TrainingCalendarProps) {
  const [month, setMonth] = useState<CalendarMonth>(
    initialMonth ?? monthForDate(new Date().toISOString(), timeZone),
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const summary = useMemo(
    () => summarizeCalendarMonth(records, month, timeZone),
    [month, records, timeZone],
  );
  const selectedDay = selectedDateKey ? summary.days.get(selectedDateKey) : undefined;
  const dayCount = daysInMonth(month);
  const offset = mondayFirstOffset(month);

  const changeMonth = (delta: number) => {
    setMonth((current) => shiftMonth(current, delta));
    setSelectedDateKey(null);
  };

  return (
    <section aria-labelledby="calendar-title" className="space-y-4">
      <header className="flex items-center justify-between">
        <button type="button" onClick={() => changeMonth(-1)} aria-label="上个月" className="grid min-h-11 min-w-11 place-items-center rounded-lg bg-warm-200/[0.06] text-warm-200">‹</button>
        <h2 id="calendar-title" className="text-base font-semibold text-warm-100">
          {month.year}年{month.month}月
        </h2>
        <button type="button" onClick={() => changeMonth(1)} aria-label="下个月" className="grid min-h-11 min-w-11 place-items-center rounded-lg bg-warm-200/[0.06] text-warm-200">›</button>
      </header>

      <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        {[
          ['本月完成', summary.completedCount, '次'],
          ['训练天数', summary.completedDays, '天'],
          ['累计时长', formatDuration(summary.completedDurationMs), ''],
          ['最长连续', summary.longestStreakDays, '天'],
        ].map(([label, value, unit]) => (
          <div key={label} className="rounded-lg bg-warm-200/5 px-1 py-2.5">
            <div className="text-sm font-bold text-accent">{value}{unit}</div>
            <div className="mt-0.5 text-xs text-warm-400">{label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="grid grid-cols-7 text-center text-xs text-warm-500">
          {weekdays.map((weekday) => <span key={weekday} className="py-1">{weekday}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}
          {Array.from({ length: dayCount }, (_, index) => {
            const dayNumber = index + 1;
            const dateKey = `${month.year}-${String(month.month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
            const day = summary.days.get(dateKey);
            const selected = dateKey === selectedDateKey;
            const status = day
              ? day.completedCount > 0
                ? `${day.completedCount}次完成${day.stoppedCount ? `，${day.stoppedCount}次中止` : ''}`
                : `${day.stoppedCount}次中止`
              : '无记录';
            return (
              <button
                type="button"
                key={dateKey}
                onClick={() => setSelectedDateKey(dateKey)}
                aria-label={`${month.month}月${dayNumber}日，${status}`}
                aria-pressed={selected}
                className={`relative min-h-11 rounded-lg text-xs transition-colors ${
                  selected ? 'bg-accent/30 text-warm-900 ring-1 ring-accent'
                    : day?.completedCount ? 'bg-emerald-500/15 text-emerald-200'
                      : day?.stoppedCount ? 'bg-amber-500/15 text-amber-200'
                        : 'bg-warm-200/[0.025] text-warm-400'
                }`}
              >
                {dayNumber}
                {day?.stoppedCount ? <span aria-hidden="true" className="absolute bottom-1 right-1 h-1 w-1 rounded-full bg-amber-300" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-warm-400">
        <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-500/30" />有完成</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-300" />含中止</span>
      </div>

      {selectedDateKey && (
        <div className="rounded-xl border border-warm-200/[0.06] bg-black/10 p-3">
          <h3 className="text-sm font-medium text-warm-200">
            {Number(selectedDateKey.slice(5, 7))}月{Number(selectedDateKey.slice(8, 10))}日记录
          </h3>
          {!selectedDay ? (
            <p className="py-3 text-xs text-warm-400">当天暂无训练记录</p>
          ) : (
            <div className="mt-2 space-y-2">
              {selectedDay.records.map((record) => (
                <button
                  type="button"
                  key={record.id}
                  onClick={() => onOpenRecord(record.id)}
                  className="flex min-h-11 w-full items-center justify-between rounded-lg bg-warm-200/[0.05] px-3 py-2 text-left text-xs text-warm-200"
                  aria-label={`查看 ${timeLabel(record.endedAt, timeZone)} ${record.status === 'completed' ? '已完成' : '已中止'}记录详情`}
                >
                  <span>{timeLabel(record.endedAt, timeZone)} · {record.completedReps}/{record.targetReps}次</span>
                  <span className={record.status === 'completed' ? 'text-emerald-300' : 'text-amber-300'}>
                    {record.status === 'completed' ? '完成' : '中止'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
