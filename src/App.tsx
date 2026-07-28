import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import MuscleSphere from './components/MuscleSphere';
import TrainingStatus from './components/TrainingStatus';
import TimerDisplay from './components/TimerDisplay';
import ProgressBar from './components/ProgressBar';
import ControlButtons from './components/ControlButtons';
import ConfigPanel from './components/ConfigPanel';
import VoiceSettingsPanel from './components/VoiceSettingsPanel';
import { useKegelEngine } from './hooks/useKegelEngine';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { useTrainingHistory, buildTrainingRecord } from './hooks/useTrainingHistory';
import { useWeeklyGoal } from './hooks/useWeeklyGoal';
import { useSavedConfigs } from './hooks/useSavedConfigs';
import TrainingHistory from './components/TrainingHistory';
import ProgressiveSuggestion from './components/ProgressiveSuggestion';
import Onboarding from './components/Onboarding';
import SessionRecovery from './components/SessionRecovery';
import StorageErrorNotice from './components/StorageErrorNotice';
import DataManagement from './components/DataManagement';
import { evaluateSuggestion, type ProgressiveSuggestion as SuggestionType, type ProgressiveSuggestionState } from './utils/progressiveTraining';
import { ONBOARDING_SCHEMA, PROGRESSIVE_SCHEMA } from './utils/appStorageSchemas';
import { defaultStorage } from './utils/storage';
import TrainingFeedback from './components/TrainingFeedback';
import { actionHint, calcDisplayPhaseTiming, calcTotalDuration } from './utils/time';
import {
  computeCompletionProgress,
  type CompletionProgress,
} from './utils/completionProgress';

