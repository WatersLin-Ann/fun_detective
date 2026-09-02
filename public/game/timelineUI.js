/**
 * 时间线系统UI模块
 * 负责：时间线展示、时间线索收集、矛盾检测
 * 依赖：GameState, GameUI, AudioManager
 */

const TimelineUI = (function() {
  let isOpen = false;

  // 收集时间线索
  function discoverTimelineEvent(eventId) {
    const state = GameState.state;
    if (state.discoveredTimeline.includes(eventId)) return false;

    const caseData = GameState.getGameData();
    const timeline = caseData.gameData?.timeline || window.GameData?.timeline || [];
    const event = timeline.find(t => t.id === eventId);
    if (!event) return false;

    state.discoveredTimeline.push(eventId);
    GameState.save();

    // 播放收集动画和音效
    if (window.AudioManager) AudioManager.playSfx('collect_evidence');
    if (window.GameUI) {
      GameUI.showToast(`发现时间线索：${event.time} ${event.title}`, 'success', 2500);
    }

    // 自动记录到笔记
    if (window.PlayerData) {
      PlayerData.addNotebookItem('clues', `【时间线】${event.time} ${event.title}：${event.description}`);
    }

    return true;
  }

  // 根据场景/证据/证人自动收集时间线索
  function autoDiscoverBySource(sourceType, sourceId) {
    const caseData = window.GameData || {};
    const timeline = caseData.timeline || [];
    timeline.forEach(event => {
      if (event.source === sourceType && event.sourceId === sourceId) {
        discoverTimelineEvent(event.id);
      }
    });
  }

  // 检测时间线矛盾
  function checkContradictions() {
    const state = GameState.state;
    const caseData = window.GameData || {};
    const contradictions = caseData.timelineContradictions || [];
    let found = 0;

    contradictions.forEach(cont => {
      if (state.timelineContradictionsFound.includes(cont.id)) return;
      // 两个事件都已发现才能检测矛盾
      if (state.discoveredTimeline.includes(cont.event1) &&
          state.discoveredTimeline.includes(cont.event2)) {
        state.timelineContradictionsFound.push(cont.id);
        state.confidence = Math.min(100, state.confidence + cont.confidence);
        found++;
        if (window.AudioManager) AudioManager.playSfx('link_success');
        if (window.GameUI) {
          GameUI.showToast(`发现时间线矛盾！信心值 +${cont.confidence}`, 'success', 3000);
        }
        // 记录到笔记
        if (window.PlayerData) {
          PlayerData.addNotebookItem('reasonings', `【时间线矛盾】${cont.description}`);
        }
      }
    });

    GameState.save();
    return found;
  }

  // 打开时间线弹窗
  function open() {
    isOpen = true;
    render();
    const overlay = document.getElementById('timeline-overlay');
    if (overlay) overlay.classList.remove('hidden');
    if (window.AudioManager) AudioManager.playSfx('ui_page');
  }

  // 关闭时间线弹窗
  function close() {
    isOpen = false;
    const overlay = document.getElementById('timeline-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // 渲染时间线
  function render() {
    const state = GameState.state;
    const caseData = window.GameData || {};
    const timeline = caseData.timeline || [];
    const contradictions = caseData.timelineContradictions || [];

    const container = document.getElementById('timeline-content');
    if (!container) return;

    // 按时间排序
    const sortedTimeline = [...timeline].sort((a, b) => a.time.localeCompare(b.time));

    const discoveredCount = state.discoveredTimeline.length;
    const totalCount = timeline.length;
    const contradictionCount = state.timelineContradictionsFound.length;

    container.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">⏱️ 时间线</h2>
        <div class="flex items-center gap-3 text-sm">
          <span class="text-stone-400">已发现: <span class="text-amber-400 font-bold">${discoveredCount}</span></span>
          <span class="text-stone-400">矛盾: <span class="text-red-400 font-bold">${contradictionCount}</span></span>
          <button onclick="TimelineUI.checkContradictions(); TimelineUI.render();" class="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs">检测矛盾</button>
        </div>
      </div>

      <div class="relative pl-8 max-h-[60vh] overflow-y-auto">
        <!-- 时间线竖线 -->
        <div class="absolute left-3 top-0 bottom-0 w-0.5 bg-stone-600"></div>

        ${sortedTimeline.map(event => {
          const discovered = state.discoveredTimeline.includes(event.id);
          const categoryColors = {
            '行程': 'bg-blue-500',
            '证词': 'bg-green-500',
            '物证': 'bg-amber-500',
            '推测': 'bg-purple-500'
          };
          const dotColor = categoryColors[event.category] || 'bg-stone-500';

          if (!discovered) {
            return `
              <div class="relative mb-4">
                <div class="absolute -left-5 top-2 w-3 h-3 rounded-full bg-stone-600 border-2 border-stone-500"></div>
                <div class="bg-stone-800/50 rounded-lg p-3 opacity-50">
                  <span class="text-stone-500 font-mono">??:??</span>
                  <span class="text-stone-500 ml-2">未发现的时间线索</span>
                </div>
              </div>
            `;
          }

          return `
            <div class="relative mb-4">
              <div class="absolute -left-5 top-2 w-3 h-3 rounded-full ${dotColor} border-2 border-stone-900"></div>
              <div class="bg-stone-800 rounded-lg p-3 border border-stone-700">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-amber-400 font-mono font-bold">${event.time}</span>
                  <span class="text-xs px-2 py-0.5 ${dotColor} text-white rounded">${event.category}</span>
                </div>
                <h4 class="font-bold text-sm text-white mb-1">${event.title}</h4>
                <p class="text-xs text-stone-400">${event.description}</p>
                <p class="text-xs text-stone-500 mt-1">来源：${event.source}</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      ${contradictionCount > 0 ? `
        <div class="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <h4 class="font-bold text-red-400 text-sm mb-2">⚡ 已发现的时间线矛盾</h4>
          ${contradictions.filter(c => state.timelineContradictionsFound.includes(c.id)).map(c => `
            <p class="text-xs text-red-300 mb-1">• ${c.description}</p>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  return {
    open,
    close,
    render,
    discoverTimelineEvent,
    autoDiscoverBySource,
    checkContradictions
  };
})();

window.TimelineUI = TimelineUI;
