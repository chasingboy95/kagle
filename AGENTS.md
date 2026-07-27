# Repository Guidelines

本文档面向贡献者与 AI 代理，说明本仓库的结构、开发流程与约定。

## 项目结构

```
/
├── index.html              # Vite 入口 HTML，仅 13 行
├── src/
│   ├── main.tsx            # React 入口，渲染 <App />
│   ├── App.tsx             # 根组件，连接训练引擎 + 语音 + 所有 UI
│   ├── index.css           # @import "tailwindcss"（唯一样式入口）
│   ├── types/
│   │   └── training.ts     # TrainingConfig, EngineState, TrainingStatus, TrainingPhase
│   ├── hooks/
│   │   ├── useKegelEngine.ts       # 训练状态机 + 计时核心
│   │   ├── useKegelEngine.test.ts  # 倒计时辅助函数测试
│   │   └── useVoiceAssistant.ts    # VoiceController 的 React 绑定
│   ├── utils/
│   │   └── time.ts         # formatSeconds, calcTotalDuration, phaseHint, actionHint
│   ├── components/
│   │   ├── MuscleSphere.tsx       # 9 层 SVG 叠加动画（核心视觉组件）
│   │   ├── TimerDisplay.tsx       # 阶段名 + 倒计时 + 组数显示
│   │   ├── ProgressBar.tsx        # 整体进度条
│   │   ├── TrainingStatus.tsx     # 标题、连续天数、组数信息
│   │   ├── ControlButtons.tsx     # 开始/暂停/继续/停止/再来一次
│   │   ├── ConfigPanel.tsx        # 训练参数步进器
│   │   ├── VoiceSettingsPanel.tsx # 语音模式/设置界面
│   │   └── Ripple.tsx             # 全屏背景波纹（当前未使用）
│   ├── voice/
│   │   ├── types.ts               # VoiceEvent, VoiceSettings, VoicePlaybackAdapter
│   │   ├── VoiceController.ts     # 优先级队列、去重、过期、播放调度
│   │   ├── VoiceController.test.ts
│   │   ├── SpeechSynthesisAdapter.ts  # Web Speech API 封装
│   │   ├── SpeechSynthesisAdapter.test.ts
│   │   ├── AudioFileAdapter.ts    # Web Audio API 提示音合成
│   │   ├── HapticAdapter.ts       # navigator.vibrate 封装
│   │   ├── voiceScripts.ts        # 中英文简洁/引导脚本
│   │   └── voiceSettings.ts       # 默认值、验证、localStorage 持久化
│   └── assets/
│       └── muscle-sphere/         # 9 个 SVG 图层文件（构建唯一来源）
├── docs/                   # 完整文档基线
│   ├── PRD.md, ARCHITECTURE.md, FEATURE_SPEC.md
│   ├── TRAINING_ENGINE_SPEC.md, MUSCLE_SPHERE_MOTION_SPEC.md
│   ├── SVG_ASSET_SPEC.md, VOICE_ASSISTANT_SPEC.md, VOICE_SCRIPTS.md
│   ├── TEST_PLAN.md, IMPLEMENTATION_STATUS.md, TASKS.md
│   ├── CHANGELOG.md, KNOWN_ISSUES.md
│   └── decisions/ADR-*.md
├── package.json            # 依赖管理（React 19, Framer Motion, Tailwind, Vite, Vitest）
├── tsconfig.json           # TypeScript 严格模式，路径别名 @/
├── vite.config.js          # Vite 配置（Tailwind, React 插件, base: /kagle/）
├── bun.lock                # Bun 锁文件
├── .oxlintrc.json          # Oxlint 规则（React hooks, export components）
├── .github/workflows/deploy.yml  # CI: bun install → build → deploy gh-pages
├── README.md               # 项目说明
├── CHANGELOG.md            # 变更日志
├── KNOWN_ISSUES.md         # 已知问题
└── 盆底肌动画设计文档.md     # 历史设计参考文档（部分实现有差异）
```

## 技术栈

- **框架**：React 19 + TypeScript（严格模式）
- **构建**：Vite 8
- **样式**：Tailwind CSS 4（通过 `@tailwindcss/vite` 插件）
- **动画**：Framer Motion 12
- **语音**：Web Speech API（语音合成）、Web Audio API（提示音）
- **触觉**：Navigator Vibration API
- **持久化**：localStorage
- **测试**：Vitest 4
- **代码检查**：Oxlint 1
- **CI/CD**：GitHub Actions → GitHub Pages

