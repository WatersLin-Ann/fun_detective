/**
 * 结局系统UI模块
 * 负责：结局展示、评级、通关统计、成就解锁
 * 依赖：GameState, GameUI, AudioManager
 */

const EndingUI = (function() {
  // 计算结局评级
  function calculateEnding() {
    const state = GameState.state;
    const caseData = window.GameData || {};
    const endings = caseData.endings || [];

    // 如果最终选择错误，直接D级
    if (state.wrongChoice) {
      return endings.find(e => e.grade === 'D') || endings[endings.length - 1];
    }

    // 根据信心值计算评级
    const confidence = state.confidence || 0;
    for (const ending of endings) {
      if (confidence >= ending.minConfidence) {
        return ending;
      }
    }
    return endings[endings.length - 1];
  }

  // 检查成就解锁
  function checkAchievements() {
    const state = GameState.state;
    const caseData = window.GameData || {};
    const achievements = caseData.achievements || [];
    const newlyUnlocked = [];

    achievements.forEach(ach => {
      if (state.achievementsUnlocked.includes(ach.id)) return;

      let unlocked = false;
      switch (ach.condition) {
        case 'complete':
          unlocked = state.gamePhase === 'ending';
          break;
        case 'all_evidence':
          unlocked = state.collectedEvidence.length >= (caseData.evidence?.length || 0);
          break;
        case 'all_witnesses':
          unlocked = state.interviewedWitnesses.length >= (caseData.witnesses?.length || 0);
          break;
        case 'all_contradictions':
          unlocked = (state.foundContradictions || []).length >= (caseData.contradictions?.length || 0);
          break;
        case 'all_timeline_contradictions':
          unlocked = (state.timelineContradictionsFound || []).length >= (caseData.timelineContradictions?.length || 0);
          break;
        case 'all_keywords':
          unlocked = (state.discoveredKeywords || []).length >= (caseData.noteKeywords?.length || 0);
          break;
        case 's_ending':
          unlocked = state.endingReached === 'ending-s';
          break;
        case 'all_links':
          const playerLinks = window.PlayerData ? PlayerData.getEvidenceLinks() : [];
          unlocked = playerLinks.length >= (caseData.presetLinks?.length || 0);
          break;
      }

      if (unlocked) {
        state.achievementsUnlocked.push(ach.id);
        newlyUnlocked.push(ach);
      }
    });

    GameState.save();
    return newlyUnlocked;
  }

  // 计算游戏时长
  function getGameDuration() {
    const state = GameState.state;
    const startTime = state.gameStartTime || Date.now();
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}分${seconds}秒`;
  }

  // 显示结局页面
  function showEnding() {
    const state = GameState.state;
    const ending = calculateEnding();
    state.endingReached = ending.id;
    state.gamePhase = 'ending';
    GameState.save();

    // 检查成就
    const newAchievements = checkAchievements();

    // 播放结局音效
    if (window.AudioManager) {
      if (ending.grade === 'S' || ending.grade === 'A') {
        AudioManager.playSfx('trial_success');
      } else {
        AudioManager.playSfx('trial_fail');
      }
    }

    renderEnding(ending, newAchievements);
    const overlay = document.getElementById('ending-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  // 渲染结局页面
  function renderEnding(ending, newAchievements) {
    const state = GameState.state;
    const caseData = window.GameData || {};
    const container = document.getElementById('ending-content');
    if (!container) return;

    const totalEvidence = caseData.evidence?.length || 0;
    const totalWitnesses = caseData.witnesses?.length || 0;
    const totalContradictions = caseData.contradictions?.length || 0;
    const totalTimeline = caseData.timeline?.length || 0;
    const totalKeywords = caseData.noteKeywords?.length || 0;
    const totalLinks = caseData.presetLinks?.length || 0;
    const playerLinks = window.PlayerData ? PlayerData.getEvidenceLinks().length : 0;

    const rarityColors = {
      '普通': 'text-stone-400',
      '稀有': 'text-blue-400',
      '史诗': 'text-purple-400',
      '传说': 'text-amber-400'
    };

    container.innerHTML = `
      <div class="text-center mb-6">
        <div class="text-8xl font-black mb-2" style="color: ${ending.color}; text-shadow: 0 0 30px ${ending.color};">
          ${ending.grade}
        </div>
        <h2 class="text-2xl font-bold mb-2">${ending.title}</h2>
        <p class="text-stone-400 text-sm mb-4">最终信心值：<span class="text-amber-400 font-bold">${state.confidence}</span></p>
      </div>

      <div class="bg-stone-900/50 rounded-lg p-4 mb-4">
        <p class="text-stone-300 text-sm leading-relaxed">${ending.description}</p>
        <p class="text-amber-400 text-sm mt-3 italic">"${ending.detectiveComment}"</p>
      </div>

      <!-- 通关统计 -->
      <div class="bg-stone-900/50 rounded-lg p-4 mb-4">
        <h3 class="font-bold text-sm mb-3 text-stone-300">📊 通关统计</h3>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="flex justify-between"><span class="text-stone-400">游戏时长</span><span class="text-white">${getGameDuration()}</span></div>
          <div class="flex justify-between"><span class="text-stone-400">收集证据</span><span class="text-white">${state.collectedEvidence.length}/${totalEvidence}</span></div>
          <div class="flex justify-between"><span class="text-stone-400">询问证人</span><span class="text-white">${state.interviewedWitnesses.length}/${totalWitnesses}</span></div>
          <div class="flex justify-between"><span class="text-stone-400">发现矛盾</span><span class="text-white">${(state.foundContradictions || []).length}/${totalContradictions}</span></div>
          <div class="flex justify-between"><span class="text-stone-400">证据关联</span><span class="text-white">${playerLinks}/${totalLinks}</span></div>
          <div class="flex justify-between"><span class="text-stone-400">时间线事件</span><span class="text-white">${(state.discoveredTimeline || []).length}/${totalTimeline}</span></div>
          <div class="flex justify-between"><span class="text-stone-400">关键词</span><span class="text-white">${(state.discoveredKeywords || []).length}/${totalKeywords}</span></div>
          <div class="flex justify-between"><span class="text-stone-400">出示证据</span><span class="text-white">${state.evidencePresented || 0}次</span></div>
        </div>
      </div>

      <!-- 新解锁成就 -->
      ${newAchievements.length > 0 ? `
        <div class="bg-amber-900/20 border border-amber-700 rounded-lg p-4 mb-4">
          <h3 class="font-bold text-sm mb-3 text-amber-400">🏆 新解锁成就</h3>
          ${newAchievements.map(ach => `
            <div class="flex items-center justify-between py-1">
              <span class="text-white text-sm">${ach.name}</span>
              <span class="text-xs ${rarityColors[ach.rarity] || 'text-stone-400'}">${ach.rarity}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- 重玩鼓励 -->
      <div class="text-center">
        <p class="text-stone-400 text-xs mb-4">
          还有 ${5 - ['S','A','B','C','D'].indexOf(ending.grade)} 个结局未解锁，
          ${(caseData.achievements?.length || 0) - state.achievementsUnlocked.length} 个成就未获得
        </p>
        <div class="flex gap-3 justify-center">
          <button onclick="EndingUI.replay()" class="px-6 py-2 bg-amber-600 hover:bg-amber-500 rounded font-bold">
            再玩一次
          </button>
          <button onclick="EndingUI.backToMenu()" class="px-6 py-2 bg-stone-700 hover:bg-stone-600 rounded">
            返回案件选择
          </button>
        </div>
      </div>
    `;
  }

  // 重新开始
  function replay() {
    const overlay = document.getElementById('ending-overlay');
    if (overlay) overlay.classList.add('hidden');
    GameState.reset();
    GameState.init();
    if (window.GameRender) GameRender.render();
  }

  // 返回案件选择
  function backToMenu() {
    window.location.href = '/fun_detective/game-design/prototype/';
  }

  return {
    showEnding,
    calculateEnding,
    checkAchievements,
    replay,
    backToMenu
  };
})();

window.EndingUI = EndingUI;
