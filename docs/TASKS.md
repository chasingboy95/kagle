# Task List

**Last verified against repository:** 2026-07-28

## In Progress

- Verify the simplified voice-assistance modes on real iOS and Android devices.
- Verify the revised completion view and simplified voice settings on a real mobile device.

- [x] **Issue #18: 移动端性能基线与回归检查**: 记录构建资源基线（.github/bundle-baseline.json），CI bundle size check（15% 阈值），性能基线文档（docs/PERFORMANCE_BASELINE.md），真实设备测试留存于 KNOWN_ISSUES.md。
- [x] **Issue #16: 全局错误边界**: ErrorBoundary 包裹根组件，ErrorRecoveryUI 生产安全恢复页（重新加载/清除数据并重置），开发环境保留完整技术详情，onError 清除 kegel.* localStorage 防止损坏会话恢复，6 个组件测试。

## Next (Priority Order)

1. **Voice assistance real-device QA**
  - Verify "语音教练" uses the seven new Mandarin recordings.
  - Verify "节奏提示" never speaks full sentences.
  - Verify countdown works independently in both audible modes.
  - Verify sustain and contraction prompts play promptly on phase entry.
  - Verify recording failure falls back to system speech.

2. **Cross-browser manual testing**: desktop Chrome/Safari/Firefox, iOS Safari, Android Chrome.


- [x] **Issue #7: 文档对齐 README/PRD/FEATURE_SPEC**: 修正 Live Demo 地址，统一为 3 种语音模式描述，删除过时的 5 模式引用，更新状态机描述包含 ready/feedback 阶段
- [x] **Issue #6: 清理冗余资源**: 删除 `assets/muscle-sphere/`、`public/muscle-sphere/`、`src/assets/hero.png`、`vite.config.ts`，更新所有文档引用
- [x] **Issue #5: PWA 图标与更新体验**: 生成标准 PNG 图标 (192/512/180)，添加 apple-touch-icon，更新 manifest 为 standalone 模式，service worker 缓存音频+静态资源，添加版本更新提示 UI
- [x] **Issue #17: 统一存储层**: `StorageAdapter` 实现 schema 验证、版本化 key、升级链、损坏恢复；训练配置与历史持久化；16 个测试。
- [x] **Issue #8: 训练历史**: `TrainingRecord` 类型、`useTrainingHistory` Hook、`TrainingHistory` 组件、周完成次数/连续天数/总时长统计；7 个测试。
- [x] **Issue #12: 渐进训练建议**: `evaluateSuggestion` 规则引擎 — 连续 3 次相同配置完成后建议提升参数；`ProgressiveSuggestion` 组件支持接受/忽略/解除操作；9 个测试。
- [x] **Issue #13: CI 拆分**: ci.yml（PR + main push）执行 lint → typecheck → test → build，deploy.yml 在 CI 成功后自动部署；固定 Bun 1.3.14；增加缓存与并发控制。

- [x] **Issue #4: 创建真机验证清单**: 建立 `docs/REAL_DEVICE_TEST_CHECKLIST.md`，覆盖语音/震动/前后台/PWA/训练/无障碍/布局

## Backlog

- Performance profiling.
- Add English recorded prompts before exposing a language selector.
- Implement TrainingFeedback summary component with session statistics.

## Blocked

- None currently.

## Completed

- [x] **Issue #26: 停止训练与历史记录跨模块集成测试**: fake-clock 测试覆盖 ready、contract、hold、relax 阶段中止，暂停后停止、恢复后停止、快照清理、统计与渐进建议隔离以及重复停止幂等；Playwright 覆盖浏览器中的停止与历史写入流程。
- [x] **Issue #23: 暂停后直接停止的训练时长修复**: 当前暂停区间不再计入活动时长；UI、会话快照、完成和停止记录统一使用权威时长函数；fake-clock 测试覆盖多次暂停及直接停止。
- [x] **Issue #19: 完成提示语音不稳定修复**: `resolveVoiceAsset()` 为 `completed` 启用 `complete.mp3`；`VoiceController.enqueue()` 在 completed 入队时清空队列并停止播放；降级链（录音→TTS→提示音）覆盖 completed 事件；新增 5 个 VoiceController 测试覆盖完成事件流程。

- [x] **Issue #20: 训练完成页自动消失修复**: 反馈阶段不再自动推进，tick 在进入 feedback 时停止，onSessionEnd 在 feedback 进入时触发一次。完成页增加"查看训练记录"按钮。引擎假时钟测试 + 组件测试 + E2E 测试覆盖。

- [x] **Issue #10: 首次使用引导**: 三页全屏引导模态（什么是凯格尔训练/呼吸与安全/关于本应用），带跳过/页码指示器/ARIA role=dialog/localStorage 持久化，idle 状态下提供"重新查看引导"按钮。
- [x] **Issue #11: 训练中断恢复**: Engine 在状态变更时保存快照到 localStorage；页面刷新后检测未完成会话，提供"继续训练"/"放弃"UI 并补偿时间；8 个集成测试覆盖运行/暂停/恢复/清空场景。

