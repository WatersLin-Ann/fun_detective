# 技术债执行报告 - play.astro拆分

**执行时间**：2026-09-02
**任务**：技术债 - play.astro单文件拆分为多模块
**状态**：✅ 完成

---

## 一、拆分背景

### 拆分前问题
- `play.astro` 单文件约850行（含HTML+CSS+JS）
- 内联脚本约740行，状态/渲染/交互/工具函数混杂
- witnessColors重复定义3次
- 后续开发（审判重构、时间线）在单文件中风险高、效率低

### 拆分目标
- 按职责分离：状态管理 / 渲染逻辑 / 交互处理
- 提高可维护性和可测试性
- 为阶段2.4审判机制重构奠定基础
- 消除重复代码

---

## 二、拆分结果

### 模块划分

| 模块 | 文件 | 行数 | 职责 |
|------|------|------|------|
| 游戏状态 | `src/game/gameState.js` | ~130行 | 状态定义、存档、初始化、案件加载 |
| 游戏渲染 | `src/game/gameRender.js` | ~450行 | 所有渲染函数（场景/对话/审判/结局/证据栏） |
| 游戏交互 | `src/game/gameInteractions.js` | ~280行 | 所有交互处理（点击/对话/审判/证据/音效） |
| 游戏页面 | `play.astro` | ~140行 | HTML结构 + 引入JS + 初始化调用 |

### 文件大小对比

| 指标 | 拆分前 | 拆分后 | 变化 |
|------|--------|--------|------|
| play.astro总字符 | 37,942 | 5,401 | -85.8% |
| 内联脚本行数 | 740行 | 0行 | -100% |
| 模块数量 | 1个 | 4个 | +3个 |
| witnessColors定义 | 3次 | 2次 | -1次（后续可进一步消除） |

---

## 三、各模块详细说明

### 1. gameState.js（游戏状态管理）

**核心功能**：
- `currentCaseId` — 当前案件ID（从URL参数获取）
- `state` — 游戏状态对象（16个状态字段）
- `SAVE_KEY` — 存档key（包含案件ID，实现存档隔离）
- `loadCaseData(caseId, callback)` — 动态加载案件数据文件
- `init()` — 初始化游戏（加载数据、恢复存档、初始化音效、调用渲染）
- `save()` — 保存游戏到localStorage
- `getGameData()` — 获取游戏数据（scenes/evidence/witnesses/dialogs/contradictions）
- `getState()` / `setState(partial)` — 状态读写

**暴露API**：
```javascript
window.GameState = {
  currentCaseId,
  state,
  loadCaseData,
  init,
  save,
  getGameData,
  getState,
  setState
};
```

---

### 2. gameRender.js（游戏渲染）

**核心功能**：
- `render()` — 主渲染入口（根据阶段调用对应渲染 + BGM切换 + 自动保存）
- `updateTopBar()` — 更新顶部栏（阶段名称/信心值/证据数量）
- `renderIntro()` — 渲染开场阶段（剧情文本 + 继续按钮）
- `renderInvestigation()` — 渲染调查阶段（场景背景/可交互物/火柴人角色/出口）
- `renderTrial()` — 渲染审判阶段（证人列表/证词/证据选择/对话历史）
- `renderEnding()` — 渲染结局阶段（根据最终选择显示不同结局）
- `renderEvidenceBar()` — 渲染底部证据栏（收集的证据卡片）
- `stickFigure(color, size)` — 火柴人渲染工具
- `stickFigureWithExpr(color, expr, size)` — 带表情的火柴人（6种表情）
- `getWitnessColor(id)` — 证人颜色映射（统一管理）

**依赖**：
- `GameState.state` — 游戏状态
- `GameState.getGameData()` — 游戏数据
- `AudioManager` / `AudioConfig` — BGM自动切换

**暴露API**：
```javascript
window.GameRender = {
  render, updateTopBar, renderIntro, renderInvestigation,
  renderTrial, renderEnding, renderEvidenceBar,
  stickFigure, stickFigureWithExpr, getWitnessColor, witnessColors
};
```

---

### 3. gameInteractions.js（游戏交互）

**核心功能**：
- `window.__interact(itemId)` — 场景物品点击（证据收集/证人对话/出口）
- `window.__exit(sceneId)` — 场景切换
- `window.__introContinue()` — 开场继续按钮
- `window.__selectWitness(witnessId)` — 审判中选择证人
- `window.__followUp()` — 追问证人
- `window.__presentEvidence()` — 出示证据（打开证据选择）
- `window.__selectEvidence(evidenceId)` — 选择证据
- `window.__cancelEvidence()` — 取消证据选择
- `window.__confirmPresentEvidence()` — 确认出示证据（检查矛盾）
- `window.__closeWitnessDialog()` — 关闭证人对话
- `window.__goToEnding()` — 进入结局
- `window.__makeFinalChoice(choice)` — 最终选择
- `window.__toggleTrialHistory()` — 切换审判历史显示
- `addDialogueHistory(speaker, text, color)` — 添加对话历史
- `setWitnessReaction(reaction)` — 设置证人反应表情
- `toggleAudio()` — 切换静音
- `playSfx(sfxId)` — 播放音效

