import { useCallback, useMemo, useRef, useState } from 'react';
import VoiceSettingsPanel from './VoiceSettingsPanel';
import { useModalFocus } from '../hooks/useModalFocus';
import type { VoiceSettings } from '../voice/types';

interface Props {
  settings: VoiceSettings;
  supported: boolean;
  hapticsSupported: boolean;
  onApply: (settings: VoiceSettings) => void;
  onPreview: (settings: VoiceSettings) => Promise<boolean>;
  onClose: () => void;
}

export default function VoiceDrawer({ settings, supported, hapticsSupported, onApply, onPreview, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<VoiceSettings>(() => ({ ...settings }));
  const [confirmClose, setConfirmClose] = useState(false);
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings),
    [draft, settings],
  );

  const requestClose = useCallback(() => {
    if (dirty) {
      setConfirmClose(true);
      return;
    }
    onClose();
  }, [dirty, onClose]);

  useModalFocus(ref, requestClose);

  const apply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={requestClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="声音与震动设置"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bottom-sheet flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border-t border-warm-200/[0.06] bg-warm-900"
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-warm-200/20" />
        <div className="flex items-center justify-between border-b border-warm-200/[0.05] px-5 py-3">
          <h2 className="text-sm font-semibold text-warm-200">声音与震动</h2>
          <button
            type="button"
            onClick={requestClose}
            data-autofocus
            aria-label="关闭声音设置"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-warm-200/5 text-lg text-warm-400 hover:bg-warm-200/10"
          >
            ×
          </button>
        </div>

        {confirmClose ? (
          <section className="px-5 py-8 text-center" aria-labelledby="discard-voice-title">
            <h3 id="discard-voice-title" className="text-base font-semibold text-warm-100">放弃未应用的修改？</h3>
            <p className="mt-2 text-sm leading-6 text-warm-400">声音与反馈设置尚未应用，关闭后本次修改不会保留。</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={onClose} className="h-11 rounded-xl bg-rose-500/15 text-sm font-medium text-rose-100 hover:bg-rose-500/25">
                放弃修改
              </button>
              <button type="button" autoFocus onClick={() => setConfirmClose(false)} className="h-11 rounded-xl bg-warm-200/10 text-sm font-medium text-warm-100 hover:bg-warm-200/15">
                继续编辑
              </button>
            </div>
          </section>
        ) : (
          <>
            <div className="overflow-y-auto px-5 py-4">
              <VoiceSettingsPanel
                settings={draft}
                supported={supported}
                hapticsSupported={hapticsSupported}
                onChange={(updates) => setDraft((current) => ({ ...current, ...updates }))}
                onPreview={() => onPreview(draft)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-warm-200/[0.05] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <button type="button" onClick={requestClose} className="h-11 rounded-xl bg-warm-200/[0.06] text-sm font-medium text-warm-200 hover:bg-warm-200/10">
                取消
              </button>
              <button type="button" onClick={apply} className="h-11 rounded-xl bg-accent text-sm font-semibold text-warm-900 hover:bg-accent">
                应用设置
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
