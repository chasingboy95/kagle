import { useState } from 'react';
import type { TrainingConfig } from '../types/training';
import {
  MAX_SAVED_CONFIGS,
  type SavedTrainingConfig,
} from '../utils/appStorageSchemas';

interface Props {
  config: TrainingConfig;
  disabled: boolean;
  items: SavedTrainingConfig[];
  onApply: (config: TrainingConfig) => void;
  onSave: (name: string, config: TrainingConfig) => boolean;
  onRename: (id: string, name: string) => boolean;
  onDelete: (id: string) => void;
}

function formatConfig(config: TrainingConfig) {
  return `${config.contractTime}-${config.holdTime}-${config.relaxTime} × ${config.rounds} 次 = 1 组`;
}

export default function SavedConfigs({
  config,
  disabled,
  items,
  onApply,
  onSave,
  onRename,
  onDelete,
}: Props) {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const atLimit = items.length >= MAX_SAVED_CONFIGS;

  const saveCurrent = () => {
    if (onSave(name, config)) setName('');
  };

  const startRename = (item: SavedTrainingConfig) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const finishRename = () => {
    if (!editingId) return;
    if (onRename(editingId, editingName)) {
      setEditingId(null);
      setEditingName('');
    }
  };

  return (
    <section aria-labelledby="saved-configs-title" className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
        <h3 id="saved-configs-title" className="text-xs font-medium tracking-wide text-warm-200">
          我的收藏
        </h3>
        <span className="text-[10px] text-warm-500">{items.length}/{MAX_SAVED_CONFIGS}</span>
      </div>

      <div className="flex gap-2">
        <label className="sr-only" htmlFor="saved-config-name">收藏名称</label>
        <input
          id="saved-config-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={24}
          disabled={disabled || atLimit}
          placeholder={atLimit ? '收藏已满' : '为当前配置命名'}
          className="min-w-0 flex-1 rounded-lg border border-warm-200/[0.08] bg-warm-200/[0.04] px-2.5 py-1.5 text-xs text-warm-200 placeholder:text-warm-500 disabled:opacity-40"
        />
        <button
          type="button"
          onClick={saveCurrent}
          disabled={disabled || atLimit || name.trim().length === 0}
          className="rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent disabled:opacity-30"
        >
          收藏当前配置
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-[10px] leading-4 text-warm-500">尚未收藏训练配置</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl bg-warm-200/[0.035] p-2">
              {editingId === item.id ? (
                <div className="flex gap-2">
                  <label className="sr-only" htmlFor={`rename-${item.id}`}>重命名收藏</label>
                  <input
                    id={`rename-${item.id}`}
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    maxLength={24}
                    disabled={disabled}
                    className="min-w-0 flex-1 rounded-lg border border-warm-200/[0.08] bg-warm-200/[0.04] px-2 py-1 text-xs text-warm-200"
                  />
                  <button
                    type="button"
                    onClick={finishRename}
                    disabled={disabled || editingName.trim().length === 0}
                    className="text-xs text-accent disabled:opacity-30"
                  >
                    保存名称
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    disabled={disabled}
                    className="text-xs text-warm-400 disabled:opacity-30"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => onApply({ ...item.config })}
                    disabled={disabled}
                    aria-label={`使用收藏 ${item.name}`}
                    className="min-w-0 flex-1 text-left disabled:opacity-30"
                  >
                    <span className="block truncate text-xs font-medium text-warm-200">{item.name}</span>
                    <span className="mt-0.5 block text-[10px] tabular-nums text-warm-400">
                      {formatConfig(item.config)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startRename(item)}
                    disabled={disabled}
                    aria-label={`重命名 ${item.name}`}
                    className="text-xs text-warm-400 disabled:opacity-30"
                  >
                    重命名
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    disabled={disabled}
                    aria-label={`删除收藏 ${item.name}`}
                    className="text-xs text-rose-300/80 disabled:opacity-30"
                  >
                    删除
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