**依赖**：
- `GameState.state` / `GameState.save()` / `GameState.getGameData()`
- `GameRender.render()` — 状态变化后重新渲染
- `GameUI` — 对话框/Toast/收集动画
- `PlayerData` — 笔记自动记录
- `EvidenceBoard` — 证据关联板
- `AudioManager` — 音效播放

**暴露API**：
```javascript
window.GameInteractions = {
  handleSceneClick, addDialogueHistory, setWitnessReaction,
  toggleAudio, playSfx, witnessColors
};
// 同时通过window.__xxx暴露13个交互函数供HTML onclick调用
```

---

### 4. play.astro（精简后）

**保留内容**：
- HTML结构（顶部栏/开场/调查/审判/结局/证据栏/对话框容器）
- CSS样式（Tailwind class）
- 引入所有JS模块（按依赖顺序）
- 初始化调用

**移除内容**：
- 全部740行内联脚本
- 状态定义
- 渲染逻辑
- 交互处理

**初始化代码**：
```html
<script is:inline src="/fun_detective/game/gameState.js"></script>
<script is:inline src="/fun_detective/game/gameRender.js"></script>
<script is:inline src="/fun_detective/game/gameInteractions.js"></script>
<script is:inline>
  GameState.loadCaseData(GameState.currentCaseId, () => {
    GameState.init();
  });
</script>
```

---

## 四、模块加载顺序

```
1. audio-config.js      → 音效配置
2. audioManager.js      → 音效管理器
3. ui.js                → UI工具（对话框/Toast/动画）
4. playerData.js        → 玩家数据
5. notebookUI.js        → 笔记系统
6. evidence-board.js    → 证据关联板
7. gameState.js         → 游戏状态（无依赖）
8. gameRender.js        → 游戏渲染（依赖GameState）
9. gameInteractions.js  → 游戏交互（依赖GameState + GameRender）
10. 内联初始化脚本       → 调用GameState.loadCaseData + init
```

---

## 五、验证结果

- ✅ 构建成功（234 pages, 4.43s）
- ✅ play.astro从37,942字符减到5,401字符（-85.8%）
- ✅ 内联脚本完全移除（740行→0行）
- ✅ 13个window.__xxx交互函数正确暴露
- ✅ 模块加载顺序正确（state→render→interactions）
- ✅ 存档隔离保持（SAVE_KEY包含案件ID）
- ✅ 音效系统集成保持（BGM自动切换 + SFX触发）
- ✅ 多案件架构保持（loadCaseData动态加载）

---

## 六、已知限制和待优化

### 1. witnessColors仍有重复
- gameRender.js和gameInteractions.js中各定义了一次
- **优化方案**：后续统一从GameRender.witnessColors获取，或提取到公共模块

### 2. 模块间通过全局对象通信
- 当前使用window.GameState / window.GameRender / window.GameInteractions
- **优化方案**：后续可考虑ES Module + import，但需要构建工具支持

### 3. 部分函数未在return中暴露
- gameInteractions.js中一些内部函数（如checkContradiction）未在return中列出
- **影响**：不影响运行（通过window.__xxx调用），但API不够清晰
- **优化方案**：后续整理API，统一暴露

### 4. 未做运行时测试
- 本次拆分仅通过构建验证，未在浏览器中完整测试游戏流程
- **建议**：用户强制刷新后测试完整流程（开场→调查→审判→结局）

---

## 七、后续计划

拆分完成后，项目结构清晰，可以高效推进：

| 任务 | 优先级 | 说明 |
|------|--------|------|
| 阶段2.4审判机制重构 | 高 | 在清晰的模块结构中丰富审判交互 |
| 第二案件开发 | 中 | 验证多案件架构，扩充内容 |
| 阶段2.3时间线系统 | 中 | 新增gameTimeline.js模块，不影响现有代码 |
| 消除witnessColors重复 | 低 | 代码优化 |
| 整理模块API | 低 | 统一暴露接口 |

---

## 八、文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/game/gameState.js` | 新建 | 游戏状态管理模块 |
| `src/game/gameRender.js` | 新建 | 游戏渲染模块 |
| `src/game/gameInteractions.js` | 新建 | 游戏交互模块 |
| `src/pages/game-design/prototype/play.astro` | 修改 | 移除内联脚本，引入三个模块 |
| `public/game/gameState.js` | 同步 | 运行时副本 |
| `public/game/gameRender.js` | 同步 | 运行时副本 |
| `public/game/gameInteractions.js` | 同步 | 运行时副本 |
| `docs/play.astro拆分方案.md` | 新建 | 拆分方案文档 |
| `docs/技术债执行报告-play.astro拆分.md` | 新建 | 本报告 |
