 # Repository Guidelines

 本文档面向贡献者与 AI 代理，说明本仓库的结构、开发流程与约定。

 ## 项目结构

 ```
 /
 ├── index.html          # 单页面应用：凯格尔训练计时器
 └── AGENTS.md           # 本文件
 ```

 所有代码、样式、脚本均位于 `index.html` 一个文件中。目前无构建系统、无包管理器。

 ## 开发与运行

 本项目为纯前端静态页面，不依赖构建步骤。直接在浏览器打开即可使用：

 ```bash
 # 方式一：用浏览器打开
 open index.html

 # 方式二：启动本地服务（推荐，避免 CORS 问题带来的语音 API 异常）
 python3 -m http.server 8080
 # 访问 http://localhost:8080
 ```

 ## 代码风格

 - 使用标准 HTML5 + CSS3 + Vanilla JS，不引入外部依赖。
 - 缩进使用 4 空格，维持 `index.html` 现有风格。
 - CSS 选择器使用小写连字符命名（如 `.control-group`、`#holdTime`）。
 - JavaScript 变量与函数使用 camelCase（如 `startWorkout`、`preferredVoice`）。
 - HTML 标签属性使用双引号。
 - 不做非必要的抽象，当前单页面结构无需拆分。

 ## 测试

 本项目当前无测试框架。目前常见的改动场景如下：

 - **语音播报逻辑**：打开浏览器开发者工具，观察 `console` 输出与语音播放是否正常。
 - **计时器行为**：手动设置参数并点击「开始训练」验证循环次数、收缩/放松时序。
 - **UI 交互**：在移动端与桌面端视口下测试按钮、输入框的布局与响应。

 如需引入测试，推荐使用 Vitest 或 Playwright，测试文件放在 `tests/` 目录下。

 ## 提交规范

 本仓库已有一次初始化提交。后续提交信息遵循以下格式：

 ```
 <type>: <简短描述>

 [可选正文，说明动机和对比]
 ```

 **类型前缀**：`feat` / `fix` / `refactor` / `style` / `docs` / `perf` / `chore`

 示例：

 ```
 feat: 增加倒计时提示音
 fix: 语音播报在 iOS Safari 上不触发的问题
 ```

 ## Agent 注意事项

 - 修改 `index.html` 时注意保留内联 `<style>` 与 `<script>` 的次序结构。
 - 新增功能应直接嵌入 `index.html`，不新建文件，除非复杂度已显著超出单页面范围。
 - 语音相关的改动需在 WebKit 与 Chromium 内核浏览器下分别验证。
