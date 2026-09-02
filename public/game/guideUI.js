/**
 * 游戏引导系统UI模块
 * 负责：新手教程、任务目标、进度提示
 * 依赖：GameState, GameUI, AudioManager
 */

const GuideUI = (function() {
  let tutorialStep = 0;
  let isTutorialOpen = false;
  let hintTimer = null;

  // 新手教程步骤
  const tutorialSteps = [
    {
      title: '欢迎来到推理审判',
      content: '你将扮演一名侦探，通过收集证据、询问证人、发现矛盾，最终在审判中揭露真相。',
      highlight: null
    },
    {
      title: '切换场景',
      content: '点击顶部的场景标签可以切换不同的调查地点。每个场景都可能藏有重要线索。',
      highlight: '#scene-tabs'
    },
    {
      title: '收集证据',
      content: '点击场景中的物品可以收集证据。收集到的证据会显示在底部证据栏。',
      highlight: '#evidence-bar'
    },
    {
      title: '询问证人',
      content: '点击证人卡片可以与他们对话。注意他们的证词，矛盾往往藏在细节中。',
      highlight: '#witness-list'
    },
    {
      title: '使用笔记',
      content: '点击顶部"笔记"按钮记录你的推理。写下关键词可能解锁隐藏内容！',
      highlight: '#notebook-btn'
    },
    {
      title: '进入审判',
      content: '收集足够证据后，点击"进入审判"开始质询。在审判中出示证据，揭露矛盾！',
      highlight: '#trial-btn'
    },
    {
      title: '准备好了吗？',
      content: '调查阶段的目标是收集证据和询问证人。祝你好运，侦探！',
      highlight: null
    }
  ];

  // 打开新手教程
  function openTutorial() {
    isTutorialOpen = true;
    tutorialStep = 0;
    renderTutorial();
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.classList.remove('hidden');
    if (window.AudioManager) AudioManager.playSfx('ui_page');
  }

  // 关闭新手教程
  function closeTutorial() {
    isTutorialOpen = false;
    GameState.state.tutorialCompleted = true;
    GameState.save();
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.classList.add('hidden');
    // 启动进度提示计时器
    startHintTimer();
  }

  // 下一步
  function nextStep() {
    if (tutorialStep < tutorialSteps.length - 1) {
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
    const step = tutorialSteps[tutorialStep];
    const container = document.getElementById('tutorial-content');
    if (!container) return;

    container.innerHTML = `
      <div class="text-center">
        <div class="text-amber-400 text-sm mb-2">教程 ${tutorialStep + 1}/${tutorialSteps.length}</div>
        <h3 class="text-xl font-bold mb-4">${step.title}</h3>
        <p class="text-stone-300 mb-6">${step.content}</p>
        <div class="flex items-center justify-center gap-3">
          ${tutorialStep > 0 ? `
            <button onclick="GuideUI.prevStep()" class="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded">上一步</button>
          ` : ''}
          <button onclick="GuideUI.nextStep()" class="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded font-bold">
            ${tutorialStep === tutorialSteps.length - 1 ? '开始游戏' : '下一步'}
          </button>
          <button onclick="GuideUI.closeTutorial()" class="px-4 py-2 text-stone-400 hover:text-white">跳过</button>
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
      case 'enter_trial':
        completed = state.gamePhase === 'trial';
        break;
      case 'question_all_witnesses':
        completed = state.interviewedWitnesses.length >= (window.GameData?.witnesses?.length || 0);
        break;
      case 'present_evidence':
        completed = (state.evidencePresented || 0) >= obj.target;
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
    const obj = getCurrentObjective();

    let hint = '';
    if (obj) {
      hint = obj.hint;
    } else if (state.collectedEvidence.length < 3) {
      hint = '试试切换场景，收集更多证据吧。';
    } else if (state.interviewedWitnesses.length < 2) {
      hint = '去询问证人吧，他们的证词中可能藏有矛盾。';
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
    // 检查是否需要显示教程
    if (!GameState.state.tutorialCompleted) {
      setTimeout(() => openTutorial(), 500);
    } else {
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
    updateLastAction
  };
})();

window.GuideUI = GuideUI;
