import { useState, useRef, useCallback, useEffect } from 'react';
import type { TrainingConfig, TrainingStatus, TrainingPhase, EngineState } from '../types/training';
import { DEFAULT_CONFIG } from '../types/training';
import { calcTotalDuration } from '../utils/time';

export interface UseKegelEngineReturn {
  state: EngineState;
  config: TrainingConfig;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  restart: () => void;
  updateConfig: (updates: Partial<TrainingConfig>) => void;
}

interface EngineInternals {
  status: TrainingStatus;
  phase: TrainingPhase;
  round: number;
  phaseStartedAt: number;
  sessionStartedAt: number;
  totalPausedMs: number;
  pauseStartedAt: number;
  config: TrainingConfig;
}

function createInitialEngine(config: TrainingConfig): EngineInternals {
  return {
    status: 'idle',
    phase: 'idle',
    round: 0,
    phaseStartedAt: 0,
    sessionStartedAt: 0,
    totalPausedMs: 0,
    pauseStartedAt: 0,
    config,
  };
}

function phaseMs(phase: TrainingPhase, config: TrainingConfig): number {
  switch (phase) {
    case 'contract': return config.contractTime * 1000;
    case 'hold': return config.holdTime * 1000;
    case 'relax': return config.relaxTime * 1000;
    default: return 0;
  }
}


/** 从当前引擎快照构建渲染状态 */
function buildState(e: EngineInternals, now: number): EngineState {
  const isPaused = e.status === 'paused';
  const phaseDur = phaseMs(e.phase, e.config);

  let phaseRemaining = 0;
  let totalRunningMs = 0;

  if (e.status === 'idle' || e.status === 'finished') {
    phaseRemaining = 0;
    totalRunningMs = 0;
  } else if (isPaused) {
    const pausedDuration = now - e.pauseStartedAt;
    phaseRemaining = Math.max(0, phaseDur - (e.pauseStartedAt - e.phaseStartedAt) + pausedDuration);
    totalRunningMs = Math.max(0, now - e.sessionStartedAt - e.totalPausedMs + pausedDuration);
  } else {
    const elapsed = now - e.phaseStartedAt;
    phaseRemaining = Math.max(0, phaseDur - elapsed);
    totalRunningMs = Math.max(0, now - e.sessionStartedAt - e.totalPausedMs);
  }

  return {
    status: e.status,
    phase: e.phase,
    currentRound: e.round + 1,
    phaseRemainingMs: Math.ceil(phaseRemaining),
    totalElapsedMs: Math.ceil(totalRunningMs),
    totalDurationMs: calcTotalDuration(
      e.config.contractTime,
      e.config.holdTime,
      e.config.relaxTime,
      e.config.rounds,
    ),
  };
}

