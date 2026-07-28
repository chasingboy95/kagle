import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { lazy, Suspense, useMemo, useState } from 'react';
import MuscleSphere from './components/MuscleSphere';
import TimerDisplay from './components/TimerDisplay';
import ProgressBar from './components/ProgressBar';
import PlanSummaryCard from './components/PlanSummaryCard';
import BottomActionDock from './components/BottomActionDock';
import StorageErrorNotice from './components/StorageErrorNotice';
import ReminderNotification from './components/ReminderNotification';
import { useKegelEngine } from './hooks/useKegelEngine';
const ConfigDrawer = lazy(() => import('./components/ConfigDrawer'));
const VoiceDrawer = lazy(() => import('./components/VoiceDrawer'));
const MoreMenu = lazy(() => import('./components/MoreMenu'));
const TrainingHistory = lazy(() => import('./components/TrainingHistory'));
const ProgressiveSuggestion = lazy(() => import('./components/ProgressiveSuggestion'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const SessionRecovery = lazy(() => import('./components/SessionRecovery'));
const TrainingFeedback = lazy(() => import('./components/TrainingFeedback'));

import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { useTrainingHistory, buildTrainingRecord } from './hooks/useTrainingHistory';
import { useWeeklyGoal } from './hooks/useWeeklyGoal';
import { useSavedConfigs } from './hooks/useSavedConfigs';
import { useTrainingSchedule } from './hooks/useTrainingSchedule';
import { evaluateSuggestion, type ProgressiveSuggestion as SuggestionType, type ProgressiveSuggestionState } from './utils/progressiveTraining';
import { ONBOARDING_SCHEMA, PROGRESSIVE_SCHEMA } from './utils/appStorageSchemas';
import { defaultStorage } from './utils/storage';
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
  const schedule = useTrainingSchedule();
  const [showHistory, setShowHistory] = useState(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [showVoiceDrawer, setShowVoiceDrawer] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
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
        data.completedSets,
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
    config.restBetweenSets,
  );

  const totalDurationMs = useMemo(
    () =>
      calcTotalDuration(
        config.contractTime,
        config.holdTime,
        config.relaxTime,
        config.rounds,
        config.sets,
        config.restBetweenSets,
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
      dismissedPermanently: action === 'dismiss' ? true : progState.dismissedPermanently,
    };
    setProgState(next);
    defaultStorage.write(PROGRESSIVE_SCHEMA, next);
    if (action === 'accept') {
      updateConfig(suggestion.after);
    }
    setSuggestion(null);
  };

  const reenableProgressiveSuggestions = () => {
    const next: ProgressiveSuggestionState = {
      ...progState,
      dismissedPermanently: false,
      lastAction: null,
    };
    setProgState(next);
    defaultStorage.write(PROGRESSIVE_SCHEMA, next);
  };

  const handleOnboardingComplete = () => { setShowOnboarding(false); defaultStorage.write(ONBOARDING_SCHEMA, false); setShowMoreMenu(false); };

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

  const handleComfortFeedback = (feedback: import('./types/training').ComfortFeedback) => {
    // Update the most recent record with comfort feedback
    const records = history.records;
    if (records.length > 0) {
      const latest = records[0];
      history.updateRecord(latest.id, { comfortFeedback: feedback });
      // Re-evaluate progressive suggestion with comfort data
      const updatedRecords = records.map((r) =>
        r.id === latest.id ? { ...r, comfortFeedback: feedback } : r,
      );
      const currentProgState = defaultStorage.read(PROGRESSIVE_SCHEMA);
      const s = evaluateSuggestion(updatedRecords, currentProgState);
      if (s) setSuggestion(s);
    }
  };

  return (
    <>
      {showOnboardingModal && <Suspense fallback={null}><Onboarding onComplete={handleOnboardingComplete} /></Suspense>}
      {recoverableSession && (
        <Suspense fallback={null}>
          <SessionRecovery
            snapshot={recoverableSession}
            onContinue={recoverSession}
            onDiscard={discardSession}
          />
        </Suspense>
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

      {showConfigDrawer && !showHistory && (
        <Suspense fallback={null}>
          <ConfigDrawer
            config={config}
            savedConfigs={savedConfigs.items}
            onChange={updateConfig}
            onSaveConfig={savedConfigs.add}
            onRenameConfig={savedConfigs.rename}
            onDeleteConfig={savedConfigs.remove}
            onClose={() => setShowConfigDrawer(false)}
          />
        </Suspense>
      )}

      {showVoiceDrawer && !showHistory && (
        <Suspense fallback={null}>
          <VoiceDrawer
            settings={voice.settings}
            supported={voice.supported}
            onChange={voice.updateSettings}
            onPreview={voice.preview}
            onClose={() => setShowVoiceDrawer(false)}
          />
        </Suspense>
      )}

      {showMoreMenu && !showHistory && (
        <MoreMenu
          scheduleSettings={schedule.settings}
          onScheduleToggleEnabled={schedule.toggleEnabled}
          onScheduleSetDaysOfWeek={schedule.setDaysOfWeek}
          onScheduleSetReminderTime={schedule.setReminderTime}
          onShowOnboarding={() => setShowOnboarding(true)}
          onClose={() => setShowMoreMenu(false)}
        />
      )}

      <div
        className="relative min-h-dvh bg-gradient-to-b from-[#020617] via-slate-900 to-[#111827] flex flex-col items-center overflow-x-hidden selection:bg-white/10"
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

        <div className="flex flex-col items-center w-full max-w-sm px-5 flex-1">
          {/* Top bar - only in idle */}
          {isIdle && showHistory && (
            <div className="w-full pt-4 pb-2">
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="text-xs text-slate-500 hover:text-slate-400"
              >
                训练记录
              </button>
            </div>
          )}

          {isIdle && !showHistory && (
            <div className="w-full pt-6 pb-2 flex items-center justify-between">
              <h1 className="text-sm font-semibold text-slate-300">盆底肌训练</h1>
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/10 transition-colors"
              >
                训练记录
              </button>
            </div>
          )}

          {/* Phase hint */}
          <div className="h-10 flex items-center justify-center w-full mb-1">
            <AnimatePresence mode="wait">
              {!isIdle && showHint ? (
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
              ) : isIdle ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-base font-semibold text-slate-400/60"
                >
                  准备开始
                </motion.div>
              ) : (
                <motion.div
                  key={displayTiming.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-base font-semibold text-slate-400/60"
                >
                  {actionHint(state.phase) || ''}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col items-center justify-center w-full gap-1">
            {showFeedback ? (
              <div className="w-full py-8">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Suspense fallback={
                    <div className="flex items-center justify-center py-20">
                      <div className="h-6 w-6 animate-pulse rounded-full bg-slate-700" />
                    </div>
                  }>
                    <TrainingFeedback
                      completedRepetitions={state.currentRound}
                      totalRepetitions={config.rounds}
                      completedSets={state.currentSet}
                      totalSets={config.sets ?? 1}
                      durationMs={state.totalElapsedMs}
                      progress={completionProgress}
                      onRestart={handleRestart}
                      onDone={finish}
                      onViewHistory={() => { finish(); setShowHistory(true); }}
                      onComfortFeedback={handleComfortFeedback}
                    />
                  </Suspense>
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

                {!isIdle && (
                  <>
                    <TimerDisplay
                      phase={state.phase}
                      displayPhaseKey={displayTiming.key}
                      phaseRemainingMs={displayTiming.remainingMs}
                      currentRepetition={state.currentRound}
                      totalRepetitions={config.rounds}
                      currentSet={state.currentSet}
                      totalSets={config.sets ?? 1}
                      isRunning={isActive || state.status === 'finished'}
                    />
                    <div className="w-full max-w-[200px] mt-2">
                      <ProgressBar current={state.totalElapsedMs} total={totalDurationMs} />
                    </div>
                  </>
                )}

                {isIdle && !showHistory && (
                  <div className="w-full space-y-3 mt-2">
                    <PlanSummaryCard
                      contractTime={config.contractTime}
                      holdTime={config.holdTime}
                      relaxTime={config.relaxTime}
                      rounds={config.rounds}
                      sets={config.sets ?? 1}
                      restBetweenSets={config.restBetweenSets ?? 30}
                      voice={voice.settings}
                    />
                    {suggestion && (
                      <Suspense fallback={null}><ProgressiveSuggestion suggestion={suggestion} onAction={handleSuggestionAction} /></Suspense>
                    )}
                    {progState.dismissedPermanently && (
                      <button
                        type="button"
                        onClick={reenableProgressiveSuggestions}
                        className="w-full rounded-lg bg-white/5 text-slate-500 py-2 text-xs font-medium hover:bg-white/10 transition-colors"
                      >
                        重新开启渐进建议
                      </button>
                    )}
                    {schedule.showReminder && (
                      <ReminderNotification
                        show={schedule.showReminder}
                        onDismiss={schedule.dismissReminderNotification}
                        onStartTraining={handleStart}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom action dock */}
        {showHistory && isIdle ? (
          <div className="w-full max-w-sm px-5 pb-[env(safe-area-inset-bottom)]">
            <Suspense fallback={
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-pulse rounded-full bg-slate-700" />
              </div>
            }>
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
            </Suspense>
          </div>
        ) : (
          <BottomActionDock
            status={state.status}
            onStart={handleStart}
            onPause={pause}
            onResume={resume}
            onStop={stop}
            onRestart={handleRestart}
            onDone={finish}
            onAdjustPlan={() => setShowConfigDrawer(true)}
            onVoiceSettings={() => setShowVoiceDrawer(true)}
            onMore={() => setShowMoreMenu(true)}
            idle={isIdle}
          />
        )}
      </div>
    </>
  );
}
