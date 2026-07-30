import { useState, useCallback } from 'react';
import { CLEAR_ALL_BACKUP_KEY } from '../types/training';
import type { TrainingRecord } from '../types/training';
import type { HistoryStats } from '../hooks/useTrainingHistory';
import ConfirmClearAllDialog from './ConfirmClearAllDialog';
import TrainingCalendar from './TrainingCalendar';
import TrainingRecordDetail from './TrainingRecordDetail';
import WeeklyGoal from './WeeklyGoal';
import TrainingTrend from './TrainingTrend';
import type { WeeklyGoalSettings } from '../utils/appStorageSchemas';
import type { WeeklyGoalProgress } from '../utils/weeklyGoal';

interface TrainingHistoryProps {
  records: TrainingRecord[];
  stats: HistoryStats;
  onRemoveRecord: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  weeklyGoal: WeeklyGoalSettings;
  weeklyProgress: WeeklyGoalProgress;
  onSetWeeklyTarget: (days: number) => void;
  onDisableWeeklyGoal: () => void;
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
  weeklyGoal,
  weeklyProgress,
  onSetWeeklyTarget,
  onDisableWeeklyGoal,
}: TrainingHistoryProps) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'calendar' | 'trend'>('list');
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "stopped">("all");
  const [confirmingClear, setConfirmingClear] = useState(false);
  const selectedRecord = records.find((record) => record.id === selectedRecordId);
  const filteredRecords = statusFilter === 'all'
    ? records
    : records.filter((record) => record.status === statusFilter);
  const handleClearAll = useCallback(() => {
    // Backup before clearing
    try {
      localStorage.setItem(CLEAR_ALL_BACKUP_KEY, JSON.stringify(records));
    } catch {
      // Backup best-effort; still show dialog
    }
    setConfirmingClear(true);
  }, [records]);
  const handleClearConfirm = useCallback(() => {
    setConfirmingClear(false);
    onClearAll();
  }, [onClearAll]);
  const handleClearCancel = useCallback(() => {
    setConfirmingClear(false);
  }, []);

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
      <header className="flex min-h-11 items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="返回训练"
          className="grid min-h-11 min-w-11 place-items-center rounded-full text-xl text-warm-200 transition-colors hover:bg-warm-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div>
          <h1 className="text-lg font-semibold text-white">训练记录</h1>
          <p className="text-xs text-warm-400">查看进度、日历和训练详情</p>
        </div>
      </header>
      <WeeklyGoal
        settings={weeklyGoal}
        progress={weeklyProgress}
        onSetTargetDays={onSetWeeklyTarget}
        onDisable={onDisableWeeklyGoal}
      />
      <div className="grid grid-cols-3 rounded-xl bg-black/20 p-1">
        <button
          type="button"
          onClick={() => setView('list')}
          aria-pressed={view === 'list'}
          className={`min-h-11 rounded-lg py-2 text-sm ${view === 'list' ? 'bg-warm-200/10 text-white' : 'text-warm-400'}`}
        >
          列表
        </button>
        <button
          type="button"
          onClick={() => setView('calendar')}
          aria-pressed={view === 'calendar'}
          className={`min-h-11 rounded-lg py-2 text-sm ${view === 'calendar' ? 'bg-warm-200/10 text-white' : 'text-warm-400'}`}
        >
          日历
        </button>
        <button
          type="button"
          onClick={() => setView('trend')}
          aria-pressed={view === 'trend'}
          className={`min-h-11 rounded-lg py-2 text-sm ${view === 'trend' ? 'bg-warm-200/10 text-white' : 'text-warm-400'}`}
        >
          趋势
        </button>
      </div>

      {view === 'calendar' ? (
        <TrainingCalendar records={records} onOpenRecord={setSelectedRecordId} />
      ) : view === 'trend' ? (
        <TrainingTrend records={records} />
      ) : (
        <>
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <div className="rounded-lg bg-warm-200/5 px-2 py-3">
          <div className="text-lg font-bold text-accent">{stats.weeklyCompletions}</div>
          <div className="text-xs text-warm-400 mt-0.5">本周完成</div>
        </div>
        <div className="rounded-lg bg-warm-200/5 px-2 py-3">
          <div className="text-lg font-bold text-accent">{stats.streakDays}</div>
          <div className="text-xs text-warm-400 mt-0.5">连续天数</div>
        </div>
        <div className="rounded-lg bg-warm-200/5 px-2 py-3">
          <div className="text-lg font-bold text-accent">{stats.totalCompletions}</div>
          <div className="text-xs text-warm-400 mt-0.5">总次数</div>
        </div>
        <div className="rounded-lg bg-warm-200/5 px-2 py-3">
          <div className="text-lg font-bold text-accent">{formatDuration(stats.totalDurationMs)}</div>
          <div className="text-xs text-warm-400 mt-0.5">累计时长</div>
        </div>
      </div>

      {/* Status filter */}
          {view === 'list' && records.length > 0 && (
            <div className="flex gap-1 rounded-lg bg-black/20 p-0.5">
              {([{ value: 'all', label: '全部' }, { value: 'completed', label: '已完成' }, { value: 'stopped', label: '已中止' }] as const).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  aria-pressed={statusFilter === value}
                  className={`min-h-11 flex-1 rounded-md py-2 text-xs transition-colors ${
                    statusFilter === value
                      ? 'bg-warm-200/10 text-white'
                      : 'text-warm-400 hover:text-warm-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
      {/* Records list */}
      {filteredRecords.length === 0 ? (
        <p className="text-sm text-warm-400 text-center py-8">
          {records.length === 0
            ? '暂无训练记录'
            : statusFilter === 'completed'
              ? '暂无已完成记录'
              : '暂无已中止记录'}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredRecords.map((r) => (
            <button
              type="button"
              key={r.id}
              onClick={() => setSelectedRecordId(r.id)}
              className="flex min-h-11 w-full items-center justify-between rounded-lg bg-warm-200/5 px-3 py-2.5 text-left transition-colors hover:bg-warm-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`查看 ${formatDate(r.endedAt)} 训练记录详情`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-warm-200 truncate">
                    {formatDate(r.endedAt)}
                  </span>
                  {r.status === 'stopped' && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
                      中止
                    </span>
                  )}
                </div>
                <div className="text-xs text-warm-400 mt-0.5">
                  {r.completedReps}/{r.targetReps}次 · {formatDuration(r.actualDurationMs)}
                </div>
              </div>
              <span aria-hidden="true" className="ml-2 shrink-0 text-warm-400">›</span>
            </button>
          ))}
        </div>
      )}
        </>
      )}

      {confirmingClear && (
        <ConfirmClearAllDialog
          recordCount={records.length}
          onCancel={handleClearCancel}
          onConfirm={handleClearConfirm}
        />
      )}
      {records.length > 0 && (
        <button
          type="button"
          onClick={handleClearAll}
          className="w-full min-h-11 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
        >
          清除全部
        </button>
      )}
    </div>
  );
}