export function useKegelEngine(): UseKegelEngineReturn {
  const [config, setConfig] = useState<TrainingConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<EngineState>(() => ({
    status: 'idle',
    phase: 'idle',
    currentRound: 0,
    phaseRemainingMs: 0,
    totalElapsedMs: 0,
    totalDurationMs: calcTotalDuration(
      DEFAULT_CONFIG.contractTime,
      DEFAULT_CONFIG.holdTime,
      DEFAULT_CONFIG.relaxTime,
      DEFAULT_CONFIG.rounds,
    ),
  }));

  const eng = useRef<EngineInternals>(createInitialEngine(DEFAULT_CONFIG));
  const tickId = useRef<ReturnType<typeof setInterval> | null>(null);

  /** 推送到渲染层 (节流到 100ms) */
  const pushState = useCallback(() => {
    const now = performance.now();
    const e = eng.current;
    const s = buildState(e, now);
    setState(s);
  }, []);

  /** 推进到下一阶段 */
  const advance = useCallback(() => {
    const e = eng.current;
    const cfg = e.config;

    if (e.phase === 'contract') {
      e.phase = 'hold';
      e.phaseStartedAt = performance.now();
      return;
    }
    if (e.phase === 'hold') {
      e.phase = 'relax';
      e.phaseStartedAt = performance.now();
      return;
    }
    if (e.phase === 'relax') {
      const nextRound = e.round + 1;
      if (nextRound >= cfg.rounds) {
        e.status = 'finished';
        e.phase = 'idle';
        e.round = 0;
        e.phaseStartedAt = 0;
        e.sessionStartedAt = 0;
        e.totalPausedMs = 0;
        stopTick();
        pushState();
        return;
      }
      e.round = nextRound;
      e.phase = 'contract';
      e.phaseStartedAt = performance.now();
    }
  }, [pushState]);

  const stopTick = useCallback(() => {
    if (tickId.current !== null) {
      clearInterval(tickId.current);
      tickId.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    stopTick();
    tickId.current = setInterval(() => {
      const e = eng.current;
      if (e.status !== 'running') return;

      const now = performance.now();
      const elapsed = now - e.phaseStartedAt;
      const dur = phaseMs(e.phase, e.config);

      if (elapsed >= dur) {
        advance();
      }
      pushState();
    }, 100);
  }, [advance, pushState]);

 // 清理 tick
 useEffect(() => {
   return () => stopTick();
 }, [stopTick]);

  /* ── Screen Wake Lock ──────────────────────────────────────── */
  // 训练时阻止手机自动熄屏
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
 
    async function acquire() {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } catch {
        /* API 不支持或权限不足 —— 静默忽略 */
      }
    }
 
    async function release() {
      if (wakeLock) {
        try { await wakeLock.release(); } catch { /* ignore */ }
        wakeLock = null;
      }
    }
 
    if (state.status === 'running') {
      acquire();
    } else {
      release();
    }
 
    return () => { release(); };
  }, [state.status]);

 const start = useCallback(() => {
   const e = eng.current;
   e.status = 'running';
    e.phase = 'contract';
    e.round = 0;
    e.phaseStartedAt = performance.now();
    e.sessionStartedAt = performance.now();
    e.totalPausedMs = 0;
    e.config = config;
    e.pauseStartedAt = 0;
    startTick();
    pushState();
  }, [config, startTick, pushState]);

  const pause = useCallback(() => {
    const e = eng.current;
    if (e.status !== 'running') return;
    e.status = 'paused';
    e.pauseStartedAt = performance.now();
    pushState();
  }, [pushState]);

  const resume = useCallback(() => {
    const e = eng.current;
    if (e.status !== 'paused') return;
    // 修正阶段开始时间以补偿暂停时长
    const pauseDuration = performance.now() - e.pauseStartedAt;
    e.phaseStartedAt += pauseDuration;
    e.totalPausedMs += pauseDuration;
    e.status = 'running';
    e.pauseStartedAt = 0;
    pushState();
  }, [pushState]);

  const stop = useCallback(() => {
    const e = eng.current;
    stopTick();
    Object.assign(e, createInitialEngine(e.config));
    setState(prev => ({
      ...prev,
      status: 'idle',
      phase: 'idle',
      currentRound: 0,
      phaseRemainingMs: 0,
      totalElapsedMs: 0,
    }));
  }, [stopTick]);

  const restart = useCallback(() => {
    stopTick();
    const e = eng.current;
    e.status = 'running';
    e.phase = 'contract';
    e.round = 0;
    e.phaseStartedAt = performance.now();
    e.sessionStartedAt = performance.now();
    e.totalPausedMs = 0;
    e.pauseStartedAt = 0;
    startTick();
    pushState();
  }, [startTick, pushState]);

  const updateConfig = useCallback((updates: Partial<TrainingConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      eng.current.config = next;
      return next;
    });
  }, []);

  return {
    state,
    config,
    start,
    pause,
    resume,
    stop,
    restart,
    updateConfig,
  };
}
