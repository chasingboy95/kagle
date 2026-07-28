import { useMemo, useState } from 'react';
import type { TrainingRecord } from '../types/training';
import {
  DEFAULT_WEEKLY_GOAL,
  WEEKLY_GOAL_SCHEMA,
  type WeeklyGoalSettings,
} from '../utils/appStorageSchemas';
import { defaultStorage } from '../utils/storage';
import { weeklyGoalProgress } from '../utils/weeklyGoal';

export function useWeeklyGoal(
  records: TrainingRecord[],
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  const [settings, setSettings] = useState<WeeklyGoalSettings>(
    () => defaultStorage.read(WEEKLY_GOAL_SCHEMA),
  );
  const progress = useMemo(
    () => weeklyGoalProgress(records, settings.targetDays, new Date(), timeZone),
    [records, settings.targetDays, timeZone],
  );

  const save = (next: WeeklyGoalSettings) => {
    const validated = WEEKLY_GOAL_SCHEMA.validate(next);
    setSettings(validated);
    defaultStorage.write(WEEKLY_GOAL_SCHEMA, validated);
  };

  return {
    settings,
    progress,
    setTargetDays: (targetDays: number) => save({ enabled: true, targetDays }),
    disable: () => save({ ...settings, enabled: false }),
    reset: () => save(DEFAULT_WEEKLY_GOAL),
  };
}
