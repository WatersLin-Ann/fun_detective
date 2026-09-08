/**
 * 游戏引导系统UI模块
 * 负责：新手教程、任务目标、进度提示
 * 依赖：GameState, GameUI, AudioManager
 */

const GuideUI = (function() {
  let tutorialStep = 0;
  let isTutorialOpen = false;
  let hintTimer = null;
  let currentSteps = [];

  // 教程完成标记的 localStorage key（按案件隔离）
  function getTutorialKey() {
    return `fun-detective-tutorial-${GameState.currentCaseId}`;
  }

  function isTutorialCompleted() {
    return localStorage.getItem(getTutorialKey()) === '1';
  }

  function markTutorialCompleted() {
    localStorage.setItem(getTutorialKey(), '1');
  }

  // 按案件流程类型返回教程步骤
  function getTutorialSteps() {
    const meta = window.GameData?.meta || {};
    const flowType = meta.flowType || 'investigation-trial';

    if (flowType === 'courtroom-only') {
      // 逆转裁判：纯法庭流程
      return [
        { title: '欢迎来到法庭', content: '你将扮演辩护律师成步堂龙一，通过询问证人、发现矛盾、出示证据，为委托人赢得无罪判决。', target: null },
        { title: '法庭战场', content: '这是你的战场。证人证词是关键，仔细阅读每一句话。', target: 'stage' },
        { title: '证物已备好', content: '案件证物已全部备好，发现矛盾时点击出示证物质证。', target: 'evidence' },
        { title: '询问与异议', content: '阅读证人证词，追问细节，发现矛盾时点击「异议！」并出示证据反驳。', target: 'dialog' },
        { title: '更多工具', content: '时间线、笔记、帮助等辅助工具可以在这里找到。', target: 'more' },
        { title: '准备好了吗？', content: '你的目标是戳穿证人的谎言，找出真凶。开始辩护吧！', target: null }
      ];
    }

    // 默认：investigation-trial 流程（东方快车、血字的研究）
    return [
      { title: '欢迎来到推理审判', content: '你将扮演一名侦探，通过收集证据、询问证人、发现矛盾，最终在审判中揭露真相。', target: null },
      { title: '案发现场', content: '这是案发现场。点击场景中发光的物品和人物进行调查，收集线索。', target: 'stage' },
      { title: '可调查热点', content: '场景中的人物和物品都是可交互热点。点击它们获取证据和证词。', target: 'interactables' },
      { title: '收集证据', content: '收集到的证据会显示在这里。点击可以查看证据详情。', target: 'evidence' },
      { title: '推理笔记', content: '随时记录你的推理笔记。写下关键词可能解锁隐藏内容！', target: 'notebook' },
      { title: '更多工具', content: '时间线、关联板、帮助等工具可以在这里找到。收集足够线索后会解锁更多功能。', target: 'more' },
      { title: '准备好了吗？', content: '调查阶段的目标是收集证据和询问证人。祝你好运，侦探！', target: null }
    ];
  }

  // 视觉高亮：在目标元素周围绘制固定定位的高亮框
  function highlightElement(target) {
    removeHighlight();
    if (!target) return;
    const el = getTourElement(target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.id = 'tutorial-highlight';
    highlight.style.cssText = `
      position: fixed;
      left: ${rect.left - 6}px;
      top: ${rect.top - 6}px;
      width: ${rect.width + 12}px;
      height: ${rect.height + 12}px;
      border: 3px solid var(--game-accent, #f59e0b);
      border-radius: 12px;
      box-shadow: 0 0 20px rgba(245,158,11,0.6), inset 0 0 20px rgba(245,158,11,0.2);
      pointer-events: none;
      z-index: 94;
      transition: all 0.3s ease;
      animation: tutorial-pulse 1.5s ease-in-out infinite;
    `;
    document.body.appendChild(highlight);
  }

  function removeHighlight() {
    const h = document.getElementById('tutorial-highlight');
    if (h) h.remove();
  }

  // 根据 data-tour ID 获取元素，不存在时返回 null 并警告
  function getTourElement(target) {
    if (!target) return null;
    const el = document.querySelector(`[data-tour="${target}"]`);
    if (!el) {
      console.warn(`[GuideUI] 教程目标 data-tour="${target}" 不存在，跳过高亮`);
    }
    return el;
  }

  // 打开新手教程
  function openTutorial() {
    isTutorialOpen = true;
    tutorialStep = 0;
    currentSteps = getTutorialSteps();
    renderTutorial();
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.classList.remove('hidden');
    if (window.AudioManager) AudioManager.playSfx('ui_page');
  }

  // 关闭新手教程
  function closeTutorial() {
    isTutorialOpen = false;
    markTutorialCompleted();
    GameState.state.tutorialCompleted = true;
    GameState.save();
    removeHighlight();
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.classList.add('hidden');
    // 启动进度提示计时器
    startHintTimer();
  }

  // 下一步
  function nextStep() {
    if (tutorialStep < currentSteps.length - 1) {
      tutorialStep++;
      renderTutorial();
      if (window.AudioManager) AudioManager.playSfx('ui_click');
    } else {
      closeTutorial();
    }
  }

  // 上一步
  function prevStep() {
    if (tutorialStep > 0) {
      tutorialStep--;
      renderTutorial();
      if (window.AudioManager) AudioManager.playSfx('ui_click');
    }
  }

  // 渲染教程
  function renderTutorial() {
    const step = currentSteps[tutorialStep];
    if (!step) return;
    const container = document.getElementById('tutorial-content');
    if (!container) return;

    // 校验目标元素存在性，不存在则跳过该步骤
    if (step.target) {
      const el = getTourElement(step.target);
      if (el) {
        // 滚动到元素位置，确保在视口内
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        // 延迟高亮，等待滚动完成
        setTimeout(() => highlightElement(step.target), 300);
      } else {
        removeHighlight();
      }
    } else {
      removeHighlight();
    }

    container.innerHTML = `
      <div class="text-center">
        <div class="text-amber-400 text-sm mb-2">教程 ${tutorialStep + 1}/${currentSteps.length}</div>
        <h3 class="text-xl font-bold mb-4">${step.title}</h3>
        <p class="text-stone-300 mb-6">${step.content}</p>
        <div class="flex items-center justify-center gap-3">
          ${tutorialStep > 0 ? `
            <button onclick="GuideUI.prevStep()" class="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded game-button">上一步</button>
          ` : ''}
          <button onclick="GuideUI.nextStep()" class="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded font-bold game-button">
            ${tutorialStep === currentSteps.length - 1 ? '开始游戏' : '下一步'}
          </button>
          <button onclick="GuideUI.closeTutorial()" class="px-4 py-2 text-stone-400 hover:text-white game-button">跳过教程</button>
        </div>
      </div>
    `;
  }

  // 获取当前目标
  function getCurrentObjective() {
    const caseData = window.GameData || {};
    const objectives = caseData.objectives || [];
    const state = GameState.state;
    const phase = state.gamePhase;

    // 找到当前阶段未完成的目标
    for (const obj of objectives) {
      if (obj.phase !== phase) continue;
      if (state.completedObjectives.includes(obj.id)) continue;
      return obj;
    }
    return null;
  }

  // 检查目标完成
  function checkObjectives() {
    const obj = getCurrentObjective();
    if (!obj) return;

    const state = GameState.state;
    let completed = false;

    switch (obj.type) {
      case 'collect_evidence':
        completed = state.collectedEvidence.length >= obj.target;
        break;
      case 'interview_witness':
        completed = state.interviewedWitnesses.length >= obj.target;
        break;
      case 'open_notebook':
        completed = state.notebookOpened === true;
        break;
      case 'find_contradiction':
        completed = (state.contradictionsFound || []).length >= obj.target;
        break;
      case 'find_relation':
        // 建立关联假设：统计正确且未被排除的证据关联数量
        try {
          const links = (typeof PlayerData !== 'undefined' && PlayerData.getEvidenceLinks)
            ? PlayerData.getEvidenceLinks()
            : (window.PlayerData ? window.PlayerData.getEvidenceLinks() : []);
          const correctActive = (links || []).filter(l => l.isCorrect && !l.excluded).length;
          completed = correctActive >= obj.target;
        } catch (e) {
          completed = false;
        }
        break;
      case 'enter_trial':
        completed = state.gamePhase === 'trial';
        break;
      case 'question_all_witnesses':
        completed = state.interviewedWitnesses.length >= (window.GameData?.witnesses?.length || 0);
        break;
      case 'present_evidence':
        completed = (state.evidencePresented || 0) >= obj.target;
        break;
      case 'phase':
        // phase 类型：intro 阶段目标在离开 intro 时完成；trial 阶段目标在进入 closing 时完成
        if (obj.phase === 'intro') {
          completed = state.gamePhase !== 'intro';
        } else if (obj.phase === 'trial') {
          completed = state.trialPhase === 'closing' || state.gamePhase === 'ending';
        }
        break;
      case 'witness':
        // witness 类型：询问指定证人后完成
        completed = obj.witnessId && state.interviewedWitnesses.includes(obj.witnessId);
        break;
      case 'contradiction':
        // contradiction 类型：发现任意矛盾后完成
        completed = (state.contradictionsFound || []).length > 0;
        break;
      case 'evidence':
        // evidence 类型：收集或出示指定证据后完成
        if (obj.evidenceId) {
          completed = state.collectedEvidence.includes(obj.evidenceId) ||
            (state.evidencePresented || 0) > 0;
        } else {
          completed = (state.evidencePresented || 0) > 0;
        }
        break;
    }

    if (completed && !state.completedObjectives.includes(obj.id)) {
      state.completedObjectives.push(obj.id);
      state.currentObjective = null;
      GameState.save();
      if (window.GameUI) {
        GameUI.showToast(`目标完成：${obj.title}`, 'success', 2500);
      }
      if (window.AudioManager) AudioManager.playSfx('collect_reveal');
    }
  }

  // 渲染当前目标
  function renderObjective() {
    const container = document.getElementById('objective-display');
    if (!container) return;

    const obj = getCurrentObjective();
    if (!obj) {
      container.innerHTML = '';
      return;
    }

    const state = GameState.state;
    let progress = '';

    switch (obj.type) {
      case 'collect_evidence':
        progress = `${state.collectedEvidence.length}/${obj.target}`;
        break;
      case 'interview_witness':
        progress = `${state.interviewedWitnesses.length}/${obj.target}`;
        break;
      case 'find_contradiction':
        progress = `${(state.contradictionsFound || []).length}/${obj.target}`;
        break;
      case 'find_relation':
        try {
          const links = (typeof PlayerData !== 'undefined' && PlayerData.getEvidenceLinks)
            ? PlayerData.getEvidenceLinks()
            : (window.PlayerData ? window.PlayerData.getEvidenceLinks() : []);
          const correctActive = (links || []).filter(l => l.isCorrect && !l.excluded).length;
          progress = `${correctActive}/${obj.target}`;
        } catch (e) {
          progress = `0/${obj.target}`;
        }
        break;
      case 'present_evidence':
        progress = `${state.evidencePresented || 0}/${obj.target}`;
        break;
    }

    container.innerHTML = `
      <div class="flex items-center gap-2 px-3 py-1 bg-blue-900/50 border border-blue-700 rounded text-xs cursor-pointer hover:bg-blue-900/70" onclick="GuideUI.showObjectiveDetail()">
        <span class="text-blue-400">🎯</span>
        <span class="text-blue-200">${obj.title}</span>
        ${progress ? `<span class="text-blue-400 font-bold">${progress}</span>` : ''}
      </div>
    `;
  }

  // 显示目标详情
  function showObjectiveDetail() {
    const obj = getCurrentObjective();
    if (!obj) return;
    if (window.GameUI) {
      GameUI.showDialog({
        speaker: '侦探助手',
        color: '#3b82f6',
        text: `【当前目标】${obj.title}\n\n${obj.description}\n\n💡 提示：${obj.hint}`
      });
    }
  }

  // 启动进度提示计时器
  function startHintTimer() {
    if (hintTimer) clearInterval(hintTimer);
    hintTimer = setInterval(() => {
      const state = GameState.state;
      if (state.tutorialCompleted && state.gamePhase === 'investigation') {
        const timeSinceLastAction = Date.now() - (state.lastActionTime || Date.now());
        if (timeSinceLastAction > 60000) {  // 60秒无操作
          showProgressHint();
          state.lastActionTime = Date.now();
          GameState.save();
        }
      }
    }, 10000);
  }

  // 显示进度提示
  function showProgressHint() {
    const state = GameState.state;
    const caseData = window.GameData || {};
    const mainLoop = caseData.meta?.mainLoop;
    const obj = getCurrentObjective();

    let hint = '';
    if (obj) {
      hint = obj.hint;
    } else if (state.collectedEvidence.length < 2) {
      hint = '试试切换场景，收集更多证据吧。';
    } else if (state.interviewedWitnesses.length < 2) {
      hint = '去询问证人吧，他们的证词中可能藏有矛盾。';
    } else if (mainLoop && mainLoop.hint && state.gamePhase === 'investigation') {
      // 使用案件主循环提示
      hint = mainLoop.hint;
    } else {
      hint = '整理一下你的笔记，然后准备进入审判吧！';
    }

    if (window.GameUI) {
      GameUI.showToast(`💡 ${hint}`, 'info', 4000);
    }
  }

  // 更新最后操作时间
  function updateLastAction() {
    GameState.state.lastActionTime = Date.now();
    GameState.save();
  }

  // 初始化
  function init() {
    // 检查是否需要显示教程（使用独立 localStorage 标记，按案件隔离）
    if (!isTutorialCompleted()) {
      setTimeout(() => openTutorial(), 800);
    } else {
      GameState.state.tutorialCompleted = true;
      startHintTimer();
    }
  }

  return {
    init,
    openTutorial,
    closeTutorial,
    nextStep,
    prevStep,
    renderObjective,
    checkObjectives,
    showObjectiveDetail,
    showProgressHint,
    updateLastAction,
    getTourElement,
    getTutorialSteps,
    highlightElement,
    removeHighlight,
    isTutorialCompleted,
    markTutorialCompleted
  };
})();

window.GuideUI = GuideUI;
