import type { TrainingRecord } from '../types/training';
import type { HistoryStats } from '../hooks/useTrainingHistory';

interface TrainingHistoryProps {
  records: TrainingRecord[];
  stats: HistoryStats;
  onRemoveRecord: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}分${sec}秒` : `${sec}秒`;
}

export default function TrainingHistory({
  records,
  stats,
  onRemoveRecord,
  onClearAll,
  onClose,
}: TrainingHistoryProps) {
  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-white/5 px-2 py-3">
          <div className="text-lg font-bold text-indigo-300">{stats.weeklyCompletions}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">本周完成</div>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-3">
          <div className="text-lg font-bold text-indigo-300">{stats.streakDays}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">连续天数</div>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-3">
          <div className="text-lg font-bold text-indigo-300">{stats.totalCompletions}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">总次数</div>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-3">
          <div className="text-lg font-bold text-indigo-300">{formatDuration(stats.totalDurationMs)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">累计时长</div>
        </div>
      </div>

      {/* Records list */}
      {records.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">
          暂无训练记录
        </p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {records.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-200 truncate">
                    {formatDate(r.endedAt)}
                  </span>
                  {r.status === 'stopped' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
                      中止
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {r.completedReps}/{r.targetReps}次 · {formatDuration(r.actualDurationMs)}
                </div>
              </div>
              <button
                onClick={() => onRemoveRecord(r.id)}
                className="ml-2 text-slate-500 hover:text-red-400 transition-colors shrink-0"
                aria-label="删除记录"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {records.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex-1 rounded-lg bg-red-500/10 text-red-400 py-2 text-sm font-medium hover:bg-red-500/20 transition-colors"
          >
            清除全部
          </button>
        )}
        <button
          onClick={onClose}
          className="flex-1 rounded-lg bg-white/10 text-slate-300 py-2 text-sm font-medium hover:bg-white/15 transition-colors"
        >
          返回
        </button>
      </div>
    </div>
  );
}
