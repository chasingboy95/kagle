import { useState } from 'react';
import type { TrainingRecord } from '../types/training';
import type { HistoryStats } from '../hooks/useTrainingHistory';
import TrainingCalendar from './TrainingCalendar';
import TrainingRecordDetail from './TrainingRecordDetail';

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
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const selectedRecord = records.find((record) => record.id === selectedRecordId);

  if (selectedRecord) {
    return (
      <TrainingRecordDetail
        record={selectedRecord}
        onBack={() => setSelectedRecordId(null)}
        onDelete={onRemoveRecord}
      />
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <div className="grid grid-cols-2 rounded-xl bg-black/20 p-1">
        <button
          type="button"
          onClick={() => setView('list')}
          aria-pressed={view === 'list'}
          className={`rounded-lg py-2 text-sm ${view === 'list' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
        >
          列表
        </button>
        <button
          type="button"
          onClick={() => setView('calendar')}
          aria-pressed={view === 'calendar'}
          className={`rounded-lg py-2 text-sm ${view === 'calendar' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
        >
          日历
        </button>
      </div>

      {view === 'calendar' ? (
        <TrainingCalendar records={records} onOpenRecord={setSelectedRecordId} />
      ) : (
        <>
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
            <button
              type="button"
              key={r.id}
              onClick={() => setSelectedRecordId(r.id)}
              className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2.5 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              aria-label={`查看 ${formatDate(r.endedAt)} 训练记录详情`}
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
              <span aria-hidden="true" className="ml-2 shrink-0 text-slate-500">›</span>
            </button>
          ))}
        </div>
      )}
        </>
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