## 开发与运行

本项目使用 Bun 作为包管理器，Vite 作为开发服务器。

```bash
# 安装依赖
bun install

# 启动开发服务器（默认 http://localhost:5173）
bun run dev

# 构建生产版本
bun run build

# 运行测试
bun run test

# 代码检查
bun run lint

# 预览生产构建
bun run preview
```

**重要**：不要直接打开 `index.html`（这是 Vite 入口，需要构建服务器才能运行）。

## 代码风格

- 使用 TypeScript 严格模式，禁用 `noUnusedLocals` 和 `noUnusedParameters`。
- 缩进使用 2 空格，`tsx`/`ts` 文件采用 Prettier 默认风格。
- CSS 使用 Tailwind utility classes，不在 `index.css` 中手写自定义样式。
- 组件使用 React Functional Component + Hooks，默认导出。
- 变量与函数使用 camelCase。
- 类型定义使用 PascalCase。
- 文件命名：组件使用 PascalCase（如 `MuscleSphere.tsx`），工具/钩子使用 camelCase。
- 不创建非必要的抽象层，当前组件化结构已满足需求。

## 测试

测试使用 Vitest，测试文件与源文件放在同一目录，命名为 `*.test.ts` / `*.test.tsx`。

当前测试覆盖（4 个文件，11 个测试全部通过）：

| 文件 | 范围 | 测试数 |
|------|------|--------|
| `src/hooks/useKegelEngine.test.ts` | 倒计时事件辅助函数 | 1 |
| `src/voice/VoiceController.test.ts` | 队列、去重、暂停/停止清理、过期 | 6 |
| `src/voice/SpeechSynthesisAdapter.test.ts` | API 不可用时的安全降级 | 1 |
| `src/voice/voiceSettings.test.ts` | 设置验证、存储降级 | 3 |

运行测试：`bun run test`

**需要新增测试的高优先级区域**：
- 训练引擎状态转换和计时精度
- 组件渲染（Vitest + React Testing Library）
- E2E 流程（Playwright）

## 提交规范

提交信息遵循以下格式：

```
<type>: <简短描述>

[可选正文，说明动机和对比]
```

**类型前缀**：`feat` / `fix` / `refactor` / `style` / `docs` / `perf` / `chore`

示例：

```
feat: 增加倒计时提示音
fix: 语音播报在 iOS Safari 上不触发的问题
docs: 更新 AGENTS.md 匹配实际架构
```

## Agent 注意事项
- 单 Issue 单 Commit 单 Close，严禁批量合并提交。
- 提交前在本地依次运行 `bun run typecheck`、`bun run test:coverage`、`bun run lint`、`bun run build`，全部通过后方可提交。若环境支持还应运行 `bun run test:e2e`（本地沙箱受限时可依赖 CI 作为 E2E 门禁）。
- 修复 GitHub Issue 前逐条确认所有验收条件（Acceptance Criteria）均已满足，不得跳过或部分实现。

- 修改 `src/` 中的 `.tsx`/`.ts` 文件时注意保留模块导入顺序和已有组件结构。
- 新增功能应嵌入现有组件或创建新组件文件，不修改 `index.html`。
- 所有语音 API（SpeechSynthesis、AudioContext、WakeLock、Vibration）都经过适配器封装和 `isSupported()` 检查；修改语音相关逻辑时需遵循适配器模式。
- MuscleSphere 是纯视觉组件，不应引入训练引擎或语音逻辑。
- 训练引擎（`useKegelEngine`）是整个应用的唯一权威时间源，语音和动画不从属独立计时器。
- At the end of every implementation task:
    1. Update docs/TASKS.md truthfully.
    2. Update docs/IMPLEMENTATION_STATUS.md truthfully.
    3. Add or update tests.
    4. Record unresolved issues in KNOWN_ISSUES.md.
    5. Add an ADR for any significant architectural decision.
    6. Update CHANGELOG.md for user-visible changes.
    7. Never claim a feature is complete if it is mocked, partially implemented, untested, or platform-dependent.
    8. Update README.md if the task affects project setup, usage, or supported platforms.
