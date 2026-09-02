# play.astro拆分方案

**执行时间**：2026-09-02
**任务**：技术债 - play.astro单文件拆分
**状态**：方案制定中

---

## 一、拆分背景

### 当前问题
- `play.astro` 单文件约850行（含HTML+CSS+JS）
- 内联脚本约700行，包含状态、渲染、交互、工具函数混杂
- 后续开发（审判重构、时间线系统）在单文件中进行风险高、效率低
- 重复代码（witnessColors定义了3次）

### 拆分目标
- 按职责分离：状态管理 / 渲染逻辑 / 交互处理
- 提高可维护性和可测试性
- 为阶段2.4审判机制重构奠定基础
- 消除重复代码

---

## 二、拆分方案

### 模块划分

| 模块 | 文件 | 职责 | 依赖 |
|------|------|------|------|
| 游戏状态 | `src/game/gameState.js` | 状态管理、存档、初始化、案件加载 | 无 |
| 游戏渲染 | `src/game/gameRender.js` | 所有渲染函数（场景/对话/审判/结局） | GameState |
| 游戏交互 | `src/game/gameInteractions.js` | 所有交互处理（点击/对话/审判/证据） | GameState + GameRender |
| 游戏页面 | `play.astro` | HTML结构 + 引入JS + 初始化调用 | 全部 |

### 通信方式
- 每个模块通过 `window.GameXXX` 暴露API
- 模块间通过全局对象通信，避免循环依赖
- state对象由GameState持有，其他模块通过 `GameState.state` 访问

---

## 三、各模块详细内容

### 1. gameState.js（状态管理）

**包含内容**：
- `currentCaseId` — 当前案件ID
- `state` — 游戏状态对象
- `SAVE_KEY` — 存档key
- `loadCaseData(caseId, callback)` — 动态加载案件数据
- `init()` — 初始化游戏（加载数据、恢复存档、初始化音效）
- `save()` — 保存游戏
- `reset()` — 重置游戏（预留）
- `getState()` — 获取状态
- `setState(partial)` — 更新状态（预留）

**暴露API**：
```javascript
window.GameState = {
  state,
  currentCaseId,
  loadCaseData,
  init,
  save,
  getGameData: () => ({ gameScenes, gameEvidence, gameWitnesses, gameDialogs, gameContradictions })
};
```

---

### 2. gameRender.js（渲染逻辑）

**包含内容**：
- `render()` — 主渲染入口（根据阶段调用对应渲染）
- `updateTopBar()` — 更新顶部栏（阶段/信心值/证据数量）
- `renderIntro()` — 渲染开场阶段
- `renderInvestigation()` — 渲染调查阶段（场景/可交互物/火柴人）
- `renderTrial()` — 渲染审判阶段（证人列表/证词/证据选择）
- `renderEnding()` — 渲染结局阶段
- `renderEvidenceBar()` — 渲染底部证据栏
- `stickFigure(color, size)` — 火柴人渲染工具
- `stickFigureWithExpr(color, expr, size)` — 带表情的火柴人
- `getWitnessColor(witnessId)` — 证人颜色映射（消除重复）

**依赖**：
- `GameState.state` — 游戏状态
- `GameState.getGameData()` — 游戏数据

**暴露API**：
```javascript
window.GameRender = {
  render,
  updateTopBar,
  renderIntro,
  renderInvestigation,
  renderTrial,
  renderEnding,
  renderEvidenceBar,
  stickFigure,
  stickFigureWithExpr,
  getWitnessColor
};
```

---

### 3. gameInteractions.js（交互处理）

**包含内容**：
- `handleSceneClick(itemId, event)` — 场景物品点击（证据/证人/出口）
- `collectEvidence(evidence)` — 收集证据
- `startWitnessDialog(witness)` — 开始证人对话
- `followUpWitness(witnessId)` — 追问证人
- `selectTrialWitness(witnessId)` — 审判中选择证人
- `showEvidenceSelection()` — 显示证据选择
- `presentEvidence(evidenceId)` — 出示证据
- `checkContradiction()` — 检查矛盾
- `addDialogueHistory(speaker, text, color)` — 添加对话历史
- `setWitnessReaction(reaction)` — 设置证人反应
- `toggleAudio()` — 切换静音
- `playSfx(sfxId)` — 播放音效
- `goToScene(sceneId)` — 场景切换
- `startTrial()` — 开始审判
- `makeFinalChoice(choice)` — 最终选择

