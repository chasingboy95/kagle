# Voice Assistant Specification

**Last verified against repository:** 2026-07-23

## Overview

语音辅助模块由训练引擎事件驱动，不维护独立计时器。中文固定提示优先播放随应用发布的普通话神经 TTS MP3；动态组数与 en-US 文案仍由 Web Speech API 合成。提示音使用 Web Audio API，触觉反馈使用 `navigator.vibrate`。运行时不调用云端 TTS 服务，也不上传音频数据。

## Voice Modes

| Mode | Voice | Tone cues | Haptics | Countdown |
|------|-------|-----------|---------|-----------|
| `off` | 无 | 无 | 无 | 无 |
| `sound-only` | 无 | 是 | 是 | 无 |
| `concise` | 简短提示 | 有 cue 映射时失败降级 | 是 | 无 |
| `guided` | 引导提示 | 有 cue 映射时失败降级 | 是 | 无 |
| `countdown` | 引导提示 | 有 cue 映射时失败降级 | 是 | 最后 3 或 5 秒 |

## Local Voice Assets

- 目录：`public/audio/voice/{concise,guided,common,countdown}`。
- 格式：MP3，24 kHz、48 kbps、mono。
- 数量：18 个文件，总计 191,088 bytes（186.6 KiB，以仓库文件 `stat` 结果为准）。
- URL：`voiceAssets.ts` 使用 `import.meta.env.BASE_URL` 拼接 `audio/voice/...`，兼容 GitHub Pages 的 `/kagle/` 基路径。
- `PreRecordedAudioAdapter` 基于 `HTMLAudioElement` 预加载与播放；单次播放 8 秒未结束即超时并返回失败。
- 中文 `zh-CN` 的 training-ready、阶段、倒计时、暂停/继续/停止、完成等固定事件使用本地文件。
- `round-start` 包含动态组数，无法映射固定文件；en-US 也没有本地资源，两者继续交给 `SpeechSynthesisAdapter`。
- 修改中文固定文案后，必须手工重新生成对应音频并替换文件；仓库没有可自动复现神经 TTS 产物的生成流水线。

## Playback Routing and Fallback

`VoiceController` 的路由顺序如下：

1. `sound-only` 直接播放提示音。
2. 其他语音模式先由 `resolveVoiceAsset()` 尝试解析本地中文资源。
3. 有资源时交给 `PreRecordedAudioAdapter`；加载、播放、error 或 8 秒超时失败后，仅当该事件存在 `resolveCue()` 映射时才降级为对应 Web Audio 提示音。倒计时事件没有 cue 映射，因此倒计时录音失败时静默跳过并继续训练。
4. 无本地资源时通过 `resolveSpeech()` 和 Web Speech 播放动态组数或 en-US 文案。

阶段切换、暂停、停止或显式停止会同时终止 Web Speech、提示音和本地音频。`VoiceController` 每次打断递增 playback generation；旧的异步本地播放返回后，不得再播放过期的降级提示音。

`SpeechSynthesisAdapter` 同样设置 8 秒 watchdog。部分浏览器可能不触发 utterance 的 `end`/`error`，watchdog 会取消并结束本次 Promise，防止队列永久阻塞。语音选择依次采用明确的 `voiceName`、语言匹配 voice、平台默认 voice。

## Settings

设置通过 `VoiceSettings` 保存到 localStorage 的 `kegel.voice-settings.v1`：`enabled`、`mode`、`language`、`volume`、`rate`、`pitch`、`voiceName`、`countdownFrom`、`announceRound`、`announceNextStage`、`hapticsEnabled`。字段逐项校验，非法值独立回退默认值。

## Queue Semantics

- 优先级从高到低：暂停/停止、阶段进入、准备/完成/轮次/继续、倒计时。
- 事件 ID 包含 session、round、type 和必要细节；已处理事件去重。
- 普通事件 30 秒过期，倒计时在当前阶段结束时过期。
- 新阶段移除旧阶段与倒计时事件；暂停和停止终止当前播放并清队列。
- 所有事件与时间均来自 `useKegelEngine`。

## Haptics and Accessibility

- 收缩：40 ms；放松：25 ms；完成：`[35, 80, 35]`。
- 不支持振动时静默跳过。
- 视觉计时始终可用；音频能力失效不会阻止训练。
- 设置面板使用语义化表单控件并提供试听按钮。

## Platform Fallbacks

| Condition | Behavior |
|-----------|----------|
| 本地 MP3 无法播放 | 有 `resolveCue()` 映射时降级为对应提示音；倒计时无 cue，静默跳过；训练继续 |
| Web Speech 不可用或异常 | watchdog/安全返回；其他本地中文提示与视觉计时继续 |
| Web Audio 不可用 | 提示音静默跳过 |
| `navigator.vibrate` 不可用 | 触觉静默跳过 |
| localStorage 不可用 | 使用默认设置 |
| Wake Lock 不可用 | 训练继续但无法保证屏幕常亮 |

浏览器 autoplay 策略仍可能拒绝 `HTMLAudioElement.play()`；用户开始或试听时会触发预加载，试听还会立即尝试播放，但仍需真实设备验证。

## Privacy and Operations

- 不申请麦克风权限，不录音，不上传训练或音频数据。
- 18 个中文文件随应用静态发布，无运行时云依赖。
- 动态组数与 en-US 的声音质量、voice 可用性仍取决于浏览器和操作系统。

## Verification Status

本地资源解析、基路径、预加载、播放成功/失败、8 秒超时、打断与 generation 防陈旧降级、Web Speech watchdog、队列路由均有自动测试。尚未完成 Chrome、Safari、Firefox、iOS Safari、Android Chrome 的真实跨设备手工 QA；不得将自动测试视为 autoplay 与平台语音行为的完整验证。
