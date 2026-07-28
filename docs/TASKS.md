# Task List

**Last verified against repository:** 2026-07-28

## In Progress

- Verify the simplified voice-assistance modes on real iOS and Android devices.
- Verify the revised completion view and simplified voice settings on a real mobile device.

- [x] **Issue #18: 移动端性能基线与回归检查**: 记录构建资源基线（.github/bundle-baseline.json），CI bundle size check（15% 阈值），性能基线文档（docs/PERFORMANCE_BASELINE.md），真实设备测试留存于 KNOWN_ISSUES.md。
- [x] **Issue #16: 全局错误边界**: ErrorBoundary 包裹根组件，ErrorRecoveryUI 生产安全恢复页（重新加载/清除数据并重置），开发环境保留完整技术详情，onError 仅清除会话快照（不触及训练历史/配置/收藏/周目标），全量清除需用户二次确认，10 个组件测试。

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

- [x] **Issue #59: 异常边界不得自动清空全部本地数据**: onError 仅清除会话快照 key（kegel.session-snapshot.v1），不再遍历删除全部 kegel.* 数据；全量清除需用户二次确认并说明影响范围；10 个组件测试覆盖确认/取消/数据保留路径。
- [x] **Issue #37: 自定义训练配置收藏**: 当前训练节奏可命名收藏并一键应用，支持重命名和删除；最多保留 5 个，系统预设保持只读；收藏使用严格验证的版本化 schema，并迁移旧版扁平数据。
- [x] **Issue #40: 完成页本周真实进度**: 使用刚完成记录写入后返回的同一份历史，展示本周完成次数、累计活动时长、本次增加量和当前连续天数；启用周目标时展示剩余天数，计算失败则安全回退到本次结果，不包含动作质量或医疗评价。
- [x] **Issue #36: 可选每周训练目标**: 支持设置、调整或关闭 1–7 天目标；按本地时区周一至周日的不同完成日期计算，同日多次只计一天且中止不计；展示完成与剩余天数，使用低压力文案，并通过版本化 schema 迁移旧数字目标。
- [x] **Issue #33: 训练日历与月度统计**: 按浏览器时区标记真实训练日期，完成与中止状态分开展示；点击日期查看当天记录并进入详情；月度完成次数、完成训练天数、累计活动时长和最长连续天数仅统计完成记录，跨时区和跨月边界有测试。
- [x] **Issue #35: 单条训练记录详情**: 展示开始/结束时间、训练节奏、目标/完成次数、实际活动时长、完成/中止状态及预设/自定义配置；支持列表进入、返回和二次确认删除，不展示主观质量或医疗评价。
- [x] **Issue #39: 训练前语音与提示音自检**: 在语音面板中显示当前模式、倒计时和音量，支持播放短样例、“我能听到”和“保持静音”；失败时提供非技术化降级说明，明确无法检测系统静音且不阻断直接训练。
- [x] **Issue #24: 渐进建议包含最新完成记录**: 历史写入同步返回同一份已归一化记录供建议评估，第 2 次完成不提前提示，第 3 次相同配置完成后立即提示；中止记录继续不参与判断，不再依赖 React state 重渲染时序。
- [x] **Issue #25: 会话快照严格校验与损坏数据清理**: 仅恢复合法状态/阶段组合；次数、时间、训练配置、倒计时和开始时间均执行严格边界校验；损坏、旧形状或未知快照会被删除并安全回到空闲态，边界与恢复路径均有测试。
- [x] **Issue #32: 训练历史字段与时间校验**: 仅保留 ISO 有效且起止顺序正确的记录；所有数值必须有限且非负，次数必须为整数且完成次数不超过目标；损坏记录逐条丢弃并保留其余有效历史。
- [x] **Issue #31: 自动化无障碍审计与模态优先级**: 恢复会话优先于新手引导，恢复后按 idle 状态继续引导；两个模态具备命名/描述、初始焦点、焦点陷阱和明确 Escape 规则；Playwright axe 覆盖严重/关键违规、reduced motion 与 aria-live。
- [x] **Issue #30: 渐进建议保持输入顺序**: 规则引擎在排序前显式复制训练记录，并声明无副作用契约；回归测试验证评估后输入记录顺序不变，建议规则保持兼容。
- [x] **Issue #29: 训练历史容量与写入失败策略**: 历史最多保留最新 500 条并稳定淘汰最旧记录；存储写入返回成功状态，失败时保留当前 UI 记录并显示可理解提示；容量边界、大量统计和失败路径均有测试。
- [x] **Issue #28: App 存储 Schema 模块化**: 将渐进建议与新手引导 Schema 移到独立模块级定义；保持 `kegel.progressive-suggestion.v1`、`kegel.onboarding.v1`、默认值和校验行为兼容，并增加直接导入测试。
- [x] **Issue #27: 统一会话结果权威计算**: 提取无副作用的完成次数、活动时长和会话结果纯函数；UI、快照、完成与停止流程复用同一计算来源；单元测试覆盖阶段边界、暂停、恢复和反馈冻结。
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
- [x] Added versioned local data export plus validated, previewed, and recoverable import with replace, history-merge, and settings-only strategies.
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
