import { useState } from 'react';
import type { WeeklyGoalSettings } from '../utils/appStorageSchemas';
import type { WeeklyGoalProgress } from '../utils/weeklyGoal';

interface WeeklyGoalProps {
  settings: WeeklyGoalSettings;
  progress: WeeklyGoalProgress;
  onSetTargetDays: (days: number) => void;
  onDisable: () => void;
}

export default function WeeklyGoal({
  settings,
  progress,
  onSetTargetDays,
  onDisable,
}: WeeklyGoalProps) {
  const [editing, setEditing] = useState(false);
  const [draftDays, setDraftDays] = useState(settings.targetDays);

  if (!settings.enabled && !editing) {
    return (
      <div className="rounded-xl border border-warm-200/[0.06] bg-warm-200/[0.03] p-3">
        <p className="text-sm font-medium text-warm-200">每周训练目标</p>
        <p className="mt-1 text-xs leading-5 text-warm-400">按完成训练的不同日期计算，可随时关闭。</p>
        <button type="button" onClick={() => setEditing(true)} className="mt-2 rounded-lg bg-accent/20 px-3 py-2 text-xs font-medium text-warm-100">
          设置目标
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-accent/15 bg-accent/[0.06] p-3">
        <label htmlFor="weekly-goal-days" className="text-sm text-warm-200">每周计划训练天数</label>
        <div className="mt-2 flex items-center gap-2">
          <select
            id="weekly-goal-days"
            value={draftDays}
            onChange={(event) => setDraftDays(Number(event.target.value))}
            className="flex-1 rounded-lg bg-warm-800 px-3 py-2 text-sm text-warm-100"
          >
            {Array.from({ length: 7 }, (_, index) => index + 1).map((days) => (
              <option key={days} value={days}>{days} 天</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => { onSetTargetDays(draftDays); setEditing(false); }}
            className="rounded-lg bg-accent/30 px-3 py-2 text-sm text-warm-100"
          >
            保存
          </button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-lg bg-warm-200/[0.06] px-3 py-2 text-sm text-warm-200">
            取消
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.min(100, (progress.completedDays / settings.targetDays) * 100);
  return (
    <div className="rounded-xl border border-warm-200/[0.06] bg-warm-200/[0.03] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-warm-200">本周 {progress.completedDays} / {settings.targetDays} 天</p>
          <p className="mt-1 text-xs text-warm-400">
            {progress.remainingDays > 0
              ? `还差 ${progress.remainingDays} 天，按自己的节奏安排即可。`
              : '本周目标已完成，按自己的节奏继续即可。'}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setDraftDays(settings.targetDays); setEditing(true); }} className="text-xs text-accent">调整</button>
          <button type="button" onClick={onDisable} className="text-xs text-warm-400">关闭目标</button>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-warm-200/[0.06]" role="progressbar" aria-label="每周目标进度" aria-valuemin={0} aria-valuemax={settings.targetDays} aria-valuenow={Math.min(progress.completedDays, settings.targetDays)}>
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-2 text-[10px] text-warm-500">周一至周日 · 同一天多次完成只计 1 天</p>
    </div>
  );
}
