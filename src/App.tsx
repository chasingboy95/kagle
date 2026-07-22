import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import MuscleSphere from './components/MuscleSphere';
import TrainingStatus from './components/TrainingStatus';
import TimerDisplay from './components/TimerDisplay';
import ProgressBar from './components/ProgressBar';
import ControlButtons from './components/ControlButtons';
import ConfigPanel from './components/ConfigPanel';
import { useKegelEngine } from './hooks/useKegelEngine';
import { calcTotalDuration } from './utils/time';

export default function App() {
  const { state, config, start, pause, resume, stop, restart, updateConfig } =
    useKegelEngine();

  const isIdle = state.status === 'idle';
  const isActive = state.status === 'running' || state.status === 'paused';
  const showHint = state.status === 'running' && state.phase !== 'idle';

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

  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-[#020617] via-slate-900 to-[#111827] flex flex-col items-center px-5 pt-6 pb-8 overflow-hidden selection:bg-white/10">

      {/* 极弱动态 Aurora Glow 背景 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 40, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%]"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(99,102,241,0.06), transparent 70%)',
          }}
        />
      </div>

      {/* 顶部 —— 训练状态 */}
      <div className="pt-4 pb-1">
        <TrainingStatus
          streakDays={3}
          isRunning={state.status === 'running'}
          isPaused={state.status === 'paused'}
          currentRound={state.currentRound}
          totalRounds={config.rounds}
        />
      </div>

      {/* 阶段提示 —— 在肌肉球上方 */}
      <div className="h-10 flex items-center justify-center mb-1">
        <AnimatePresence mode="wait">
          {showHint ? (
            <motion.div
              key={state.phase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-base font-semibold tracking-wide text-slate-200/90"
            >
              {state.phase === 'contract' && '收缩并保持'}
              {state.phase === 'hold' && '坚持住'}
              {state.phase === 'relax' && '放松'}
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-base font-semibold text-slate-400/60"
            >
              准备开始
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 核心区域 —— 肌肉球 + 计时 + 进度（垂直居中） */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-1">
        {/* 肌肉球（含内置 SVG 图层动画 + 波纹） */}
        <div className="relative flex items-center justify-center w-72 h-72">
          <MuscleSphere
            phase={state.phase}
            isRunning={state.status === 'running'}
            isPaused={state.status === 'paused'}
          />
        </div>

        {/* 倒计时 + Round */}
        <TimerDisplay
          phase={state.phase}
          phaseRemainingMs={state.phaseRemainingMs}
          currentRound={state.currentRound}
          totalRounds={config.rounds}
          isRunning={isActive || state.status === 'finished'}
        />

        {/* 进度条 */}
        <div className="w-full max-w-[200px] mt-2">
          <ProgressBar
            current={isIdle ? 0 : state.totalElapsedMs}
            total={totalDurationMs}
          />
        </div>
      </div>

      {/* 底部区域 —— 配置 + 控制 */}
      <div className="w-full max-w-sm space-y-4 pt-2 pb-safe">
        <ConfigPanel
          config={config}
          disabled={isActive}
          onChange={updateConfig}
        />

        <ControlButtons
          status={state.status}
          onStart={start}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onRestart={restart}
        />
      </div>
    </div>
  );
}
