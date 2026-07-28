import { useEffect, useRef } from 'react';
import VoiceSettingsPanel from './VoiceSettingsPanel';
import type { VoiceSettings } from '../voice/types';

interface Props {
  settings: VoiceSettings;
  supported: boolean;
  onChange: (settings: VoiceSettings) => void;
  onPreview: () => void;
  onClose: () => void;
}

export default function VoiceDrawer({ settings, supported, onChange, onPreview, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="声音与震动设置"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-2xl border-t border-white/[0.06] bg-slate-900 p-5 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200">声音与震动</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/10"
          >
            关闭
          </button>
        </div>
        <VoiceSettingsPanel
          settings={settings}
          supported={supported}
          onChange={(updates) => onChange({ ...settings, ...updates })}
          onPreview={() => { onPreview(); return Promise.resolve(true); }}
        />
      </div>
    </div>
  );
}
