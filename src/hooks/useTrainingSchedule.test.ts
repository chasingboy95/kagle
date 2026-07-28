import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isScheduledToday,
  isReminderTime,
  todayDateKey,
  useTrainingSchedule,
} from './useTrainingSchedule';

describe('isScheduledToday', () => {
  it('returns true when today is in the schedule', () => {
    // Set system time to a Wednesday
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-29T12:00:00.000Z'));
    const now = new Date();
    // Wednesday in local time
    expect(isScheduledToday([0, 2, 4], now)).toBe(true);
    vi.useRealTimers();
  });

  it('returns false when today is not in the schedule', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-29T12:00:00.000Z'));
    const now = new Date();
    expect(isScheduledToday([0, 4], now)).toBe(false);
    vi.useRealTimers();
  });

  it('returns false for empty schedule', () => {
    expect(isScheduledToday([])).toBe(false);
  });
});

describe('isReminderTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true within 5-minute window', () => {
    // Set current time to 20:02
    vi.setSystemTime(new Date('2026-07-29T12:02:00.000Z'));
    const now = new Date();
    const localHour = now.getHours();
    const localMinute = now.getMinutes();
    expect(isReminderTime(localHour, localMinute - 2, now)).toBe(true);
  });

  it('returns false outside 5-minute window', () => {
    vi.setSystemTime(new Date('2026-07-29T12:10:00.000Z'));
    const now = new Date();
    const localHour = now.getHours();
    const localMinute = now.getMinutes();
    expect(isReminderTime(localHour, localMinute - 10, now)).toBe(false);
  });
});

describe('todayDateKey', () => {
  it('returns YYYY-MM-DD in local timezone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-29T12:00:00.000Z'));
    const key = todayDateKey(new Date());
    expect(key).toBe('2026-07-29');
    vi.useRealTimers();
  });
});

describe('useTrainingSchedule', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads default settings', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-29T12:00:00.000Z'));
    const { result } = renderHook(() => useTrainingSchedule());
    expect(result.current.settings.enabled).toBe(false);
    expect(result.current.settings.daysOfWeek).toEqual([0, 2, 4]);
    expect(result.current.showReminder).toBe(false);
  });

  it('toggles enabled and stores to localStorage', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-29T12:00:00.000Z'));
    const { result } = renderHook(() => useTrainingSchedule());
    act(() => result.current.toggleEnabled());
    expect(result.current.settings.enabled).toBe(true);
    const stored = JSON.parse(
      localStorage.getItem('kegel.training-schedule.v1') ?? '{}',
    );
    expect(stored.enabled).toBe(true);
  });

  it('updates days of week', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-29T12:00:00.000Z'));
    const { result } = renderHook(() => useTrainingSchedule());
    act(() => result.current.toggleEnabled());
    act(() => result.current.setDaysOfWeek([0, 4]));
    expect(result.current.settings.daysOfWeek).toEqual([0, 4]);
  });

  it('updates reminder time', () => {
    const { result } = renderHook(() => useTrainingSchedule());
    act(() => result.current.setReminderTime(8, 30));
    expect(result.current.settings.reminderHour).toBe(8);
    expect(result.current.settings.reminderMinute).toBe(30);
  });

  it('shows reminder when conditions are met', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-29T12:00:00.000Z'));
    const { result } = renderHook(() => useTrainingSchedule());
    act(() => result.current.toggleEnabled());
    const now = new Date();
    // Set reminder to current time
    act(() => result.current.setReminderTime(now.getHours(), now.getMinutes()));
    expect(result.current.showReminder).toBe(true);
  });

  it('does not show reminder twice on same day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-29T12:00:00.000Z'));
    const { result } = renderHook(() => useTrainingSchedule());
    act(() => result.current.toggleEnabled());
    const now = new Date();
    act(() => result.current.setReminderTime(now.getHours(), now.getMinutes()));
    expect(result.current.showReminder).toBe(true);
    act(() => result.current.dismissReminderNotification());
    expect(result.current.settings.lastRemindedDateKey).toBe('2026-07-29');
    expect(result.current.showReminder).toBe(false);
  });

  it('resets to defaults', () => {
    const { result } = renderHook(() => useTrainingSchedule());
    act(() => result.current.toggleEnabled());
    act(() => result.current.setDaysOfWeek([0]));
    act(() => result.current.reset());
    expect(result.current.settings).toMatchObject({
      enabled: false,
      daysOfWeek: [0, 2, 4],
    });
  });
});
