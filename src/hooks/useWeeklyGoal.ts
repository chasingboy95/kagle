import { useMemo, useState } from 'react';
import type { TrainingRecord } from '../types/training';
import {
  DEFAULT_WEEKLY_GOAL,
  WEEKLY_GOAL_SCHEMA,
  type WeeklyGoalSettings,
} from '../utils/appStorageSchemas';
import { defaultStorage } from '../utils/storage';
import { useStorageWrite } from './useStorageWrite';
import { useDateRefresh } from './useDateRefresh';
import { weeklyGoalProgress } from '../utils/weeklyGoal';

export function useWeeklyGoal(
  records: TrainingRecord[],
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  const { storageError, dismissStorageError, write } = useStorageWrite();
  const dateKey = useDateRefresh('weekly');
  const [settings, setSettings] = useState<WeeklyGoalSettings>(
    () => defaultStorage.read(WEEKLY_GOAL_SCHEMA),
  );
  const progress = useMemo(
    () => weeklyGoalProgress(records, settings.targetDays, new Date(), timeZone),
    [records, settings.targetDays, timeZone, dateKey],
  );

  const save = (next: WeeklyGoalSettings) => {
    const validated = WEEKLY_GOAL_SCHEMA.validate(next);
    setSettings(validated);
    write(WEEKLY_GOAL_SCHEMA, validated);
  };

  return {
    storageError,
    dismissStorageError,
    settings,
    progress,
    setTargetDays: (targetDays: number) => save({ enabled: true, targetDays }),
    disable: () => save({ ...settings, enabled: false }),
    reset: () => save(DEFAULT_WEEKLY_GOAL),
  };
}
