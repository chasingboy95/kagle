 # 语音与交互升级 — 实现计划

 > **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

 **目标：** 在单文件 index.html 中完成凯格尔训练计时器的交互升级，包含 SVG 圆环动画、3-2-1 倒数、状态显示面板。

 **方案：** 基于现有 index.html 重写，保持单文件结构。使用 SVG stroke-dasharray 实现圆环进度动画，CSS transition 驱动动画流程。状态机管理 idle→countdown→hold→relax→done 切换。Web Speech API 不变。

 **技术栈：** HTML5 + CSS3 + Vanilla JS（无外部依赖）

 **修改文件：** `index.html`（唯一文件，全部改动在其中）

 ---

 ### Task 1: HTML 结构 — SVG 圆环 + 信息栏 + 设置面板

 **修改文件：** `index.html`

 **说明：** 重写 `<body>` 内容，用新布局替换旧版。核心结构：

 - SVG 圆环（`viewBox="0 0 200 200"`，圆心 100/100，半径 82，线宽 8）
 - 圆环中央 `<text id="statusText">`（大字状态）
 - 圆环下方 `<text id="phaseLabel">`（小字阶段名）
 - 信息栏（flex 三列：组数 / 阶段 / 剩余秒数）
 - 设置面板（三个 input：hold/relax/reps）
 - 按钮组（开始训练 / 停止）

 ```html
 <div class="circle-wrap">
   <svg viewBox="0 0 200 200">
     <circle class="bg-ring" cx="100" cy="100" r="82"/>
     <circle class="fg-ring" id="progressRing" cx="100" cy="100" r="82"
             stroke-dasharray="515.2" stroke-dashoffset="0"/>
     <text class="status-text" id="statusText" x="100" y="96">准备就绪</text>
     <text class="phase-label" id="phaseLabel" x="100" y="132">凯格尔训练</text>
   </svg>
 </div>

 <div class="info-row">
   <div class="info-item">
     <span class="info-label">组数</span>
     <span class="info-value" id="groupInfo">—</span>
   </div>
   <div class="info-item">
     <span class="info-label">阶段</span>
     <span class="info-value" id="stageInfo">—</span>
   </div>
   <div class="info-item">
     <span class="info-label">剩余</span>
     <span class="info-value" id="remainInfo">—</span>
   </div>
 </div>

 <div class="settings">
   <div class="setting-row">
     <label>收缩保持</label>
     <input type="number" id="holdTime" value="3" min="1">
   </div>
   <div class="setting-row">
     <label>放松时长</label>
     <input type="number" id="relaxTime" value="3" min="1">
   </div>
   <div class="setting-row">
     <label>循环次数</label>
     <input type="number" id="totalReps" value="10" min="1">
   </div>
 </div>

 <div class="btn-group">
   <button class="btn-start" onclick="startWorkout()">开始训练</button>
   <button class="btn-stop" onclick="stopWorkout()">停止</button>
 </div>
 ```

 - [ ] **Step 1: 替换 `<body>` 内的 HTML**

 - [ ] **Step 2: 删除旧 CSS（原有 .control, .control-group 等），留下基础框架标签**

 ---

 ### Task 2: CSS 样式 — 移动端优先，全状态适配

 **修改文件：** `index.html`（`<style>` 块）

 **说明：** 保持现有 4 空格缩进风格。关键样式规则：

 - `.circle-wrap`：flex 居中，margin-bottom: 20px
 - `.bg-ring`：fill none, stroke #e8e8ec, stroke-width 8
 - `.fg-ring`：fill none, stroke-width 8, stroke-linecap round, transform rotate(-90deg), transform-origin center
 - `.status-text`：font-size 2.5rem, font-weight 700, text-anchor middle, fill #1a1a2e
 - `.phase-label`：font-size 1rem, fill #666, text-anchor middle
 - `.info-row`：flex justify-between, 圆角 12px, 背景 #f7f8fa, padding 14px 20px
 - `.info-item`：text-align center
 - `.info-label`：font-size 0.75rem, color #8e8e93
 - `.info-value`：font-size 1rem, font-weight 600
 - `.settings`：背景 #f7f8fa, 圆角 12px, padding 16px 20px
 - `.setting-row`：flex justify-between, 8px margin
 - `.btn-start`：背景 #2ecc71, 白色文字
 - `.btn-stop`：背景 #e74c3c, 白色文字
 - `input`：width 70px, text-align center, 圆角 8px
 - media query：375px 以下适配 padding 和字号

 圆环颜色使用 CSS 变量方便切换：
 ```css
 :root {
   --color-hold: #2ecc71;
   --color-relax: #3498db;
   --color-countdown: #f39c12;
   --color-done: #2ecc71;
   --color-idle: #b0b0b0;
 }
 ```

 - [ ] **Step 1: 在 `<style>` 中写入全部新 CSS**

 - [ ] **Step 2: 删除旧 CSS（原 .control-group、.control、.voice-info 等规则）**

 ---

 ### Task 3: 状态机 + 计时核心

 **修改文件：** `index.html`（`<script>` 块）

 **说明：** 用简单的状态变量 + async/await 驱动流程。

 关键变量：
 ```js
 let timer = null;        // setTimeout 引用
 let isRunning = false;   // 防止重复启动
 let currentGroup = 0;    // 当前组号
 let currentStage = '';   // 'hold' | 'relax'
 ```

 主流程函数 `startWorkout()`：
 ```js
 async function startWorkout() {
   if (isRunning) return;
   isRunning = true;

   const holdMs = parseInt(holdTime.value) * 1000;
   const relaxMs = parseInt(relaxTime.value) * 1000;
   const total = parseInt(totalReps.value);

   // 倒数阶段
   await doCountdown();

   // 训练循环
   for (let i = 1; i <= total; i++) {
     if (!isRunning) break;
     currentGroup = i;
     await doHold(holdMs);
     if (!isRunning) break;
     await doRelax(relaxMs);
   }

   // 完成
   if (isRunning) {
     setDone();
     isRunning = false;
   }
 }
 ```

 停止函数：
 ```js
 function stopWorkout() {
   isRunning = false;
   clearTimeout(timer);
   speechSynthesis.cancel();
   setIdle();
 }
 ```

 辅助函数（更新 UI 状态）：
 - `setIdle()` — 重置到初始状态
 - `setCountdown(number)` — 显示倒数数字 + 圆环脉动
 - `setHold(group, total, remain)` — 绿色填充 + 信息更新
 - `setRelax(group, total, remain)` — 蓝色排空 + 信息更新
 - `setDone()` — 完成状态

 `delay()` 工具函数：
 ```js
 function delay(ms) {
   return new Promise(resolve => { timer = setTimeout(resolve, ms); });
 }
 ```

 - [ ] **Step 1: 定义全局变量和 delay/stop 函数**

 - [ ] **Step 2: 实现 startWorkout 主流程（async 函数）**

 - [ ] **Step 3: 实现 doCountdown（3-2-1 脉冲倒数）**

 - [ ] **Step 4: 实现 doHold（单组收缩）和 doRelax（单组放松）**

 ---

 ### Task 4: SVG 圆环动画控制

 **修改文件：** `index.html`（`<script>` 块）

 **说明：** 通过操作 `stroke-dashoffset` 和 `stroke` 颜色控制圆环动画。

 核心常量与函数：
 ```js
 const RING = document.getElementById('progressRing');
 const STATUS = document.getElementById('statusText');
 const PHASE = document.getElementById('phaseLabel');
 const GROUP = document.getElementById('groupInfo');
 const STAGE = document.getElementById('stageInfo');
 const REMAIN = document.getElementById('remainInfo');

 const CIRCUMFERENCE = 2 * Math.PI * 82; // ≈ 515.2

 function setRingProgress(pct, color) {
   RING.style.transition = 'stroke-dashoffset 0.3s ease';
   RING.style.strokeDashoffset = CIRCUMFERENCE * (1 - pct);
   if (color) RING.style.stroke = color;
 }
 ```

 各状态调用：
 - countdown 脉动：`setRingProgress(0.3, '#f39c12')` → delay(500) → `setRingProgress(0, '#f39c12')` → delay(500) 循环
 - hold：`setRingProgress(0, null)` 然后过渡 `CIRCUMFERENCE * 0` → `CIRCUMFERENCE`，时长 holdMs
 - relax：`setRingProgress(CIRCUMFERENCE, null)` 然后过渡 `0`，时长 relaxMs

 注意：hold/relax 阶段的长过渡使用 CSS transition 在 `transition` 属性中设置时长。具体做法：在 `doHold` 开始前设置 `RING.style.transition = 'stroke-dashoffset ${holdSec}s linear'`，然后一次性设置最终 offset。

 - [ ] **Step 1: 实现 setRingProgress() 函数**

 - [ ] **Step 2: 在 doCountdown 中整合脉动动画**

 - [ ] **Step 3: 在 doHold/doRelax 中整合过渡动画（设置 transition 时长 → 设最终 offset）**

 ---

 ### Task 5: 语音播报

 **修改文件：** `index.html`（`<script>` 块）

 **说明：** 沿用现有 Web Speech API 逻辑，保留语音引擎筛选逻辑。增加倒数阶段的语音播报序列。

 ```js
 function speak(text) {
   speechSynthesis.cancel();
   const msg = new SpeechSynthesisUtterance(text);
   msg.lang = 'zh-CN';
   msg.rate = 0.85;
   if (preferredVoice) msg.voice = preferredVoice;
   speechSynthesis.speak(msg);
 }
 ```

 调用时机：
 - 倒数阶段：`speak('3')` → delay(1000) → `speak('2')` → delay(1000) → `speak('1')` → delay(1000) → `speak('开始')`
 - 收缩：`speak('收缩并保持')`
 - 放松：`speak('放松')`
 - 完成：`speak('训练完成，做得很好')`

 - [ ] **Step 1: 保留并微调 speak() 函数**

 - [ ] **Step 2: 在各状态切换点插入 speak 调用**

 ---

 ### Task 6: 手动验证

 **说明：** 打开 index.html 逐一验证以下场景。

 - [ ] **Step 1: 初始状态** — 显示"准备就绪"，圆环灰色静止

 - [ ] **Step 2: 倒数** — 点击开始，听到 3-2-1-开始，圆环橙色脉动，中央数字同步

 - [ ] **Step 3: 收缩** — 圆环绿色填充（0→100%），显示组号/阶段/剩余秒数，语音播报

 - [ ] **Step 4: 放松** — 圆环蓝色排空（100→0%），信息刷新，语音播报

 - [ ] **Step 5: 完成** — 显示"训练完成！"，绿色满环，语音播报

 - [ ] **Step 6: 停止** — 中途点击停止，回到 idle 状态

 - [ ] **Step 7: 参数修改** — 调整保持/放松时间、循环次数，训练按新参数执行

 ---

 ### Task 7: 提交

 - [ ] **Step 1: git add 并提交**
   ```bash
   git add index.html docs/superpowers/specs/2026-07-22-voice-ui-upgrade-design.md docs/superpowers/plans/2026-07-22-voice-ui-upgrade.md
   git commit -m "feat: 重构凯格尔训练交互 — SVG 圆环动画、倒数、状态面板"
   ```
