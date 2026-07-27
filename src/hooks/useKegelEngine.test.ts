import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCountdownEvent, useKegelEngine } from './useKegelEngine';

describe('useKegelEngine lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function advance(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  it('runs the complete ready → contract → hold → relax → feedback lifecycle', () => {
    const { result } = renderHook(() => useKegelEngine());

    act(() => {
      result.current.updateConfig({
        contractTime: 1,
        holdTime: 1,
        relaxTime: 1,
        rounds: 2,
      });
    });
    act(() => {
      result.current.start();
    });
    expect(result.current.state).toMatchObject({ status: 'running', phase: 'ready' });

    advance(5_000);
    expect(result.current.state).toMatchObject({ phase: 'contract', currentRound: 1 });
    advance(1_100);
    expect(result.current.state.phase).toBe('hold');
    advance(1_100);
    expect(result.current.state.phase).toBe('relax');
    advance(1_100);
    expect(result.current.state).toMatchObject({ phase: 'contract', currentRound: 2 });
    advance(3_300);
    expect(result.current.state).toMatchObject({
      status: 'feedback',
      phase: 'feedback',
      currentRound: 2,
    });

    act(() => result.current.finish());
    expect(result.current.state).toMatchObject({
      status: 'idle',
      phase: 'idle',
      currentRound: 0,
    });
  });

  
  it('keeps the feedback phase persistent without auto-advancing to finished', () => {
    const onSessionEnd = vi.fn();
    const { result } = renderHook(() =>
      useKegelEngine({ countdownFrom: 0, onSessionEnd }),
    );

    act(() => {
      result.current.updateConfig({
        contractTime: 1,
        holdTime: 1,
        relaxTime: 1,
        rounds: 1,
      });
    });
    act(() => {
      result.current.start();
    });

    // ready → contract → hold → relax → feedback
    advance(5_000); // ready
    advance(1_100); // contract
    advance(1_100); // hold
    advance(1_100); // relax → feedback

    expect(result.current.state).toMatchObject({
      status: 'feedback',
      phase: 'feedback',
    });
    expect(onSessionEnd).toHaveBeenCalledOnce();
    expect(onSessionEnd).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed', completedReps: 1 }),
    );

    // Wait well past the 6s feedback duration — should NOT auto-advance
    advance(10_000);
    expect(result.current.state).toMatchObject({
      status: 'feedback',
      phase: 'feedback',
    });
    expect(onSessionEnd).toHaveBeenCalledOnce(); // still only once

    // User explicitly finishes
    act(() => result.current.finish());
    expect(result.current.state).toMatchObject({
      status: 'idle',
      phase: 'idle',
      currentRound: 0,
    });
    expect(onSessionEnd).toHaveBeenCalledOnce();
  });

  it('preserves the phase while paused and resumes from the remaining time', () => {
    const { result } = renderHook(() => useKegelEngine());

    act(() => {
      result.current.updateConfig({ contractTime: 1, holdTime: 1, relaxTime: 1, rounds: 1 });
    });
    act(() => {
      result.current.start();
    });
    advance(5_500);
    expect(result.current.state.phase).toBe('contract');

    act(() => result.current.pause());
    const remaining = result.current.state.phaseRemainingMs;
    advance(2_000);
    expect(result.current.state).toMatchObject({
      status: 'paused',
      phase: 'contract',
      phaseRemainingMs: remaining,
    });

    act(() => result.current.resume());
    advance(remaining + 100);
    expect(result.current.state).toMatchObject({ status: 'running', phase: 'hold' });
  });

  it('stops an active session early and resets to idle', () => {
    const { result } = renderHook(() => useKegelEngine());

    act(() => result.current.start());
    advance(5_000);
    act(() => result.current.stop());

    expect(result.current.state).toMatchObject({
      status: 'idle',
      phase: 'idle',
      currentRound: 0,
      totalElapsedMs: 0,
    });
  });
});

describe('getCountdownEvent', () => {
  it('emits only unannounced positive seconds inside the threshold', () => {
    expect(getCountdownEvent(3000, 'hold', 3, new Set())).toEqual({
      type: 'countdown',
      stage: 'hold',
      seconds: 3,
    });
    expect(getCountdownEvent(2990, 'hold', 3, new Set([3]))).toBeNull();
    expect(getCountdownEvent(0, 'hold', 3, new Set())).toBeNull();
    expect(getCountdownEvent(3000, 'hold', 0, new Set())).toBeNull();
  });

  it('counts down during ready phase', () => {
    expect(getCountdownEvent(5000, 'ready', 5, new Set())).toEqual({
      type: 'countdown',
      stage: 'ready',
      seconds: 5,
    });
    expect(getCountdownEvent(4000, 'ready', 5, new Set([5]))).toEqual({
      type: 'countdown',
      stage: 'ready',
      seconds: 4,
    });
    expect(getCountdownEvent(500, 'ready', 5, new Set([5, 4, 3, 2]))).toEqual({
      type: 'countdown',
      stage: 'ready',
      seconds: 1,
    });
  });

  it('does not count down during idle', () => {
    expect(getCountdownEvent(3000, 'idle', 3, new Set())).toBeNull();
  });

  it('does not count down during feedback', () => {
    expect(getCountdownEvent(4000, 'feedback', 5, new Set())).toBeNull();
    expect(getCountdownEvent(6000, 'feedback', 0, new Set())).toBeNull();
  });
});

