import { act, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG, type TrainingConfig } from '../types/training';
import type { SessionResult } from '../utils/sessionResult';
import { buildTrainingRecord, useTrainingHistory } from './useTrainingHistory';
import { useKegelEngine } from './useKegelEngine';

const SNAPSHOT_KEY = 'kegel.session-snapshot.v1';

const RECOVERED_CONFIG: TrainingConfig = {
  contractTime: 5,
  holdTime: 8,
  relaxTime: 5,
  rounds: 3,
};

function seedSnapshot(config: TrainingConfig) {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
    status: 'running',
    phase: 'contract',
    round: 0,
    phaseElapsedMs: 0,
    sessionElapsedMs: 0,
    totalPausedMs: 0,
    config,
    announcedCountdowns: [],
    sessionStartedAtIso: new Date().toISOString(),
  }));
}

describe('recovery uses snapshot config as the authoritative source (#61)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  function advance(ms: number) {
    act(() => { vi.advanceTimersByTime(ms); });
  }

  it('runs the recovered session with the snapshot config and records it as the actual config', () => {
    seedSnapshot(RECOVERED_CONFIG);
    const { result } = renderHook(() => {
      const endedRef = useRef<SessionResult[]>([]);
      const history = useTrainingHistory();
      const engine = useKegelEngine({
        onSessionEnd: (data) => {
          endedRef.current.push(data);
          history.addRecord(buildTrainingRecord(
            data.config,
            data.completedReps,
            data.actualDurationMs,
            data.status,
            data.startedAt,
          ));
        },
      });
      return { history, engine, endedRef };
    });

    // 恢复前 UI/引擎配置为持久化默认值。
    expect(result.current.engine.config).toEqual(DEFAULT_CONFIG);

    act(() => result.current.engine.recoverSession());

    // 恢复后 UI 与引擎配置统一切换为快照配置。
    expect(result.current.engine.config).toEqual(RECOVERED_CONFIG);
    expect(result.current.engine.state.status).toBe('running');

    advance(70_000);

    expect(result.current.endedRef.current).toHaveLength(1);
    expect(result.current.endedRef.current[0].config).toEqual(RECOVERED_CONFIG);
    expect(result.current.history.records).toHaveLength(1);
    expect(result.current.history.records[0]).toMatchObject({
      targetReps: RECOVERED_CONFIG.rounds,
      contractSec: RECOVERED_CONFIG.contractTime,
      holdSec: RECOVERED_CONFIG.holdTime,
      relaxSec: RECOVERED_CONFIG.relaxTime,
      completedReps: RECOVERED_CONFIG.rounds,
      status: 'completed',
    });
  });

  it('keeps UI, engine, and history consistent when snapshot config differs from saved config', () => {
    localStorage.setItem('kegel.training-config.v1', JSON.stringify({
      contractTime: 3,
      holdTime: 3,
      relaxTime: 3,
      rounds: 10,
    }));
    seedSnapshot(RECOVERED_CONFIG);

    const { result } = renderHook(() => useKegelEngine());

    expect(result.current.config).toMatchObject({ rounds: 10 });
    act(() => result.current.recoverSession());
    expect(result.current.config).toEqual(RECOVERED_CONFIG);
    expect(result.current.state.status).toBe('running');
  });

  it('safely degrades a corrupt snapshot and exposes no recoverable session', () => {
    localStorage.setItem(SNAPSHOT_KEY, 'not-json');

    const { result } = renderHook(() => useKegelEngine());

    expect(result.current.recoverableSession).toBeNull();
  });
});
