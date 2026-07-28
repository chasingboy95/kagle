import { useState } from 'react';
import { resolvePreset, type TrainingConfig, type TrainingRecord } from '../types/training';

interface TrainingRecordDetailProps {
  record: TrainingRecord;
  onBack: () => void;
  onDelete: (id: string) => void;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
}

function recordConfig(record: TrainingRecord): TrainingConfig {
  return {
    contractTime: record.contractSec,
    holdTime: record.holdSec,
    relaxTime: record.relaxSec,
    rounds: record.targetReps,
  };
}

export default function TrainingRecordDetail({
  record,
  onBack,
  onDelete,
}: TrainingRecordDetailProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const preset = resolvePreset(recordConfig(record));

  const confirmDelete = () => {
    onDelete(record.id);
    onBack();
  };

  return (
    <section aria-labelledby="record-detail-title" className="w-full max-w-sm mx-auto space-y-4">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
        >
          返回记录
        </button>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          record.status === 'completed'
            ? 'bg-emerald-500/15 text-emerald-300'
            : 'bg-amber-500/15 text-amber-300'
        }`}>
          {record.status === 'completed' ? '已完成' : '已中止'}
        </span>
      </header>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <h2 id="record-detail-title" className="text-lg font-semibold text-slate-100">训练记录详情</h2>
        <p className="mt-1 text-xs text-slate-500">
          {preset ? `预设 · ${preset.label}` : '自定义配置'}
        </p>

        <dl className="mt-4 divide-y divide-white/[0.05]">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-sm text-slate-500">开始时间</dt>
            <dd className="text-right text-sm text-slate-200">{formatDateTime(record.startedAt)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-sm text-slate-500">结束时间</dt>
            <dd className="text-right text-sm text-slate-200">{formatDateTime(record.endedAt)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-sm text-slate-500">训练节奏</dt>
            <dd className="text-right text-sm text-slate-200">
              收缩 {record.contractSec}秒 · 保持 {record.holdSec}秒 · 放松 {record.relaxSec}秒
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-sm text-slate-500">目标与完成</dt>
            <dd className="text-right text-sm text-slate-200">
              {record.completedReps} / {record.targetReps} 次
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-sm text-slate-500">实际活动时长</dt>
            <dd className="text-right text-sm text-slate-200">{formatDuration(record.actualDurationMs)}</dd>
          </div>
        </dl>
      </div>

      {confirmingDelete ? (
        <div role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 p-3">
          <p className="text-sm text-red-100">删除后无法恢复，确认删除这条记录？</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="flex-1 rounded-lg bg-white/10 py-2 text-sm text-slate-200"
            >
              取消
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="flex-1 rounded-lg bg-red-500/25 py-2 text-sm font-medium text-red-100"
            >
              确认删除
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="w-full rounded-lg bg-red-500/10 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/20"
        >
          删除这条记录
        </button>
      )}
    </section>
  );
}
