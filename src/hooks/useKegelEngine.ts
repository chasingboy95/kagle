import { useState, useRef, useCallback, useEffect } from 'react';
import type { TrainingConfig, TrainingStatus, TrainingPhase, EngineState } from '../types/training';
import { DEFAULT_CONFIG } from '../types/training';
import { calcTotalDuration } from '../utils/time';
import type { VoiceEvent } from '../voice/types';
import type { VoiceEventContext } from '../voice/VoiceController';

export interface KegelEngineVoiceOptions {
  onVoiceEvent?: (event: VoiceEvent, context: VoiceEventContext) => void;
  countdownFrom?: 0 | 3 | 5;
}

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
  sessionId: number;
  eventSequence: number;
  announcedCountdowns: Set<number>;
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
    sessionId: 0,
    eventSequence: 0,
    announcedCountdowns: new Set(),
  };
}

export function getCountdownEvent(
  remainingMs: number,
  stage: TrainingPhase,
  countdownFrom: 0 | 3 | 5,
  announced: ReadonlySet<number>,
): Extract<VoiceEvent, { type: 'countdown' }> | null {
  const seconds = Math.ceil(remainingMs / 1000);
  return stage !== 'idle'
    && seconds > 0
    && seconds <= countdownFrom
    && !announced.has(seconds)
    ? { type: 'countdown', stage, seconds }
    : null;
}

function phaseMs(phase: TrainingPhase, config: TrainingConfig): number {
  switch (phase) {
    case 'ready': return 5000;
    case 'contract': return config.contractTime * 1000;
    case 'hold': return config.holdTime * 1000;
    case 'relax': return config.relaxTime * 1000;
    case 'feedback': return 6000;
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
    phaseRemaining = Math.max(0, phaseDur - (e.pauseStartedAt - e.phaseStartedAt));
    totalRunningMs = Math.max(0, e.pauseStartedAt - e.sessionStartedAt - e.totalPausedMs);
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

export function useKegelEngine(options: KegelEngineVoiceOptions = {}): UseKegelEngineReturn {
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
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const emitVoice = useCallback((event: VoiceEvent, phaseRemainingMs = 0) => {
    const e = eng.current;
    e.eventSequence += 1;
    try {
      optionsRef.current.onVoiceEvent?.(event, {
        sessionId: e.sessionId,
        round: e.round + 1,
        now: Date.now(),
        stageEndsAt: Date.now() + phaseRemainingMs,
        sequence: e.eventSequence,
      });
    } catch {
      // Voice assistance must never interrupt the training engine.
    }
  }, []);

  /** 推送到渲染层 (节流到 100ms) */
  const pushState = useCallback(() => {
    const now = performance.now();
    const e = eng.current;
    const s = buildState(e, now);
    setState(s);
    if (e.status !== 'running') return;

    const countdown = getCountdownEvent(
      s.phaseRemainingMs,
      e.phase,
      optionsRef.current.countdownFrom ?? 0,
      e.announcedCountdowns,
    );
    if (countdown) {
      e.announcedCountdowns.add(countdown.seconds);
      emitVoice(countdown, s.phaseRemainingMs);
    }
  }, [emitVoice]);

  const stopTick = useCallback(() => {
    if (tickId.current !== null) {
      clearInterval(tickId.current);
      tickId.current = null;
    }
  }, []);

  const enterPhase = useCallback((phase: Exclude<TrainingPhase, 'idle'>) => {
    const e = eng.current;
    e.phase = phase;
    e.phaseStartedAt = performance.now();
    e.announcedCountdowns.clear();
    emitVoice(
      { type: 'stage-enter', stage: phase },
      phaseMs(phase, e.config),
    );
  }, [emitVoice]);

  /** 推进到下一阶段 */
  const advance = useCallback(() => {
    const e = eng.current;
    const cfg = e.config;

    if (e.phase === 'ready') {
      emitVoice({ type: 'round-start', round: e.round + 1, totalRounds: cfg.rounds });
      enterPhase('contract');
      return;
    }
    if (e.phase === 'contract') {
      enterPhase('hold');
      return;
    }
    if (e.phase === 'hold') {
      enterPhase('relax');
      return;
    }
    if (e.phase === 'relax') {
      const nextRound = e.round + 1;
      if (nextRound >= cfg.rounds) {
        emitVoice({ type: 'completed' });
        enterPhase('feedback');
        return;
      }
      e.round = nextRound;
      emitVoice({ type: 'round-start', round: e.round + 1, totalRounds: cfg.rounds });
      enterPhase('contract');
      return;
    }
    if (e.phase === 'feedback') {
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
  }, [emitVoice, enterPhase, pushState, stopTick]);

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
  }, [advance, pushState, stopTick]);

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
    e.sessionId += 1;
    e.eventSequence = 0;
    e.status = 'running';
    e.round = 0;
    e.sessionStartedAt = performance.now();
    e.totalPausedMs = 0;
    e.config = config;
    e.pauseStartedAt = 0;
    emitVoice({ type: 'training-ready' });
    enterPhase('ready');
    startTick();
    pushState();
  }, [config, emitVoice, enterPhase, startTick, pushState]);

  const pause = useCallback(() => {
    const e = eng.current;
    if (e.status !== 'running') return;
    e.status = 'paused';
    e.pauseStartedAt = performance.now();
    emitVoice({ type: 'paused' });
    pushState();
  }, [emitVoice, pushState]);

  const resume = useCallback(() => {
    const e = eng.current;
    if (e.status !== 'paused') return;
    // 修正阶段开始时间以补偿暂停时长
    const pauseDuration = performance.now() - e.pauseStartedAt;
    e.phaseStartedAt += pauseDuration;
    e.totalPausedMs += pauseDuration;
    e.status = 'running';
    e.pauseStartedAt = 0;
    emitVoice({ type: 'resumed' }, phaseMs(e.phase, e.config));
    pushState();
  }, [emitVoice, pushState]);

  const stop = useCallback(() => {
    const e = eng.current;
    stopTick();
    emitVoice({ type: 'stopped' });
    const sessionId = e.sessionId;
    Object.assign(e, createInitialEngine(e.config));
    e.sessionId = sessionId;
    setState(prev => ({
      ...prev,
      status: 'idle',
      phase: 'idle',
      currentRound: 0,
      phaseRemainingMs: 0,
      totalElapsedMs: 0,
    }));
  }, [emitVoice, stopTick]);

  const restart = useCallback(() => {
    stopTick();
    const e = eng.current;
    e.sessionId += 1;
    e.eventSequence = 0;
    e.status = 'running';
    e.round = 0;
    e.sessionStartedAt = performance.now();
    e.totalPausedMs = 0;
    e.pauseStartedAt = 0;
    emitVoice({ type: 'training-ready' });
    enterPhase('ready');
    startTick();
    pushState();
  }, [emitVoice, enterPhase, startTick, pushState, stopTick]);

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
