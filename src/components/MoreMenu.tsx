import { useEffect, useRef } from 'react';
import DataManagement from './DataManagement';
import ScheduleSettings from './ScheduleSettings';
import type { TrainingScheduleSettings } from '../utils/appStorageSchemas';

interface Props {
  onShowOnboarding: () => void;
  onClose: () => void;
  scheduleSettings?: TrainingScheduleSettings;
  onScheduleToggleEnabled?: () => void;
  onScheduleSetDaysOfWeek?: (days: number[]) => void;
  onScheduleSetReminderTime?: (hour: number, minute: number) => void;
}

export default function MoreMenu({
  onShowOnboarding,
  onClose,
  scheduleSettings,
  onScheduleToggleEnabled,
  onScheduleSetDaysOfWeek,
  onScheduleSetReminderTime,
}: Props) {
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
        aria-label="更多"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-2xl border-t border-warm-200/[0.06] bg-warm-900 p-5 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-warm-200">更多</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-warm-200/5 px-3 py-1.5 text-xs text-warm-400 hover:bg-warm-200/10"
          >
            关闭
          </button>
        </div>
        <div className="space-y-3">
          {scheduleSettings && (
            <ScheduleSettings
              settings={scheduleSettings}
              onToggleEnabled={onScheduleToggleEnabled ?? (() => {})}
              onSetDaysOfWeek={onScheduleSetDaysOfWeek ?? (() => {})}
              onSetReminderTime={onScheduleSetReminderTime ?? (() => {})}
            />
          )}
          <button
            type="button"
            onClick={() => { onShowOnboarding(); onClose(); }}
            className="w-full rounded-lg bg-warm-200/5 py-2.5 text-sm font-medium text-warm-400 hover:bg-warm-200/10 transition-colors"
          >
            重新查看引导
          </button>
          <DataManagement />
        </div>
      </div>
    </div>
  );
}