**依赖**：
- `GameState.state` — 游戏状态
- `GameState.save()` — 保存
- `GameState.getGameData()` — 游戏数据
- `GameRender.render()` — 重新渲染
- `GameUI` — UI工具（对话框/Toast/动画）
- `PlayerData` — 玩家数据
- `EvidenceBoard` — 证据关联板
- `AudioManager` — 音效

**暴露API**：
```javascript
window.GameInteractions = {
  handleSceneClick,
  collectEvidence,
  startWitnessDialog,
  followUpWitness,
  selectTrialWitness,
  showEvidenceSelection,
  presentEvidence,
  checkContradiction,
  addDialogueHistory,
  setWitnessReaction,
  toggleAudio,
  playSfx,
  goToScene,
  startTrial,
  makeFinalChoice
};
```

---

### 4. play.astro（精简后）

**保留内容**：
- HTML结构（顶部栏/各阶段容器/对话框/证据板等）
- CSS样式（如果有内联style）
- 引入所有JS模块（按依赖顺序）
- 初始化调用：`GameState.loadCaseData(caseId, () => GameState.init())`

**移除内容**：
- 所有内联JS函数
- 状态定义
- 渲染逻辑
- 交互处理

---

## 四、执行步骤

### 步骤1：创建gameState.js
- 提取状态定义、存档、初始化、案件加载
- 暴露GameState全局对象

### 步骤2：创建gameRender.js
- 提取所有渲染函数
- 提取工具函数（stickFigure、witnessColors）
- 依赖GameState

### 步骤3：创建gameInteractions.js
- 提取所有交互处理函数
- 依赖GameState和GameRender
- 保留对GameUI/PlayerData等外部模块的调用

### 步骤4：精简play.astro
- 移除所有内联JS
- 引入三个新模块
- 保留HTML结构和初始化调用

### 步骤5：验证构建
- npm run build
- 测试游戏流程（开场→调查→审判→结局）

### 步骤6：输出执行报告

---

## 五、风险和注意事项

### 风险1：全局变量依赖
- **问题**：原代码中很多函数直接访问全局变量（gameScenes、state等）
- **解决**：通过GameState.getGameData()和GameState.state访问

### 风险2：函数调用顺序
- **问题**：模块加载顺序错误会导致函数未定义
- **解决**：按 gameState → gameRender → gameInteractions 顺序引入

### 风险3：this指向
- **问题**：提取后函数中的this可能变化
- **解决**：所有函数不依赖this，全部通过参数或全局对象访问

### 风险4：HTML内联onclick
- **问题**：HTML中onclick直接调用函数，提取后需要改为调用GameInteractions.xxx
- **解决**：统一修改onclick为 `GameInteractions.xxx()`

### 注意事项
- 拆分过程中不改变任何业务逻辑
- 保持函数签名不变
- 仔细处理闭包变量（如renderInvestigation中的stickFigure）
- 拆分后立即构建验证，发现问题及时回滚

---

## 六、预期成果

| 指标 | 拆分前 | 拆分后 |
|------|--------|--------|
| play.astro行数 | ~850行 | ~200行（仅HTML） |
| 内联脚本 | ~700行 | 0行 |
| 模块数量 | 1个 | 4个（3个JS+1个astro） |
| witnessColors重复 | 3次 | 1次（gameRender.js） |
| 可维护性 | 低 | 高 |
| 后续开发效率 | 低 | 高 |

---

## 七、后续计划

拆分完成后：
1. 阶段2.4审判机制重构（在清晰的模块结构中进行）
2. 第二案件开发（验证多案件架构）
3. 阶段2.3时间线系统（新增模块，不影响现有代码）
