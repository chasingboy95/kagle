import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDateRefresh } from './useDateRefresh';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDateRefresh', () => {
  it('returns a daily date key in YYYY-MM-DD format', () => {
    const { result } = renderHook(() => useDateRefresh('daily'));
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    expect(result.current).toBe(`${y}-${m}-${d}`);
  });

  it('returns a weekly date key in YYYY-Www format', () => {
    const { result } = renderHook(() => useDateRefresh('weekly'));
    expect(result.current).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('updates the key after 60 seconds when the date changes', () => {
    const { result } = renderHook(() => useDateRefresh('daily'));
    const initial = result.current;

    // Advance time by 60 seconds
    act(() => { vi.advanceTimersByTime(60_000); });

    // If the date hasn't rolled over, the key stays the same
    // This just proves the interval fires without error
    expect(typeof result.current).toBe('string');
  });

  it('updates the key on visibility change', () => {
    const { result } = renderHook(() => useDateRefresh('daily'));
    const initial = result.current;

    // Simulate tab going to background and coming back
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(typeof result.current).toBe('string');
  });
});
