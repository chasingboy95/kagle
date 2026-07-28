import { useState, useRef, useCallback, useEffect } from 'react';
import { createTimer, type TimerHandle } from '../utils/createTimer';
import type { TrainingConfig, TrainingStatus, TrainingPhase, EngineState, SessionSnapshot } from '../types/training';
import { DEFAULT_CONFIG, TRAINING_CONFIG_SCHEMA, SESSION_SNAPSHOT_SCHEMA } from '../types/training';
import { buildSessionResult, getActiveElapsedMs, getCompletedRepetitions, type SessionResult } from '../utils/sessionResult';
import { calcTotalDuration } from '../utils/time';
import type { VoiceEvent } from '../voice/types';
import type { VoiceEventContext } from '../voice/VoiceController';
import { defaultStorage } from '../utils/storage';

/** 会话快照写入节流间隔：稳态训练下约每 1.5s 落盘一次，关键状态变化仍立即写入。 */
const SNAPSHOT_WRITE_INTERVAL_MS = 1500;

export interface KegelEngineVoiceOptions {
  onVoiceEvent?: (event: VoiceEvent, context: VoiceEventContext) => void;
  countdownFrom?: 0 | 3 | 5;
  onSessionEnd?: (data: SessionResult) => void;
}

export interface UseKegelEngineReturn {
  state: EngineState;
  config: TrainingConfig;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  finish: () => void;
  recoverableSession: SessionSnapshot | null;
  discardSession: () => void;
  recoverSession: () => void;
  restart: () => void;
  updateConfig: (updates: Partial<TrainingConfig>) => void;
}

interface EngineInternals {
  status: TrainingStatus;
  phase: TrainingPhase;
  round: number;
  phaseStartedAt: number;
  sessionStartedAt: number;
  /** ISO timestamp captured when start() is called. */
  sessionStartedAtIso: string;
  totalPausedMs: number;
  pauseStartedAt: number;
  config: TrainingConfig;
  sessionId: number;
  eventSequence: number;
  feedbackElapsedSnapshot: number;
  announcedCountdowns: Set<number>;
}

