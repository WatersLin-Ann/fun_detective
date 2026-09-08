/**
 * 结局系统UI模块
 * 负责：结局展示、评级、通关统计、成就解锁
 * 依赖：GameState, GameUI, AudioManager
 */

const EndingUI = (function() {
  // 计算结局评级（基于核心论证链完成度 + 矛盾发现 + 信心值）
  function calculateEnding() {
    const state = GameState.state;
    const caseData = window.GameData || {};
    const endings = caseData.endings || [];

    // 如果最终选择错误，直接D级
    if (state.wrongChoice) {
      return endings.find(e => e.grade === 'D') || endings[endings.length - 1];
    }

    // 计算核心论证链完成度
    const playerLinks = (window.PlayerData && PlayerData.getEvidenceLinks()) || [];
    const correctLinks = playerLinks.filter(l => l.isCorrect && !l.excluded);
    const coreLinkIds = caseData.meta?.coreLinkIds || [];
    const coreLinksCompleted = coreLinkIds.filter(id => correctLinks.some(l => l.presetId === id)).length;
    const coreCompletionRate = coreLinkIds.length > 0 ? coreLinksCompleted / coreLinkIds.length : 0;

    // 矛盾发现数
    const contradictionCount = (state.contradictionsFound || []).length;
    const minContradictions = caseData.meta?.minContradictions || 1;

    // 信心值
    const confidence = state.confidence || 0;

    // 综合评分：核心链40% + 矛盾30% + 信心30%
    const contradictionRate = Math.min(1, contradictionCount / Math.max(minContradictions, 1));
    const confidenceRate = confidence / 100;
    const compositeScore = (coreCompletionRate * 0.4) + (contradictionRate * 0.3) + (confidenceRate * 0.3);

    // 评级规则
    let grade;
    if (coreCompletionRate >= 1.0 && contradictionCount >= minContradictions && compositeScore >= 0.85) {
      grade = 'S';
    } else if (coreCompletionRate >= 0.66 && contradictionCount >= 1 && compositeScore >= 0.7) {
      grade = 'A';
    } else if (coreCompletionRate >= 0.33 && compositeScore >= 0.5) {
      grade = 'B';
    } else if (compositeScore >= 0.3) {
      grade = 'C';
    } else {
      grade = 'D';
    }

    // 存储评级详情用于显示
    state._gradeDetail = {
      coreLinksCompleted,
      coreLinkTotal: coreLinkIds.length,
      contradictionCount,
      confidence,
      compositeScore: Math.round(compositeScore * 100)
    };

    return endings.find(e => e.grade === grade) || endings[endings.length - 1];
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
          unlocked = (state.contradictionsFound || []).length >= (caseData.contradictions?.length || 0);
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

  // 根据最终选择渲染后日谈
  function renderChoiceEpilogue() {
    const choice = GameState.state.choices?.['final-choice'];
    if (!choice) return '';
    const epilogues = {
      reveal: `<div class="mt-3 pt-3 border-t border-stone-700"><p class="text-xs text-stone-500 mb-1">你的选择：将真相告知警方</p><p class="text-stone-400 text-sm">你向警方如实报告了12人共同作案的事实。正义得到了伸张，但那些失去亲人的乘客们将面临法律的审判。波洛在笔记本上写下："法律不容情，但情亦非罪。"</p></div>`,
      conceal: `<div class="mt-3 pt-3 border-t border-stone-700"><p class="text-xs text-stone-500 mb-1">你的选择：向警方隐瞒真相</p><p class="text-stone-400 text-sm">你告诉警方凶手已从窗户逃走，大雪掩盖了痕迹。12名乘客向你表达了无声的感谢。波洛的内心或许永远不会平静——他第一次让法律让位于人情。</p></div>`
    };
    return epilogues[choice] || '';
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
        ${renderChoiceEpilogue()}
        <p class="text-amber-400 text-sm mt-3 italic">"${ending.detectiveComment}"</p>
      </div>

      <!-- 通关统计 -->
      <div class="bg-stone-900/50 rounded-lg p-4 mb-4">
        <h3 class="font-bold text-sm mb-3 text-stone-300">📊 通关统计</h3>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="flex justify-between"><span class="text-stone-400">游戏时长</span><span class="text-white">${getGameDuration()}</span></div>
          <div class="flex justify-between"><span class="text-stone-400">收集证据</span><span class="text-white">${state.collectedEvidence.length}/${totalEvidence}</span></div>
          <div class="flex justify-between"><span class="text-stone-400">询问证人</span><span class="text-white">${state.interviewedWitnesses.length}/${totalWitnesses}</span></div>
          <div class="flex justify-between"><span class="text-stone-400">发现矛盾</span><span class="text-white">${(state.contradictionsFound || []).length}/${totalContradictions}</span></div>
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
    // 隐藏结局浮层
    const overlay = document.getElementById('ending-overlay');
    if (overlay) overlay.classList.add('hidden');
    // 清除证据栏等残留状态
    if (window.GameState) {
      GameState.state.showEvidenceBar = false;
      GameState.state.evidenceMode = 'view';
      GameState.state.selectedEvidence = null;
    }
    // 调用已存在的重置 API（清除存档 + 重置 state + 重新渲染到开场）
    if (window.GameState && typeof GameState.resetSavedGame === 'function') {
      GameState.resetSavedGame();
    } else {
      // 兜底：直接重载页面
      window.location.reload();
    }
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
