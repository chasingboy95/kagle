import { useCallback, useState } from 'react';
import { defaultStorage } from '../utils/storage';
import {
  DEFAULT_TRAINING_SCHEDULE,
  TRAINING_SCHEDULE_SCHEMA,
  type TrainingScheduleSettings,
} from '../utils/appStorageSchemas';
import { useInterval } from './useInterval';

/** Day-of-week labels in Chinese, indexed 0=Monday … 6=Sunday. */
export const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;

/** Check if today (in local timezone) matches a scheduled day. */
export function isScheduledToday(
  daysOfWeek: number[],
  now: Date = new Date(),
): boolean {
  if (daysOfWeek.length === 0) return false;
  const localDay = (now.getDay() + 6) % 7; // Monday=0
  return daysOfWeek.includes(localDay);
}

/** Check if the current time is within the reminder window (±5 min). */
export function isReminderTime(
  hour: number,
  minute: number,
  now: Date = new Date(),
): boolean {
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const reminderTotal = hour * 60 + minute;
  return Math.abs(totalMinutes - reminderTotal) <= 5;
}

/** Get today's ISO date key in local timezone. */
export function todayDateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface UseTrainingScheduleReturn {
  settings: TrainingScheduleSettings;
  showReminder: boolean;
  toggleEnabled: () => void;
  setDaysOfWeek: (days: number[]) => void;
  setReminderTime: (hour: number, minute: number) => void;
  reset: () => void;
  markReminded: () => void;
  dismissReminderNotification: () => void;
}

export function useTrainingSchedule(): UseTrainingScheduleReturn {
  const [settings, setSettings] = useState<TrainingScheduleSettings>(
    () => defaultStorage.read(TRAINING_SCHEDULE_SCHEMA),
  );

  const showReminder = (() => {
    if (!settings.enabled || settings.daysOfWeek.length === 0) return false;
    const now = new Date();
    if (!isScheduledToday(settings.daysOfWeek, now)) return false;
    if (!isReminderTime(settings.reminderHour, settings.reminderMinute, now)) return false;
    const todayKey = todayDateKey(now);
    return settings.lastRemindedDateKey !== todayKey;
  })();

  const save = useCallback((next: TrainingScheduleSettings) => {
    setSettings(next);
    defaultStorage.write(TRAINING_SCHEDULE_SCHEMA, next);
  }, []);

  const toggleEnabled = useCallback(() => {
    if (!settings.enabled) {
      if ('Notification' in window && Notification.permission === 'default') {
        void Notification.requestPermission();
      }
    }
    save({ ...settings, enabled: !settings.enabled, lastRemindedDateKey: '' });
  }, [settings, save]);

  const setDaysOfWeek = useCallback(
    (days: number[]) => {
      save({ ...settings, daysOfWeek: [...new Set(days)].sort() });
    },
    [settings, save],
  );

  const setReminderTime = useCallback(
    (hour: number, minute: number) => {
      save({ ...settings, reminderHour: hour, reminderMinute: minute, lastRemindedDateKey: '' });
    },
    [settings, save],
  );

  const reset = useCallback(() => {
    save(DEFAULT_TRAINING_SCHEDULE);
  }, [save]);

  const sendBrowserNotification = useCallback(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification('盆底肌训练', {
          body: '今天是训练日，开始一组训练吧！',
          icon: '/kagle/pwa-192x192.png',
        });
      } catch {
        // Notification may fail in some environments
      }
    }
  }, []);

  const markReminded = useCallback(() => {
    save({ ...settings, lastRemindedDateKey: todayDateKey() });
    sendBrowserNotification();
  }, [settings, save, sendBrowserNotification]);

  const dismissReminderNotification = useCallback(() => {
    save({ ...settings, lastRemindedDateKey: todayDateKey() });
  }, [settings, save]);

  useInterval(() => {
    if (!settings.enabled) return;
    const now = new Date();
    if (
      isScheduledToday(settings.daysOfWeek, now) &&
      isReminderTime(settings.reminderHour, settings.reminderMinute, now) &&
      settings.lastRemindedDateKey !== todayDateKey(now)
    ) {
      markReminded();
    }
  }, settings.enabled ? 60_000 : null);

  return {
    settings,
    showReminder,
    toggleEnabled,
    setDaysOfWeek,
    setReminderTime,
    reset,
    markReminded,
    dismissReminderNotification,
  };
}
