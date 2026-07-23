# 模块化语音辅助系统设计

## 目标

为现有 React、TypeScript 与 Framer Motion 凯格尔训练应用增加可用于完整训练流程的语音辅助系统。系统保持克制、清晰、医疗健康类产品的语气；语音属于训练引擎架构，但不进入视觉组件 `MuscleSphere.tsx`。

## 范围

支持 `off`、`sound-only`、`concise`、`guided`、`countdown` 五种模式，提供中英文脚本、Web Speech API 播放、本地 Web Audio 提示音、可选振动、设置持久化、移动端设置面板，以及队列和降级逻辑测试。

不使用麦克风、录音、语音识别、远程 TTS、声音克隆或训练数据上传。语音不是理解训练状态的唯一渠道；现有文字和动画始终保留。

## 架构

采用训练引擎显式发出 `VoiceEvent` 的方案：

1. `useKegelEngine` 是阶段和剩余时间的唯一权威来源，在状态真正变化时发出类型化事件。
2. `useVoiceAssistant` 持有稳定的 `VoiceController`，向训练引擎提供稳定事件入口，并管理设置、支持状态和预览。
3. `VoiceController` 将事件解析为脚本、提示音和振动，负责优先级队列、去重、过期与打断规则。
4. 播放能力通过适配器隔离，后续可将浏览器语音替换为预录音频，不改变训练引擎。
5. `VoiceSettingsPanel` 只读写设置，不参与训练计时。

`MuscleSphere.tsx` 保持纯视觉组件，本功能不修改它。

## 文件职责

- `src/voice/types.ts`：语音模式、设置、事件、队列、播放接口和提示音类型。
- `src/voice/voiceScripts.ts`：中英文简洁/引导脚本、轮次及倒计时文本解析。
- `src/voice/VoiceController.ts`：事件优先级、队列、确定性 ID、去重、过期、播放调度和打断。
- `src/voice/SpeechSynthesisAdapter.ts`：Web Speech API 支持检测、音色选择、参数应用及安全停止。
- `src/voice/AudioFileAdapter.ts`：通过 Web Audio API 本地合成克制提示音，并保留未来替换为音频文件的适配器边界。
- `src/voice/HapticAdapter.ts`：安全封装 `navigator.vibrate`。
- `src/voice/voiceSettings.ts`：默认值、逐字段运行时校验和 localStorage 持久化。
- `src/hooks/useVoiceAssistant.ts`：React 生命周期、控制器稳定性、设置更新、预览和事件入口。
- `src/components/VoiceSettingsPanel.tsx`：移动优先、可访问的语音设置 UI。
- `src/hooks/useKegelEngine.ts`：从权威状态发出事件和倒计时，不承担播放职责。
- `src/App.tsx`：连接语音 Hook、训练引擎与设置面板。

## 事件与计时

训练引擎发出：准备、阶段进入、倒计时、轮次开始、暂停、恢复、完成和停止事件。

倒计时不创建独立定时器。引擎每次 tick 从权威 `phaseRemainingMs` 计算向上取整后的剩余秒数，仅在整数值发生变化、值大于零且不超过 `countdownFrom` 时发出事件。恢复训练后依据当前剩余时间继续判断，不重播完整阶段提示。

每次训练获得单调递增的会话 ID。事件 ID 由会话、轮次、阶段、事件类型和倒计时秒数确定，例如 `session-2:round-1:contract:countdown:3`。控制器和引擎分别防止重复事件，从而抵抗重复 tick、重复回调和 React Strict Mode 生命周期。

## 队列规则

优先级从高到低为：暂停/停止、阶段变化、训练开始/完成、倒计时、可选鼓励。本次不增加鼓励文案，仅保留优先级边界。

- `stage-enter` 停止当前播放，并清除上一阶段的倒计时。
- `pause` 立即停止当前播放并清除待播倒计时，再按模式播放暂停提示。
- `stop` 立即停止并清空整个队列，再直接处理结束提示；`off` 和 `sound-only` 不朗读。
- 倒计时项的过期时间不晚于当前阶段结束时间；出队时再次检查。
- 相同确定性 ID 只接受一次。
- 新阶段开始时，上一阶段的语音不得继续播放。

浏览器语音合成的真实暂停行为不一致，因此训练暂停采用停止当前语音；恢复时播放“继续训练”，不尝试帧级恢复原句。

## 模式行为

- `off`：不播放语音、提示音或振动。
- `sound-only`：阶段、暂停、停止和完成使用短促柔和的本地合成提示音，不朗读文字。
- `concise`：仅朗读必要阶段变化和生命周期提示。
- `guided`：使用短呼吸及动作指导，不朗读倒计时。
- `countdown`：使用 guided 文案，并在配置的最后 3 或 5 秒朗读数字。

`announceRound` 控制轮次提示；`announceNextStage` 作为设置模型保留，并在启用时把下一阶段短提示附加到当前阶段文案。所有文字避免诊断、治疗或康复承诺。

## 播放与降级

`SpeechSynthesisAdapter` 在构造时只建立一次音色缓存，通过 `voiceschanged` 更新。优先使用完全匹配 `voiceName` 的音色，其次选择匹配语言的音色，最后允许浏览器默认音色；不会在渲染时随机选择。

适配器应用 `volume`、`rate`、`pitch` 和语言，在新语音需要打断旧语音时调用 `cancel()`。API 缺失、音色为空或调用失败均返回安全结果，不向调用方抛错，并暴露 `supported` 状态。首次播放由开始训练或预览按钮等用户交互触发。

`AudioFileAdapter` 使用用户交互时创建/恢复的 `AudioContext` 合成短促正弦提示音，不加载网络资源。缺少 Web Audio 时静默降级。振动仅在设置开启且 `navigator.vibrate` 可用时执行：收紧约 40ms、放松约 25ms、完成 `[35, 80, 35]`。

## 设置与持久化

默认设置严格采用需求给定值。localStorage 使用带版本的固定键；读取时确认对象形状，并逐字段检查枚举、布尔值、合法语言、有限数值范围及 `countdownFrom` 联合类型。任何非法字段单独回退默认值，存储不可用或 JSON 损坏时整体安全回退。

`enabled=false` 的行为等同 `off`，但保留用户选择的模式以便重新开启。

## 设置界面与可访问性

设置面板采用与当前深色健康类视觉一致的轻量卡片：主开关在顶部，模式使用紧凑选择控件，倒计时使用三段选项，音量和语速使用带标签滑杆，轮次与振动使用开关，底部提供预览按钮。

所有控件使用原生可聚焦元素、显式标签、可见焦点和键盘操作。不可用能力提供简短文字说明。现有阶段文字、计时和动画不被替换；`prefers-reduced-motion` 与语音设置互相独立，应用不会修改设备音量。

## 测试与验收

引入 Vitest，针对纯逻辑与浏览器适配器编写单元测试：

- 同一阶段的相同倒计时秒数只接受一次。
- 已超过 `expiresAt` 的事件不会播放。
- 暂停停止当前播放并清除所有待播倒计时。
- 停止停止当前播放并清空队列。
- 缺少 `speechSynthesis` 与 `SpeechSynthesisUtterance` 时不抛错且报告不支持。
- 设置损坏时回退安全默认值。

最终验收运行测试、lint 和 Vite/TypeScript 构建，并在浏览器手动检查开始、阶段切换、倒计时、暂停、恢复、停止、完成、设置持久化和不支持语音时的 UI。现有未提交视觉改动必须保留，不纳入本功能的无关修改。
