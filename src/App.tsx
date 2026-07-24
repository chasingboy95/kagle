import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import MuscleSphere from './components/MuscleSphere';
import TrainingStatus from './components/TrainingStatus';
import TimerDisplay from './components/TimerDisplay';
import ProgressBar from './components/ProgressBar';
import ControlButtons from './components/ControlButtons';
import ConfigPanel from './components/ConfigPanel';
import VoiceSettingsPanel from './components/VoiceSettingsPanel';
import { useKegelEngine } from './hooks/useKegelEngine';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import TrainingFeedback from './components/TrainingFeedback';
import { actionHint, calcDisplayPhaseTiming, calcTotalDuration } from './utils/time';

export default function App() {
  const voice = useVoiceAssistant();
  const { state, config, start, pause, resume, stop, restart, updateConfig } =
    useKegelEngine({
      onVoiceEvent: voice.emit,
      countdownFrom: voice.settings.enabled && voice.settings.mode !== 'off'
        ? voice.settings.countdownFrom
        : 0,
    });

  const isIdle = state.status === 'idle';
  const isActive = state.status === 'running' || state.status === 'paused' || state.status === 'feedback';
  const showHint = state.status === 'running' && state.phase !== 'idle';
  const showFeedback = state.phase === 'feedback';

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

  const handleStart = () => {
    void voice.unlock();
    start();
  };

  const handleRestart = () => {
    void voice.unlock();
    restart();
  };

  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-[#020617] via-slate-900 to-[#111827] flex flex-col items-center px-5 pt-6 pb-8 overflow-x-hidden selection:bg-white/10">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, -30, 0], y: [0, -30, 40, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%]"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(99,102,241,0.06), transparent 70%)',
          }}
        />
      </div>

      <div className="pt-4 pb-1">
        <TrainingStatus
          streakDays={3}
          isRunning={state.status === 'running'}
          isPaused={state.status === 'paused'}
          currentRound={state.currentRound}
          totalRounds={config.rounds}
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
        <div className="relative w-full flex flex-col items-center gap-1">
        <MuscleSphere
          stage={state.phase}
          paused={state.status === 'paused'}
          stageProgress={displayTiming.progress}
          showProgressRing={state.status === 'running'}
          stageDurationMs={displayTiming.durationMs || undefined}
        />
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-slate-900/70 p-4 backdrop-blur-sm"
            >
              <TrainingFeedback
                rounds={state.currentRound}
                durationMs={state.totalElapsedMs}
                onRestart={handleRestart}
              />
            </motion.div>
          )}
        </div>

        <TimerDisplay
          phase={state.phase}
          displayPhaseKey={displayTiming.key}
          phaseRemainingMs={displayTiming.remainingMs}
          currentRound={state.currentRound}
          totalRounds={config.rounds}
          isRunning={isActive || state.status === 'finished'}
        />

        <div className="w-full max-w-[200px] mt-2">
        <ProgressBar current={isIdle ? 0 : state.totalElapsedMs} total={totalDurationMs} />
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4 pt-2 pb-safe">
        <ConfigPanel config={config} disabled={isActive} onChange={updateConfig} />

        <VoiceSettingsPanel
          settings={voice.settings}
          supported={voice.supported}
          onChange={voice.updateSettings}
          onPreview={() => { void voice.preview(); }}
        />

        <ControlButtons
          status={state.status}
          onStart={handleStart}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onRestart={handleRestart}
        />
      </div>
    </div>
  );
}