- [x] **Issue #9: 训练预设**: TrainingPreset 类型、TRAINING_PRESETS 数组（轻松入门/日常训练/耐力提升）、resolvePreset()、ConfigPanel 预设选择器，8 个测试。

- [x] **Web Worker background-tab timing**: Created `timingWorker.ts` + `createTimer.ts` utility; engine uses Worker-based timer in browsers with fallback to setInterval in tests. Timer keeps ticking at full rate even when browser tab is backgrounded.
- [x] **SVG circle progress ring**: Replaced CSS `conic-gradient` progress ring with a proper SVG `<circle>` using `stroke-dasharray`/`stroke-dashoffset` for smoother rendering.
- [x] **Accessibility audit**: Added `aria-live="polite"` regions to TimerDisplay and TrainingStatus; implemented auto-focus management in ControlButtons to keep keyboard/screen-reader users in the control flow after state transitions.
- [x] **Investigated unused Ripple component**: Confirmed `Ripple.tsx` is defined but never imported anywhere in `src/`; no code removal (dead code retained per project conventions).
- [x] **Expanded component coverage**: Added VoiceSettingsPanel tests (mode selector, countdown radios, volume/rate sliders, disable states, unsupported warning) and MuscleSphere tests (rendering for all 6 stages, 9 SVG layers, size prop, progress ring, reduced motion mode).
- [x] Removed hard-coded streak and completion-quality claims until real training history exists.
- [x] Changed completion feedback to show only objective session duration and repetition counts.
- [x] Added GitHub Actions quality gates for tests, lint, TypeScript checks, and production build before deployment.
- [x] Added a reusable `typecheck` package script and completion-summary tests.
- [x] Added fake-clock training-engine integration tests for lifecycle progression, pause/resume compensation, early stop, and completion.
- [x] Added React Testing Library coverage for the plan and completion components.
- [x] Added a Playwright complete-training smoke test and made it a deployment gate.
- [x] Corrected the training-unit terminology: one contract→hold→relax cycle is one repetition, and all configured repetitions together count as one set.
- [x] Updated the plan summary, live progress, voice announcement, settings copy, and completion summary to use repetitions rather than sets.
- [x] Added voice-script tests that prevent repetition announcements from regressing to set/round terminology.
- [x] Applied user-level trial feedback from the GitHub Pages build.
- [x] Changed completion feedback into a persistent result view that hides the training timer, progress, settings, and stage copy.
- [x] Added a completion action so users can leave the result view intentionally.
- [x] Changed the default voice countdown from off to the final 3 seconds for new users.
- [x] Simplified the voice panel so common controls show first and advanced controls are tucked into "高级设置".
- [x] Split contract and hold display copy into "开始收缩" and "保持住" so the UI matches 3-3-3 timing.
- [x] Removed feedback time from total training duration because completion is now user-confirmed rather than timed training.
- [x] Fixed ready and feedback lifecycle prompts so they are not interrupted by duplicate stage-enter speech.
- [x] Prevented countdown announcements during the feedback completion phase.
- [x] Added a short playback grace window so final countdown cues are not dropped at the phase boundary.
- [x] Removed delayed hold prompt scheduling so sustain coaching plays immediately on phase entry.
- [x] Added a dedicated `feedback` status so pause/stop controls are hidden during completion feedback.
- [x] Removed the unimplemented training-history action from the completion card.
- [x] Reran `npm test`, `npm run build`, and `npm run lint` after the lifecycle fixes.
- [x] Training Ready Phase - 5s breathing preparation before first contraction.
- [x] Training Feedback Lifecycle - persistent completion result view after last relaxation.
- [x] Updated state machine: idle → ready → contract → hold → relax → (repeat) → feedback → user confirmation → idle or restart.
- [x] MuscleSphere animations for ready (slow breathing) and feedback (release/calm).
- [x] Voice scripts for ready and feedback stage-enter events.
- [x] Display timing and action hints for both new phases.
- [x] Adjusted total duration to include ready and feedback phases.
- [x] Unit tests for new phase timing, display, and countdown.
- [x] ADR-005 updated with lifecycle design.
- [x] Voice assistance modes simplified to three user-facing choices:
  - 静音 (`off`)
  - 节奏提示 (`sound-only`)
  - 语音教练 (`coach`)
- [x] Legacy `concise`, `guided`, and `countdown` settings migrate automatically to `coach`.
- [x] Countdown is now an independent 0/3/5-second option for both audible modes.
- [x] Fixed Mandarin coach events use the new seven-file recording set.
- [x] Recorded playback failure now falls back to system speech before a non-verbal cue.
- [x] Contract, hold, and relax prompts play immediately on phase entry.
- [x] Unit tests updated for migration, coach/rhythm behavior, independent countdown, asset routing, speech fallback, prompt timing, and boundary countdown playback.
- [x] Sprint 1 continuous training UX.
- [x] Basic PWA support with GitHub Pages subpath handling and iOS standalone metadata.
- [x] Training engine, timer, progress, MuscleSphere animation, settings persistence, wake lock, and GitHub Pages deployment.
