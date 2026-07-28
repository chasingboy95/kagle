import { useMemo } from 'react';
import type { TrainingRecord } from '../types/training';
import { computeTrainingTrend } from '../utils/trainingTrend';

interface Props {
  records: TrainingRecord[];
  timeZone?: string;
}

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin}分钟`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

export default function TrainingTrend({ records, timeZone }: Props) {
  const trend = useMemo(
    () => computeTrainingTrend(records, timeZone),
    [records, timeZone],
  );

  if (trend.weeks.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-500">
        暂无足够数据生成趋势
      </div>
    );
  }

  const hasData = trend.weeks.some((w) => w.completedCount > 0);

  return (
    <section aria-labelledby="trend-title" className="space-y-4">
      <h2 id="trend-title" className="text-sm font-semibold text-slate-200">
        近四周趋势
      </h2>

      {!hasData && (
        <div className="text-center py-4 text-xs text-slate-500">
          完成训练后，这里会显示每周完成次数趋势
        </div>
      )}

      {/* Bar chart */}
      <div className="space-y-3">
        {/* Completion count bars */}
        <div>
          <p className="text-[10px] text-slate-500 mb-2">完成次数</p>
          <div className="flex items-end gap-3 h-24">
            {trend.weeks.map((week) => {
              const height = trend.maxCompletedCount > 0
                ? Math.max(8, (week.completedCount / trend.maxCompletedCount) * 100)
                : 8;
              return (
                <div key={week.weekKey} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium tabular-nums text-slate-400">
                    {week.completedCount}
                  </span>
                  <div
                    className="w-full rounded-t bg-indigo-500/40 transition-all"
                    style={{ height: `${height}%` }}
                    role="img"
                    aria-label={`${week.weekLabel}: ${week.completedCount}次完成`}
                  />
                  <span className="text-[9px] text-slate-600">{week.weekLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Duration bars */}
        {hasData && (
          <div>
            <p className="text-[10px] text-slate-500 mb-2">累计时长</p>
            <div className="flex items-end gap-3 h-20">
              {trend.weeks.map((week) => {
                const height = trend.maxDurationMs > 0
                  ? Math.max(8, (week.totalDurationMs / trend.maxDurationMs) * 100)
                  : 8;
                return (
                  <div key={week.weekKey} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] tabular-nums text-slate-500">
                      {formatDuration(week.totalDurationMs)}
                    </span>
                    <div
                      className="w-full rounded-t bg-emerald-500/30 transition-all"
                      style={{ height: `${height}%` }}
                      role="img"
                      aria-label={`${week.weekLabel}: ${formatDuration(week.totalDurationMs)}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Days per week */}
        {hasData && (
          <div className="grid grid-cols-5 gap-2 text-center">
            {trend.weeks.map((week) => (
              <div key={week.weekKey} className="rounded-lg bg-white/[0.03] py-2">
                <div className="text-xs font-bold text-indigo-300">{week.completedDays}</div>
                <div className="text-[9px] text-slate-600">训练天数</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
