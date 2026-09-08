/**
 * 游戏状态管理模块
 * 负责：状态定义、存档、初始化、案件数据加载
 */

const GameState = (function() {
  // 获取案件ID
  const urlParams = new URLSearchParams(window.location.search);
  const currentCaseId = urlParams.get('case') || 'orient-express';

  // 游戏数据（动态加载后赋值）
  let gameScenes, gameEvidence, gameWitnesses, gameDialogs, gameContradictions;

  // 创建完整初始状态（首次初始化与复玩重置共享，确保字段一致）
  function createInitialState() {
    return {
      currentScene: 'intro',
      gamePhase: 'intro',
      collectedEvidence: [],
      interviewedWitnesses: [],
      contradictionsFound: [],
      confidence: 100,
      choices: {},
      dialogIndex: 0,
      currentWitness: null,
      showEvidenceBar: false,
      selectedEvidence: null,
      evidenceMode: 'view',
      dialogueHistory: [],
      witnessReaction: 'normal',
      showHistory: false,
      isTransitioning: false,
      // 审判阶段新增状态
      trialPhase: 'opening',  // opening | questioning | closing | verdict
      currentWitnessIndex: 0,
      witnessStates: {},  // { witnessId: { questioned, followedUp, contradicted, emotion } }
      objectionActive: false,  // 异议动画是否激活
      // 时间线系统
      discoveredTimeline: [],  // 已发现的时间线事件ID
      timelineContradictionsFound: [],  // 已发现的时间线矛盾ID
      // 笔记关键词系统
      discoveredKeywords: [],  // 已发现的关键词ID
      // 游戏引导系统
      tutorialCompleted: false,  // 新手教程是否完成（实际持久化在 localStorage，此处为运行时镜像）
      currentObjective: null,    // 当前目标ID
      completedObjectives: [],   // 已完成的目标ID
      lastActionTime: Date.now(), // 最后操作时间（用于进度提示）
      // 内容深度系统
      gameStartTime: Date.now(),  // 游戏开始时间
      achievementsUnlocked: [],   // 已解锁成就ID（本局内解锁记录）
      endingReached: null,        // 达成的结局ID
      evidencePresented: 0,       // 审判中出示证据次数
      notebookOpened: false,      // 笔记是否已打开（用于目标系统）
      pendingSaveChoice: false    // 是否等待用户选择继续/重新开始
    };
  }

  // 游戏状态
  let state = createInitialState();

  // 存档key（包含案件ID，实现存档隔离）
  const SAVE_KEY = `fun-detective-save-${currentCaseId}`;

  // 动态加载案件数据
  let _isLoadingCase = false;
  let _loadTimeout = null;

  // 显示加载态
  function showLoading(caseName) {
    const loading = document.getElementById('game-loading');
    const errorPanel = document.getElementById('game-error');
    if (loading) {
      loading.style.display = 'flex';
    }
    if (errorPanel) {
      errorPanel.style.display = 'none';
      errorPanel.classList.add('hidden');
    }
    const nameEl = document.getElementById('loading-case-name');
    if (nameEl && caseName) {
      nameEl.textContent = `正在准备案件：${caseName}…`;
    }
  }

  // 隐藏加载态
  function hideLoading() {
    const loading = document.getElementById('game-loading');
    if (loading) {
      loading.style.opacity = '0';
      loading.style.transition = 'opacity 0.3s ease';
      setTimeout(() => { loading.style.display = 'none'; loading.style.opacity = '1'; }, 300);
    }
  }

  // 显示错误面板
  function showErrorPanel(message) {
    const loading = document.getElementById('game-loading');
    const errorPanel = document.getElementById('game-error');
    const msgEl = document.getElementById('error-message');
    if (loading) loading.style.display = 'none';
    if (errorPanel) {
      errorPanel.classList.remove('hidden');
      errorPanel.style.display = 'flex';
    }
    if (msgEl) msgEl.textContent = message || '未知错误';
  }

  // 绑定错误面板按钮（只绑定一次）
  let _errorButtonsBound = false;
  function bindErrorButtons(caseId, callback) {
    if (_errorButtonsBound) return;
    const retryBtn = document.getElementById('error-retry');
    const backBtn = document.getElementById('error-back');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        loadCaseData(caseId, callback);
      });
    }
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = '/fun_detective/game-design/prototype/';
      });
    }
    _errorButtonsBound = true;
  }

  function loadCaseData(caseId, callback) {
    // 先检查是否已加载正确的案件
    if (window.GameData && window.GameData.meta && window.GameData.meta.id === caseId) {
      hideLoading();
      callback();
      return;
    }
    // 防止重复加载
    if (_isLoadingCase) {
      console.warn('案件数据正在加载中，忽略重复请求');
      return;
    }

    // 绑定错误面板按钮
    bindErrorButtons(caseId, callback);

    // 从案件配置中查找数据文件
    const caseConfig = (window.GameCases || []).find(c => c.id === caseId);
    if (!caseConfig) {
      console.error('未找到案件配置:', caseId);
      showErrorPanel(`未找到案件「${caseId}」，请返回案件列表重新选择。`);
      return;
    }

    // 显示加载态
    showLoading(caseConfig.name);

    // 清除旧的案件数据，防止污染
    window.GameData = null;
    _isLoadingCase = true;

    // 8秒加载超时保护
    if (_loadTimeout) clearTimeout(_loadTimeout);
    _loadTimeout = setTimeout(() => {
      if (_isLoadingCase) {
        _isLoadingCase = false;
        console.error('案件数据加载超时:', caseConfig.dataFile);
        showErrorPanel('加载超时，请检查网络连接后重试。');
      }
    }, 8000);

    // 动态创建script标签加载
    const script = document.createElement('script');
    script.src = caseConfig.dataFile + '?v=' + Date.now(); // 防缓存
    script.onload = () => {
      if (_loadTimeout) { clearTimeout(_loadTimeout); _loadTimeout = null; }
      _isLoadingCase = false;
      // 验证加载的案件ID是否匹配
      if (window.GameData && window.GameData.meta && window.GameData.meta.id === caseId) {
        // 确保 loading 至少显示 300ms 避免闪烁
        setTimeout(() => {
          hideLoading();
          callback();
        }, 300);
      } else {
        console.error('案件数据ID不匹配:', window.GameData?.meta?.id, '期望:', caseId);
        showErrorPanel('案件数据异常，请刷新页面重试。');
      }
    };
    script.onerror = () => {
      if (_loadTimeout) { clearTimeout(_loadTimeout); _loadTimeout = null; }
      _isLoadingCase = false;
      console.error('案件数据加载失败:', caseConfig.dataFile);
      showErrorPanel(`案件数据加载失败：${caseConfig.dataFile}。请检查网络后重试。`);
    };
    document.head.appendChild(script);
  }

  // 初始化
  function init() {
    // 从已加载的案件数据中获取
    const caseData = window.GameData;
    if (!caseData) {
      console.error('案件数据未加载');
      return;
    }
    gameScenes = caseData.scenes;
    gameEvidence = caseData.evidence;
    gameWitnesses = caseData.witnesses;
    gameDialogs = caseData.dialogs;
    gameContradictions = caseData.contradictions;

    // 暴露游戏数据到全局
    window._gameEvidence = gameEvidence;
    window._gameWitnesses = gameWitnesses;
    window._gameData = caseData;

    // 设置玩家数据的案件ID（存档隔离）
    if (window.PlayerData && PlayerData.setCaseId) {
      PlayerData.setCaseId(currentCaseId);
    }

    // 初始化音效系统
    if (window.AudioManager) {
      AudioManager.init();
      if (window.AudioConfig) {
        AudioManager.setMasterVolume(AudioConfig.settings.masterVolume);
        AudioManager.setBgmVolume(AudioConfig.settings.bgmVolume);
        AudioManager.setSfxVolume(AudioConfig.settings.sfxVolume);
      }
    }

    // 检查存档：默认保留，显示继续/重新开始选择
    const hasSave = !!localStorage.getItem(SAVE_KEY);
    const forceReset = urlParams.get('reset') === '1';
    if (urlParams.get('continue') === '1' && hasSave) {
      // 明确选择继续：合并到现有 state，不替换引用
      try {
        Object.assign(state, JSON.parse(localStorage.getItem(SAVE_KEY)));
      } catch (e) {
        console.error('存档解析失败:', e);
      }
      state.pendingSaveChoice = false;
    } else if (forceReset) {
      // 明确选择重新开始
      localStorage.removeItem(SAVE_KEY);
      state.pendingSaveChoice = false;
    } else if (hasSave) {
      // 有存档但未明确选择，暂停并等待用户选择
      state.pendingSaveChoice = true;
    } else {
      state.pendingSaveChoice = false;
    }

    // 初始化证人状态（兼容旧存档）
    if (!state.witnessStates) {
      state.witnessStates = {};
    }
    if (gameWitnesses) {
      gameWitnesses.forEach(w => {
        if (!state.witnessStates[w.id]) {
          state.witnessStates[w.id] = {
            questioned: false,
            followedUp: false,
            contradicted: false,
            emotion: 'normal'
          };
        }
      });
    }
    if (!state.trialPhase) state.trialPhase = 'opening';
    if (!state.currentWitnessIndex) state.currentWitnessIndex = 0;
    if (state.objectionActive === undefined) state.objectionActive = false;

    // 暴露游戏状态到全局
    window._gameState = state;

    // 调用渲染
    if (window.GameRender) {
      GameRender.render();
    }
  }

  // 保存
  function save() {
    if (!state.pendingSaveChoice) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    }
  }

  // 获取存档摘要信息
  function getSaveInfo() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;
    try {
      const data = JSON.parse(saved);
      return {
        gamePhase: data.gamePhase || 'intro',
        currentScene: data.currentScene || 'intro',
        collectedEvidence: data.collectedEvidence || [],
        interviewedWitnesses: data.interviewedWitnesses || [],
        dialogIndex: data.dialogIndex || 0
      };
    } catch (e) {
      return null;
    }
  }

  // 继续存档
  function continueSavedGame() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const savedData = JSON.parse(saved);
        // 用 Object.assign 合并到现有 state 对象，不替换引用
        // 否则外部持有的 GameState.state 仍指向旧对象，pendingSaveChoice 不会更新
        Object.assign(state, savedData);
      } catch (e) {
        console.error('存档解析失败:', e);
      }
    }
    state.pendingSaveChoice = false;
    window._gameState = state;
    if (window.GameRender) GameRender.render();
  }

  // 重置存档（重新开始）——全量重置所有局内状态
  function resetSavedGame() {
    localStorage.removeItem(SAVE_KEY);

    // 全量重置：用初始状态覆盖所有字段，避免遗漏
    const initial = createInitialState();
    Object.keys(state).forEach(key => {
      delete state[key];
    });
    Object.assign(state, initial);

    // 教程完成标记持久化在 localStorage（按案件隔离），复玩时不重复弹出教程
    try {
      const tutorialKey = `fun-detective-tutorial-${currentCaseId}`;
      if (localStorage.getItem(tutorialKey) === '1') {
        state.tutorialCompleted = true;
      }
    } catch (e) { /* 忽略 localStorage 异常 */ }

    // 清除本局证据关联数据（PlayerData 中按案件存储的关联记录）
    try {
      if (window.PlayerData && typeof PlayerData.clearEvidenceLinks === 'function') {
        PlayerData.clearEvidenceLinks();
      }
    } catch (e) { /* 忽略 */ }

    // 重新初始化证人状态（确保所有证人都有默认状态条目）
    if (gameWitnesses) {
      gameWitnesses.forEach(w => {
        state.witnessStates[w.id] = {
          questioned: false,
          followedUp: false,
          contradicted: false,
          emotion: 'normal'
        };
      });
    }

    window._gameState = state;
    if (window.GameRender) GameRender.render();
  }

  // 获取游戏数据
  function getGameData() {
    const gd = window.GameData || {};
    // 返回完整案件数据，同时保留 game* 别名兼容现有代码
    return {
      // 原始字段名
      ...gd,
      // game* 别名（兼容现有调用方）
      gameScenes: gd.scenes || gameScenes,
      gameEvidence: gd.evidence || gameEvidence,
      gameWitnesses: gd.witnesses || gameWitnesses,
      gameDialogs: gd.dialogs || gameDialogs,
      gameContradictions: gd.contradictions || gameContradictions,
      gameTimeline: gd.timeline,
      gameTimelineContradictions: gd.timelineContradictions,
      gameObjectives: gd.objectives,
      gameEndings: gd.endings,
      gameAchievements: gd.achievements,
      gameNoteKeywords: gd.noteKeywords,
      gamePresetLinks: gd.presetLinks,
      gameWitnessColors: gd.witnessColors,
      gameTrialOpening: gd.trialOpening,
      gameMeta: gd.meta
    };
  }

  // 获取状态
  function getState() {
    return state;
  }

  // 更新状态
  function setState(partial) {
    Object.assign(state, partial);
    save();
  }

  return {
    currentCaseId,
    state,
    loadCaseData,
    init,
    save,
    getGameData,
    getState,
    setState,
    showLoading,
    hideLoading,
    showErrorPanel,
    getSaveInfo,
    continueSavedGame,
    resetSavedGame
  };
})();

window.GameState = GameState;
