import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import MuscleSphere from './components/MuscleSphere';
import TimerDisplay from './components/TimerDisplay';
import ProgressBar from './components/ProgressBar';
import PlanSummaryCard from './components/PlanSummaryCard';
import BottomActionDock from './components/BottomActionDock';
import PrimaryNavigation, { type PrimaryPage } from './components/PrimaryNavigation';
import SettingsHome from './components/SettingsHome';
import SettingsDetailPage from './components/SettingsDetailPage';
import StorageErrorNotice from './components/StorageErrorNotice';
import ReminderNotification from './components/ReminderNotification';
import { useKegelEngine } from './hooks/useKegelEngine';
const ConfigDrawer = lazy(() => import('./components/ConfigDrawer'));
const VoiceDrawer = lazy(() => import('./components/VoiceDrawer'));
const ScheduleSettings = lazy(() => import('./components/ScheduleSettings'));
const DataManagement = lazy(() => import('./components/DataManagement'));
const TrainingHistory = lazy(() => import('./components/TrainingHistory'));
const ProgressiveSuggestion = lazy(() => import('./components/ProgressiveSuggestion'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const SessionRecovery = lazy(() => import('./components/SessionRecovery'));
const TrainingFeedback = lazy(() => import('./components/TrainingFeedback'));

import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { useTrainingHistory, buildTrainingRecord } from './hooks/useTrainingHistory';
import { useWeeklyGoal } from './hooks/useWeeklyGoal';
import { useSavedConfigs } from './hooks/useSavedConfigs';
import { DAY_LABELS, useTrainingSchedule } from './hooks/useTrainingSchedule';
import { evaluateSuggestion, type ProgressiveSuggestion as SuggestionType, type ProgressiveSuggestionState } from './utils/progressiveTraining';
import { ONBOARDING_SCHEMA, PROGRESSIVE_SCHEMA } from './utils/appStorageSchemas';
import { defaultStorage } from './utils/storage';
import { actionHint, calcDisplayPhaseTiming, calcTotalDuration } from './utils/time';
import {
  computeCompletionProgress,
  type CompletionProgress,
} from './utils/completionProgress';

function pageFromHash(): PrimaryPage {
  const page = window.location.hash.slice(1);
  return page === 'records' || page === 'settings' ? page : 'training';
}

export default function App() {
  const reducedMotion = useReducedMotion();
  const voice = useVoiceAssistant();
  const history = useTrainingHistory();
  const weeklyGoal = useWeeklyGoal(history.records);
  const savedConfigs = useSavedConfigs();
  const schedule = useTrainingSchedule();
  const [activePage, setActivePage] = useState<PrimaryPage>(pageFromHash);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [showVoiceDrawer, setShowVoiceDrawer] = useState(false);
  const [settingsDetail, setSettingsDetail] = useState<'reminder' | 'data' | null>(null);
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

  useEffect(() => {
    window.history.replaceState(
      { ...window.history.state, kaglePage: pageFromHash() },
      '',
      `${window.location.pathname}${window.location.search}#${pageFromHash()}`,
    );
    const handlePopState = () => {
      setSettingsDetail(null);
      setActivePage(pageFromHash());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  const handleOnboardingComplete = () => { setShowOnboarding(false); defaultStorage.write(ONBOARDING_SCHEMA, false); };

  const navigate = (page: PrimaryPage) => {
    if (page === activePage) return;
    setSettingsDetail(null);
    window.history.pushState(
      { ...window.history.state, kaglePage: page },
      '',
      `${window.location.pathname}${window.location.search}#${page}`,
    );
    setActivePage(page);
  };

  const openHistory = () => navigate('records');

  const closeHistory = () => {
    window.history.replaceState(
      { ...window.history.state, kaglePage: 'training' },
      '',
      `${window.location.pathname}${window.location.search}#training`,
    );
    setActivePage('training');
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>('nav[aria-label="主要导航"] button[data-page="training"]')?.focus();
    }, 0);
  };

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

  const handleResume = () => {
    void voice.unlock();
    resume();
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

      {showConfigDrawer && activePage !== 'records' && (
        <Suspense fallback={null}>
          <ConfigDrawer
            config={config}
            savedConfigs={savedConfigs.items}
            onApply={updateConfig}
            onSaveConfig={savedConfigs.add}
            onRenameConfig={savedConfigs.rename}
            onDeleteConfig={savedConfigs.remove}
            onClose={() => setShowConfigDrawer(false)}
          />
        </Suspense>
      )}

      {showVoiceDrawer && activePage !== 'records' && (
        <Suspense fallback={null}>
          <VoiceDrawer
            settings={voice.settings}
            supported={voice.supported}
            hapticsSupported={voice.hapticsSupported}
            onApply={(settings) => voice.updateSettings(settings)}
            onPreview={voice.preview}
            onClose={() => setShowVoiceDrawer(false)}
          />
        </Suspense>
      )}

      <div
        className="app-shell relative bg-gradient-to-b from-[#020617] via-slate-900 to-[#111827] flex flex-col items-center selection:bg-white/10"
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

        {activePage === 'records' && isIdle ? (
          <main className="relative z-10 w-full max-w-sm flex-1 px-5 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
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
                onClose={closeHistory}
                weeklyGoal={weeklyGoal.settings}
                weeklyProgress={weeklyGoal.progress}
                onSetWeeklyTarget={weeklyGoal.setTargetDays}
                onDisableWeeklyGoal={weeklyGoal.disable}
              />
            </Suspense>
          </main>
        ) : activePage === 'settings' && isIdle && settingsDetail === 'reminder' ? (
          <SettingsDetailPage
            title="训练提醒"
            description="选择适合自己的训练日和提醒时间"
            onBack={() => setSettingsDetail(null)}
          >
            <Suspense fallback={null}>
              <ScheduleSettings
                settings={schedule.settings}
                onToggleEnabled={schedule.toggleEnabled}
                onSetDaysOfWeek={schedule.setDaysOfWeek}
                onSetReminderTime={schedule.setReminderTime}
              />
            </Suspense>
          </SettingsDetailPage>
        ) : activePage === 'settings' && isIdle && settingsDetail === 'data' ? (
          <SettingsDetailPage
            title="数据备份与恢复"
            description="本地导出、导入和恢复，不上传到云端"
            onBack={() => setSettingsDetail(null)}
          >
            <Suspense fallback={null}><DataManagement /></Suspense>
          </SettingsDetailPage>
        ) : activePage === 'settings' && isIdle ? (
          <SettingsHome
            planSummary={`${config.contractTime}-${config.holdTime}-${config.relaxTime} × ${config.rounds} 次`}
            voiceSummary={voice.settings.enabled
              ? ({ off: '静音', 'sound-only': '节奏提示', coach: '语音教练' } as const)[voice.settings.mode]
              : '已关闭'}
            reminderSummary={schedule.settings.enabled
              ? `${schedule.settings.daysOfWeek.map((day) => DAY_LABELS[day]).join('、')} · ${String(schedule.settings.reminderHour).padStart(2, '0')}:${String(schedule.settings.reminderMinute).padStart(2, '0')}`
              : '已关闭'}
            progressiveDisabled={progState.dismissedPermanently}
            onOpenPlan={() => setShowConfigDrawer(true)}
            onOpenVoice={() => setShowVoiceDrawer(true)}
            onOpenReminder={() => setSettingsDetail('reminder')}
            onShowOnboarding={() => setShowOnboarding(true)}
            onOpenData={() => setSettingsDetail('data')}
            onReenableProgressive={reenableProgressiveSuggestions}
          />
        ) : (
          <>
            <div className="flex flex-col items-center w-full max-w-sm px-5 flex-1">
          {isIdle && (
            <div className="w-full pt-6 pb-2">
              <h1 className="text-sm font-semibold text-slate-300">盆底肌训练</h1>
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
                      onViewHistory={() => { finish(); openHistory(); }}
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

                {isIdle && (
                  <div className="w-full space-y-3 mt-2">
                    <PlanSummaryCard
                      contractTime={config.contractTime}
                      holdTime={config.holdTime}
                      relaxTime={config.relaxTime}
                      rounds={config.rounds}
                      sets={config.sets ?? 1}
                      restBetweenSets={config.restBetweenSets ?? 30}
                      voice={voice.settings}
                      onClick={() => setShowConfigDrawer(true)}
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

          <BottomActionDock
            status={state.status}
            onStart={handleStart}
            onPause={pause}
            onResume={handleResume}
            onStop={stop}
            onRestart={handleRestart}
            onDone={finish}
            idle={isIdle}
          />
          </>
        )}
        {isIdle && settingsDetail === null && (
          <>
            <div
              aria-hidden="true"
              className="primary-navigation-spacer h-[calc(3rem+var(--safe-area-bottom))] w-full shrink-0"
            />
            <PrimaryNavigation current={activePage} onNavigate={navigate} />
          </>
        )}
      </div>
    </>
  );
}