function createInitialEngine(config: TrainingConfig): EngineInternals {
  return {
    status: 'idle',
    phase: 'idle',
    round: 0,
    phaseStartedAt: 0,
    sessionStartedAt: 0,
    sessionStartedAtIso: '',
    totalPausedMs: 0,
    pauseStartedAt: 0,
    config,
    sessionId: 0,
    eventSequence: 0,
    feedbackElapsedSnapshot: 0,
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
    && stage !== 'feedback'
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

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** 从当前引擎快照构建渲染状态 */
function buildState(e: EngineInternals, now: number): EngineState {
  const isPaused = e.status === 'paused';
  const phaseDur = phaseMs(e.phase, e.config);

  let phaseRemaining = 0;
  if (e.status === 'idle' || e.status === 'finished') {
    phaseRemaining = 0;
  } else if (e.status === 'feedback') {
    phaseRemaining = Math.max(0, phaseDur - (now - e.phaseStartedAt));
  } else if (isPaused) {
    phaseRemaining = Math.max(0, phaseDur - (e.pauseStartedAt - e.phaseStartedAt));
  } else {
    const elapsed = now - e.phaseStartedAt;
    phaseRemaining = Math.max(0, phaseDur - elapsed);
  }

  return {
    status: e.status,
    phase: e.phase,
    currentRound: e.phase === 'feedback'
      ? getCompletedRepetitions(e)
      : e.round + 1,
    phaseRemainingMs: Math.ceil(phaseRemaining),
    totalElapsedMs: Math.ceil(getActiveElapsedMs(e, now)),
    totalDurationMs: calcTotalDuration(
      e.config.contractTime,
      e.config.holdTime,
      e.config.relaxTime,
      e.config.rounds,
    ),
  };
}

export function useKegelEngine(options: KegelEngineVoiceOptions = {}): UseKegelEngineReturn {
  const loadedConfig = defaultStorage.read(TRAINING_CONFIG_SCHEMA);
  const [config, setConfig] = useState<TrainingConfig>(loadedConfig);
  const [state, setState] = useState<EngineState>(() => ({
    status: 'idle',
    phase: 'idle',
    currentRound: 0,
    phaseRemainingMs: 0,
    totalElapsedMs: 0,
    totalDurationMs: calcTotalDuration(
      loadedConfig.contractTime,
      loadedConfig.holdTime,
      loadedConfig.relaxTime,
      loadedConfig.rounds,
    ),
  }));
  const [recoverableSession, setRecoverableSession] = useState<SessionSnapshot | null>(null);
  const storedSnapRef = useRef<SessionSnapshot | null>(null);
  useEffect(() => {
    const snap = defaultStorage.read(SESSION_SNAPSHOT_SCHEMA);
    if (snap) {
      storedSnapRef.current = snap;
      setRecoverableSession(snap);
    } else {
      // Malformed and unknown snapshots are not recoverable. Removing the
      // stored value prevents the same corrupt payload from being retried.
      defaultStorage.remove(SESSION_SNAPSHOT_SCHEMA);
    }
  }, []);

  const eng = useRef<EngineInternals>(createInitialEngine(DEFAULT_CONFIG));
  const timerRef = useRef<TimerHandle | null>(null);
  const lastSnapshotWriteRef = useRef(0);
  const lastSnapshotSignatureRef = useRef('');
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

  /** 推送到渲染层 (tick 约 100ms)，并把可恢复快照写入 localStorage。
   * 稳态训练下写入被节流到 SNAPSHOT_WRITE_INTERVAL_MS；force=true 用于
   * 关键状态变化（开始/暂停/继续/阶段切换/恢复/页面隐藏），立即落盘。 */
  const pushState = useCallback((force = false) => {
    const now = performance.now();
    const e = eng.current;
    const s = buildState(e, now);
    setState(s);
    if (e.status === 'running' || e.status === 'paused' || e.status === 'feedback') {
      const phaseElapsedAt = e.status === 'paused' ? e.pauseStartedAt : now;
      const snap: SessionSnapshot = {
        status: e.status,
        phase: e.phase,
        round: e.round,
        phaseElapsedMs: finiteNonNegative(Math.round(phaseElapsedAt - e.phaseStartedAt)),
        sessionElapsedMs: Math.round(getActiveElapsedMs(e, now)),
        totalPausedMs: e.totalPausedMs,
        config: e.config,
        announcedCountdowns: [...e.announcedCountdowns],
        sessionStartedAtIso: e.sessionStartedAtIso,
      };
      const signature = `${e.status}:${e.phase}`;
      const changed = signature !== lastSnapshotSignatureRef.current;
      const shouldWrite =
        force || changed || now - lastSnapshotWriteRef.current >= SNAPSHOT_WRITE_INTERVAL_MS;
      if (shouldWrite) {
        defaultStorage.write(SESSION_SNAPSHOT_SCHEMA, snap);
        storedSnapRef.current = snap;
        lastSnapshotWriteRef.current = now;
        lastSnapshotSignatureRef.current = signature;
      }
    }
    if (e.status !== 'running' && e.status !== 'feedback') return;

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
    if (timerRef.current !== null) {
      timerRef.current.stop();
      timerRef.current = null;
    }
  }, []);

  const enterPhase = useCallback((phase: Exclude<TrainingPhase, 'idle'>, announce = true) => {
    const e = eng.current;
    e.phase = phase;
    e.phaseStartedAt = performance.now();
    e.announcedCountdowns.clear();
    if (announce) {
      emitVoice(
        { type: 'stage-enter', stage: phase },
        phaseMs(phase, e.config),
      );
    }
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
        const now = performance.now();
        e.feedbackElapsedSnapshot = getActiveElapsedMs(e, now);
        emitVoice({ type: 'completed' });
        e.status = 'feedback';
        enterPhase('feedback', false);
        stopTick();
        try {
          optionsRef.current.onSessionEnd?.(
            buildSessionResult(e, 'completed', now),
          );
        } catch {
          /* ignore */
        }
        pushState(true);
        return;
      }
      e.round = nextRound;
      emitVoice({ type: 'round-start', round: e.round + 1, totalRounds: cfg.rounds });
      enterPhase('contract');
      return;
    }
  }, [emitVoice, enterPhase, pushState, stopTick]);

  /**
   * Tick handler – runs on each timer tick (~100 ms).
   * Stored in a ref so `startTick` can pass a stable reference to `createTimer`.
   */
  const tickRef = useRef<() => void>(() => {});
  tickRef.current = useCallback(() => {
    const e = eng.current;
    if (e.status !== 'running' && e.status !== 'feedback') return;

    const now = performance.now();
    const elapsed = now - e.phaseStartedAt;
    const dur = phaseMs(e.phase, e.config);

    if (elapsed >= dur) {
      advance();
    }
    pushState();
  }, [advance, pushState]);

  const startTick = useCallback(() => {
    stopTick();
    const handle = createTimer(() => tickRef.current());
    timerRef.current = handle;
    handle.start();
  }, [advance, pushState, stopTick]);

  // 清理 tick
  useEffect(() => {
    return () => stopTick();
  }, [stopTick]);

  /* ── 页面隐藏即落盘快照 ──────────────────────────────────── */
  // 页面切到后台或被系统回收前，立即写入当前可恢复快照，保证后台/被杀后
  // 仍能恢复到训练进度（tick 节流不影响此边界写入）。
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        pushState(true);
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pushState]);

  /* ── Screen Wake Lock ──────────────────────────────────────── */
  // 训练时阻止手机自动熄屏
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    let cancelled = false;

    async function acquire() {
      if (wakeLock || document.visibilityState !== 'visible') return;
      if (!('wakeLock' in navigator)) return;
      try {
        const lock = await navigator.wakeLock.request('screen');
        // 已卸载或状态已变化则立即释放，不持有过期锁。
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        wakeLock = lock;
        wakeLock.addEventListener('release', onRelease);
      } catch {
        /* API 不支持或权限不足 —— 静默忽略 */
      }
    }

    function onRelease() {
      wakeLock = null;
      // 系统释放（如切后台/熄屏）后，活跃训练且页面可见时重新申请。
      if (!cancelled && document.visibilityState === 'visible') {
        acquire();
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible' && state.status === 'running') {
        // 系统可能在页面隐藏期间自动释放锁（如切后台/熄屏），
        // 重新可见时释放可能已过期的锁并重新申请。
        if (wakeLock) {
          try { wakeLock.release().catch(() => {}); } catch { /* ignore */ }
          wakeLock = null;
        }
        acquire();
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
      document.addEventListener('visibilitychange', onVisibility);
    } else {
      release();
    }

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (wakeLock) {
        wakeLock.removeEventListener('release', onRelease);
        try { wakeLock.release(); } catch { /* ignore */ }
        wakeLock = null;
      }
    };
  }, [state.status]);

  const start = useCallback(() => {
    const e = eng.current;
    e.sessionId += 1;
    e.eventSequence = 0;
    e.status = 'running';
    e.round = 0;
    e.sessionStartedAt = performance.now();
    e.sessionStartedAtIso = new Date().toISOString();
    e.totalPausedMs = 0;
    e.config = config;
    e.pauseStartedAt = 0;
    emitVoice({ type: 'training-ready' });
    enterPhase('ready', false);
    startTick();
    pushState(true);
  }, [config, emitVoice, enterPhase, startTick, pushState]);

  const pause = useCallback(() => {
    const e = eng.current;
    if (e.status !== 'running' && e.status !== 'feedback') return;
    e.status = 'paused';
    e.pauseStartedAt = performance.now();
    emitVoice({ type: 'paused' });
    pushState(true);
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
    pushState(true);
  }, [emitVoice, pushState]);

  const stop = useCallback(() => {
    const e = eng.current;
    if (e.status !== 'running' && e.status !== 'paused') return;
    defaultStorage.remove(SESSION_SNAPSHOT_SCHEMA);
    storedSnapRef.current = null;
    stopTick();
    emitVoice({ type: 'stopped' });
    const result = buildSessionResult(e, 'stopped', performance.now());
    try {
      optionsRef.current.onSessionEnd?.(result);
    } catch {
      /* ignore */
    }
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

  const finish = useCallback(() => {
    const e = eng.current;
    defaultStorage.remove(SESSION_SNAPSHOT_SCHEMA);
    storedSnapRef.current = null;
    stopTick();
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
  }, [stopTick]);

  const restart = useCallback(() => {
    stopTick();
    const e = eng.current;
    e.sessionId += 1;
    e.eventSequence = 0;
    e.status = 'running';
    e.round = 0;
    e.sessionStartedAt = performance.now();
    e.sessionStartedAtIso = new Date().toISOString();
    e.totalPausedMs = 0;
    e.pauseStartedAt = 0;
    emitVoice({ type: 'training-ready' });
    enterPhase('ready', false);
    startTick();
    pushState(true);
  }, [emitVoice, enterPhase, startTick, pushState, stopTick]);

  const updateConfig = useCallback((updates: Partial<TrainingConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      eng.current.config = { ...next };
      defaultStorage.write(TRAINING_CONFIG_SCHEMA, next);
      return next;
    });
  }, []);

  const discardSession = useCallback(() => {
    defaultStorage.remove(SESSION_SNAPSHOT_SCHEMA);
    storedSnapRef.current = null;
    setRecoverableSession(null);
  }, []);

  const recoverSession = useCallback(() => {
    const snap = storedSnapRef.current;
    if (!snap) return;
    setRecoverableSession(null);
    const e = eng.current;
    const now = performance.now();
    // 恢复会话配置为唯一权威来源：引擎配置与 UI 配置同步为快照配置，
    // 避免恢复后引擎按快照配置计时、而界面/历史仍按当前持久化配置。
    setConfig(snap.config);
    e.status = snap.status;
    e.phase = snap.phase;
    e.round = snap.round;
    e.config = snap.config;
    e.sessionStartedAtIso = snap.sessionStartedAtIso;
    e.totalPausedMs = snap.totalPausedMs;
    e.announcedCountdowns = new Set(snap.announcedCountdowns);
    e.sessionId += 1;
    e.eventSequence = 0;
    e.phaseStartedAt = now - snap.phaseElapsedMs;
    e.sessionStartedAt = now - snap.sessionElapsedMs - snap.totalPausedMs;
    if (snap.status === 'paused') {
      e.pauseStartedAt = now;
      pushState(true);
    } else if (snap.status === 'feedback') {
      e.feedbackElapsedSnapshot = snap.sessionElapsedMs;
      pushState(true);
    } else {
      e.pauseStartedAt = 0;
      startTick();
      pushState(true);
    }
  }, [startTick, pushState, setConfig]);

  return {
    state,
    config,
    start,
    pause,
    resume,
    stop,
    finish,
    restart,
    updateConfig,
    recoverableSession,
    discardSession,
    recoverSession,
  };
}