describe('useKegelEngine session recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  function advance(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  it('saves snapshot to storage when training is running', () => {
    const { result } = renderHook(() => useKegelEngine());

    act(() => {
      result.current.updateConfig({ contractTime: 1, holdTime: 1, relaxTime: 1, rounds: 1 });
    });
    act(() => {
      result.current.start();
    });

    advance(5_100);

    const raw = localStorage.getItem('kegel.session-snapshot.v1');
    expect(raw).not.toBeNull();
    const snap = JSON.parse(raw!);
    expect(snap.status).toBe('running');
    expect(snap.phase).toBe('contract');
    expect(snap.round).toBe(0);
  });

  it('saves snapshot when paused', () => {
    const { result } = renderHook(() => useKegelEngine());

    act(() => {
      result.current.updateConfig({ contractTime: 1, holdTime: 1, relaxTime: 1, rounds: 1 });
    });
    act(() => {
      result.current.start();
    });
    advance(5_100);

    act(() => result.current.pause());

    const raw = localStorage.getItem('kegel.session-snapshot.v1');
    expect(raw).not.toBeNull();
    const snap = JSON.parse(raw!);
    expect(snap.status).toBe('paused');
  });

  it('clears snapshot when stopped', () => {
    const { result } = renderHook(() => useKegelEngine());

    act(() => {
      result.current.updateConfig({ contractTime: 1, holdTime: 1, relaxTime: 1, rounds: 1 });
    });
    act(() => {
      result.current.start();
    });
    advance(5_100);

    act(() => result.current.stop());

    expect(localStorage.getItem('kegel.session-snapshot.v1')).toBeNull();
  });

  it('clears snapshot when finished', () => {
    const { result } = renderHook(() => useKegelEngine());

    act(() => {
      result.current.updateConfig({ contractTime: 1, holdTime: 1, relaxTime: 1, rounds: 1 });
    });
    act(() => {
      result.current.start();
    });
    advance(5_000); // ready
    advance(1_100); // contract → hold
    advance(1_100); // hold → relax
    advance(1_100); // relax → feedback
    advance(100);   // some feedback progress

    expect(result.current.state.status).toBe('feedback');
    act(() => result.current.finish());

    expect(localStorage.getItem('kegel.session-snapshot.v1')).toBeNull();
  });

  it('detects existing snapshot and exposes recoverableSession', () => {
    const snap = {
      status: 'running',
      phase: 'contract',
      round: 2,
      phaseElapsedMs: 500,
      sessionElapsedMs: 15_000,
      totalPausedMs: 0,
      config: { contractTime: 1, holdTime: 1, relaxTime: 1, rounds: 5 },
      announcedCountdowns: [3, 2, 1],
      sessionStartedAtIso: new Date().toISOString(),
    };
    localStorage.setItem('kegel.session-snapshot.v1', JSON.stringify(snap));

    const { result } = renderHook(() => useKegelEngine());

    expect(result.current.recoverableSession).not.toBeNull();
    expect(result.current.recoverableSession?.phase).toBe('contract');
    expect(result.current.recoverableSession?.round).toBe(2);
  });

  it('discardSession clears the snapshot and the state', () => {
    const snap = {
      status: 'running',
      phase: 'contract',
      round: 0,
      phaseElapsedMs: 500,
      sessionElapsedMs: 5_000,
      totalPausedMs: 0,
      config: { contractTime: 1, holdTime: 1, relaxTime: 1, rounds: 3 },
      announcedCountdowns: [],
      sessionStartedAtIso: new Date().toISOString(),
    };
    localStorage.setItem('kegel.session-snapshot.v1', JSON.stringify(snap));

    const { result } = renderHook(() => useKegelEngine());
    expect(result.current.recoverableSession).not.toBeNull();

    act(() => result.current.discardSession());

    expect(result.current.recoverableSession).toBeNull();
    expect(localStorage.getItem('kegel.session-snapshot.v1')).toBeNull();
  });

  it('recovers a running session and continues from where it left off', () => {
    const snap = {
      status: 'running',
      phase: 'contract',
      round: 2,
      phaseElapsedMs: 500,
      sessionElapsedMs: 15_000,
      totalPausedMs: 0,
      config: { contractTime: 1, holdTime: 1, relaxTime: 1, rounds: 5 },
      announcedCountdowns: [],
      sessionStartedAtIso: new Date().toISOString(),
    };
    localStorage.setItem('kegel.session-snapshot.v1', JSON.stringify(snap));

    const { result } = renderHook(() => useKegelEngine());
    expect(result.current.recoverableSession).not.toBeNull();

    act(() => result.current.recoverSession());

    expect(result.current.state.status).toBe('running');
    expect(result.current.state.phase).toBe('contract');
    expect(result.current.state.currentRound).toBe(3);
    expect(result.current.state.phaseRemainingMs).toBeGreaterThan(0);
    expect(result.current.state.phaseRemainingMs).toBeLessThanOrEqual(600);
  });

  it('recovers a paused session in paused state', () => {
    const snap = {
      status: 'paused',
      phase: 'hold',
      round: 1,
      phaseElapsedMs: 300,
      sessionElapsedMs: 7_000,
      totalPausedMs: 0,
      config: { contractTime: 1, holdTime: 1, relaxTime: 1, rounds: 3 },
      announcedCountdowns: [],
      sessionStartedAtIso: new Date().toISOString(),
    };
    localStorage.setItem('kegel.session-snapshot.v1', JSON.stringify(snap));

    const { result } = renderHook(() => useKegelEngine());

    act(() => result.current.recoverSession());

    // Should be paused right after recovery
    expect(result.current.state.status).toBe('paused');
    expect(result.current.state.phase).toBe('hold');
  });
});