export default function App() {
  const reducedMotion = useReducedMotion();
  const voice = useVoiceAssistant();
  const history = useTrainingHistory();
  const weeklyGoal = useWeeklyGoal(history.records);
  const savedConfigs = useSavedConfigs();
  const [showHistory, setShowHistory] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestionType | null>(null);
  const [completionProgress, setCompletionProgress] = useState<CompletionProgress | null>(null);
  const [progState, setProgState] = useState<ProgressiveSuggestionState>(() => defaultStorage.read(PROGRESSIVE_SCHEMA));
  const [showOnboarding, setShowOnboarding] = useState(() => defaultStorage.read(ONBOARDING_SCHEMA));
  const { state, config, start, pause, resume, stop, finish, restart, updateConfig, recoverableSession, discardSession, recoverSession } =
    useKegelEngine({
      onVoiceEvent: voice.emit,
      countdownFrom: voice.settings.enabled && voice.settings.mode !== 'off'
        ? voice.settings.countdownFrom
        : 0,
    onSessionEnd: (data) => {
      // 使用会话实际执行的不可变配置（恢复会话时为快照配置），
      // 保证目标次数、各阶段时长与完成结果来自同一来源。
      const record = buildTrainingRecord(
        data.config,
        data.completedReps,
        data.actualDurationMs,
        data.status,
        data.startedAt,
      );
        const nextRecords = history.addRecord(record);
        // Evaluate progressive suggestion
        if (data.status === 'completed') {
          try {
            setCompletionProgress(computeCompletionProgress(
              nextRecords,
              record,
              weeklyGoal.settings,
              new Date(),
              Intl.DateTimeFormat().resolvedOptions().timeZone,
            ));
          } catch {
            setCompletionProgress(null);
          }
          const currentProgState = defaultStorage.read(PROGRESSIVE_SCHEMA);
          const s = evaluateSuggestion(nextRecords, currentProgState);
          if (s) setSuggestion(s);
        }
      },
    });

  const isIdle = state.status === 'idle';
  const isActive = state.status === 'running' || state.status === 'paused' || state.status === 'feedback';
  const showHint = state.status === 'running' && state.phase !== 'idle';
  const showFeedback = state.phase === 'feedback';
  // Recovery always wins. First-use onboarding resumes only after recovery is
  // discarded, or after a recovered session returns to idle.
  const showRecovery = Boolean(recoverableSession);
  const showOnboardingModal = showOnboarding && !showRecovery && isIdle;
  const hasModal = showRecovery || showOnboardingModal;

  const displayTiming = calcDisplayPhaseTiming(
    state.phase,
    state.phaseRemainingMs,
    config.contractTime,
    config.holdTime,
    config.relaxTime,
  );

  const totalDurationMs = useMemo(
    () =>
      calcTotalDuration(
        config.contractTime,
        config.holdTime,
        config.relaxTime,
        config.rounds,
      ),
    [config],
  );

  const handleSuggestionAction = (action: 'accept' | 'ignore' | 'dismiss') => {
    if (!suggestion) return;
    const now = new Date().toISOString();
    const next: ProgressiveSuggestionState = {
      lastSuggestedAt: now,
      lastAction: action,
      ignoreCount: action === 'ignore' ? progState.ignoreCount + 1 : 0,
    };
    setProgState(next);
    defaultStorage.write(PROGRESSIVE_SCHEMA, next);
    if (action === 'accept') {
      updateConfig(suggestion.after);
    }
    setSuggestion(null);
  };

  const handleOnboardingComplete = () => { setShowOnboarding(false); defaultStorage.write(ONBOARDING_SCHEMA, false); };

  const handleStart = () => {
    setCompletionProgress(null);
    void voice.unlock();
    start();
  };

  const handleRestart = () => {
    setCompletionProgress(null);
    void voice.unlock();
    restart();
  };

  return (
    <>
      {showOnboardingModal && <Onboarding onComplete={handleOnboardingComplete} />}
      {recoverableSession && (
        <SessionRecovery
          snapshot={recoverableSession}
          onContinue={recoverSession}
          onDiscard={discardSession}
        />
      )}
      {!hasModal && (
        <StorageErrorNotice
          errors={[
            ...(history.storageError ? [{ source: '训练记录', message: history.storageError }] : []),
            ...(weeklyGoal.storageError ? [{ source: '周目标', message: weeklyGoal.storageError }] : []),
            ...(savedConfigs.storageError ? [{ source: '收藏配置', message: savedConfigs.storageError }] : []),
            ...(voice.storageError ? [{ source: '语音设置', message: voice.storageError }] : []),
          ]}
          onDismiss={() => {
            history.dismissStorageError();
            weeklyGoal.dismissStorageError();
            savedConfigs.dismissStorageError();
            voice.dismissStorageError();
          }}
        />
      )}
    <div
      className="relative min-h-dvh bg-gradient-to-b from-[#020617] via-slate-900 to-[#111827] flex flex-col items-center px-5 pt-6 pb-8 overflow-x-hidden selection:bg-white/10"
      aria-hidden={hasModal || undefined}
      inert={hasModal || undefined}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={reducedMotion
            ? { x: 0, y: 0 }
            : { x: [0, 40, -30, 0], y: [0, -30, 40, 0] }}
          transition={reducedMotion
            ? { duration: 0 }
            : { duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%]"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(99,102,241,0.06), transparent 70%)',
          }}
        />
      </div>

      <div className="pt-4 pb-1">
        <TrainingStatus
          isRunning={state.status === 'running'}
          isPaused={state.status === 'paused'}
          currentRepetition={state.currentRound}
          totalRepetitions={config.rounds}
        />
      </div>

      <div className="h-10 flex items-center justify-center mb-1">
        <AnimatePresence mode="wait">
          {showHint ? (
            <motion.div
              key={displayTiming.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-base font-semibold tracking-wide text-slate-200/90"
            >
              {actionHint(state.phase)}
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-base font-semibold text-slate-400/60"
            >
              {actionHint(state.phase) || '准备开始'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-1">
        {showFeedback ? (
          <div className="w-full py-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TrainingFeedback
                completedRepetitions={state.currentRound}
                totalRepetitions={config.rounds}
                durationMs={state.totalElapsedMs}
                progress={completionProgress}
                onRestart={handleRestart}
                onDone={finish}
                onViewHistory={() => { finish(); setShowHistory(true); }}
              />
            </motion.div>
          </div>
        ) : (
          <>
            <div className="relative w-full flex flex-col items-center gap-1">
              <MuscleSphere
                stage={state.phase}
                paused={state.status === 'paused'}
                stageProgress={displayTiming.progress}
                showProgressRing={state.status === 'running'}
                stageDurationMs={displayTiming.durationMs || undefined}
              />
            </div>

            <TimerDisplay
              phase={state.phase}
              displayPhaseKey={displayTiming.key}
              phaseRemainingMs={displayTiming.remainingMs}
              currentRepetition={state.currentRound}
              totalRepetitions={config.rounds}
              isRunning={isActive || state.status === 'finished'}
            />

            <div className="w-full max-w-[200px] mt-2">
              <ProgressBar current={isIdle ? 0 : state.totalElapsedMs} total={totalDurationMs} />
            </div>
          </>
        )}
      </div>

      <div className="w-full max-w-sm space-y-4 pt-2 pb-safe">
        {suggestion && isIdle && !showHistory && (
          <ProgressiveSuggestion suggestion={suggestion} onAction={handleSuggestionAction} />
        )}
        {!showFeedback && !showHistory && (
          <>
            <ConfigPanel
              config={config}
              disabled={isActive}
              onChange={updateConfig}
              savedConfigs={savedConfigs.items}
              onSaveConfig={savedConfigs.add}
              onRenameConfig={savedConfigs.rename}
              onDeleteConfig={savedConfigs.remove}
            />

            <VoiceSettingsPanel
              settings={voice.settings}
              supported={voice.supported}
              onChange={voice.updateSettings}
              onPreview={voice.preview}
            />


            {isIdle && (
              <button
                onClick={() => setShowOnboarding(true)}
                className="w-full rounded-lg bg-white/5 text-slate-400 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                重新查看引导
              </button>
            )}
            {isIdle && (
              <button
                onClick={() => setShowHistory(true)}
                className="w-full rounded-lg bg-white/5 text-slate-400 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                训练记录
              </button>
            )}
            {isIdle && <DataManagement />}
            <ControlButtons
              status={state.status}
              onStart={handleStart}
              onPause={pause}
              onResume={resume}
              onStop={stop}
              onRestart={handleRestart}
            />
          </>
        )}
        {showHistory && isIdle && (
          <TrainingHistory
            records={history.records}
            stats={history.stats}
            onRemoveRecord={history.removeRecord}
            onClearAll={history.clearAll}
            onClose={() => setShowHistory(false)}
            weeklyGoal={weeklyGoal.settings}
            weeklyProgress={weeklyGoal.progress}
            onSetWeeklyTarget={weeklyGoal.setTargetDays}
            onDisableWeeklyGoal={weeklyGoal.disable}
          />
        )}
      </div>
    </div>
    </>
  );
}
