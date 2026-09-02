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

  // 游戏状态
  let state = {
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
    tutorialCompleted: false,  // 新手教程是否完成
    currentObjective: null,    // 当前目标ID
    completedObjectives: [],   // 已完成的目标ID
    lastActionTime: Date.now(), // 最后操作时间（用于进度提示）
    // 内容深度系统
    gameStartTime: Date.now(),  // 游戏开始时间
    achievementsUnlocked: [],   // 已解锁成就ID
    endingReached: null,        // 达成的结局ID
    evidencePresented: 0,       // 审判中出示证据次数
    notebookOpened: false       // 笔记是否已打开（用于目标系统）
  };

  // 存档key（包含案件ID，实现存档隔离）
  const SAVE_KEY = `fun-detective-save-${currentCaseId}`;

  // 动态加载案件数据
  let _isLoadingCase = false;
  function loadCaseData(caseId, callback) {
    // 先检查是否已加载正确的案件
    if (window.GameData && window.GameData.meta && window.GameData.meta.id === caseId) {
      callback();
      return;
    }
    // 防止重复加载
    if (_isLoadingCase) {
      console.warn('案件数据正在加载中，忽略重复请求');
      return;
    }
    // 从案件配置中查找数据文件
    const caseConfig = (window.GameCases || []).find(c => c.id === caseId);
    if (!caseConfig) {
      console.error('未找到案件配置:', caseId);
      alert('案件不存在');
      window.location.href = '/fun_detective/game-design/prototype/';
      return;
    }
    // 清除旧的案件数据，防止污染
    window.GameData = null;
    _isLoadingCase = true;
    // 动态创建script标签加载
    const script = document.createElement('script');
    script.src = caseConfig.dataFile + '?v=' + Date.now(); // 防缓存
    script.onload = () => {
      _isLoadingCase = false;
      // 验证加载的案件ID是否匹配
      if (window.GameData && window.GameData.meta && window.GameData.meta.id === caseId) {
        callback();
      } else {
        console.error('案件数据ID不匹配:', window.GameData?.meta?.id, '期望:', caseId);
        alert('案件数据加载异常，请刷新页面');
      }
    };
    script.onerror = () => {
      _isLoadingCase = false;
      console.error('案件数据加载失败:', caseConfig.dataFile);
      alert('案件数据加载失败');
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

    // 检查是否继续游戏
    if (urlParams.get('continue') === '1') {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        state = JSON.parse(saved);
      }
    } else {
      localStorage.removeItem(SAVE_KEY);
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
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
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
    setState
  };
})();

window.GameState = GameState;
