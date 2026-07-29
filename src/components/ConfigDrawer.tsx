import { useCallback, useRef, useState } from 'react';
import ConfigPanel from './ConfigPanel';
import DiscardChangesDialog from './DiscardChangesDialog';
import { useModalFocus } from '../hooks/useModalFocus';
import type { TrainingConfig } from '../types/training';
import type { SavedTrainingConfig } from '../utils/appStorageSchemas';

interface Props {
  config: TrainingConfig;
  savedConfigs: SavedTrainingConfig[];
  onChange: (config: TrainingConfig) => void;
  onSaveConfig: (name: string, config: TrainingConfig) => boolean;
  onRenameConfig: (id: string, name: string) => boolean;
  onDeleteConfig: (id: string) => void;
  onClose: () => void;
}

export default function ConfigDrawer({ config, savedConfigs, onChange, onSaveConfig, onRenameConfig, onDeleteConfig, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<TrainingConfig>(() => ({ ...config }));
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(config);

  const requestClose = useCallback(() => {
    if (dirty) setConfirmingDiscard(true);
    else onClose();
  }, [dirty, onClose]);

  useModalFocus(ref, requestClose);

  const apply = () => {
    onChange(draft);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={requestClose}>
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label="调整训练计划"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border-t border-white/[0.06] bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-200">调整训练计划</h2>
            <button
              type="button"
              onClick={requestClose}
              className="min-h-11 min-w-11 rounded-lg bg-white/5 px-3 text-xs text-slate-400 hover:bg-white/10"
            >
              关闭
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <ConfigPanel
              config={draft}
              disabled={false}
              embedded
              onChange={(updates) => setDraft((current) => ({ ...current, ...updates }))}
              savedConfigs={savedConfigs}
              onSaveConfig={onSaveConfig}
              onRenameConfig={onRenameConfig}
              onDeleteConfig={onDeleteConfig}
            />
          </div>
          <div className="flex gap-3 border-t border-white/[0.06] bg-slate-900 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <button
              type="button"
              onClick={requestClose}
              className="min-h-11 flex-1 rounded-xl bg-white/10 px-4 text-sm font-medium text-slate-300"
            >
              取消
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!dirty}
              className="min-h-11 flex-[1.4] rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 disabled:opacity-40"
            >
              应用此计划
            </button>
          </div>
        </div>
      </div>
      {confirmingDiscard && (
        <DiscardChangesDialog
          title="放弃训练计划修改？"
          onContinueEditing={() => setConfirmingDiscard(false)}
          onDiscard={onClose}
        />
      )}
    </>
  );
}
