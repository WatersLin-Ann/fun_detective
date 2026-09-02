/**
 * 玩家笔记系统UI
 * 包含：推理笔记板、证据标记面板、人物档案面板
 */

const NotebookUI = (function() {
  let currentPanel = null; // 'notebook' | 'evidence' | 'characters'

  // ========== 主入口：打开笔记系统 ==========
  function open(panel = 'notebook') {
    currentPanel = panel;
    remove();
    renderOverlay();
    renderPanel();
  }

  function remove() {
    const overlay = document.getElementById('notebook-overlay');
    if (overlay) overlay.remove();
  }

  // ========== 渲染遮罩和框架 ==========
  function renderOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'notebook-overlay';
    overlay.className = 'fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4';
    overlay.onclick = (e) => {
      if (e.target.id === 'notebook-overlay') remove();
    };
    document.body.appendChild(overlay);
  }

  function renderPanel() {
    const overlay = document.getElementById('notebook-overlay');
    if (!overlay) return;

    const stats = PlayerData.getStats();

    overlay.innerHTML = `
      <div class="w-full max-w-4xl max-h-[90vh] bg-stone-800 rounded-2xl shadow-2xl border border-stone-600 overflow-hidden flex flex-col">
        <!-- 头部 -->
        <div class="bg-gradient-to-r from-amber-900/40 to-stone-800 p-4 border-b border-stone-600 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🧠</span>
            <div>
              <h2 class="font-bold text-lg text-amber-400">波洛的侦探笔记</h2>
              <p class="text-xs text-stone-400">最后保存：${new Date(stats.lastSaved).toLocaleString('zh-CN')}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="NotebookUI.exportJson()" class="text-xs px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors" title="导出JSON备份">
              📥 导出
            </button>
            <button onclick="NotebookUI.exportText()" class="text-xs px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors" title="导出为文本">
              📄 文本
            </button>
            <button onclick="NotebookUI.remove()" class="text-stone-400 hover:text-white text-2xl leading-none ml-2">×</button>
          </div>
        </div>

        <!-- 标签页 -->
        <div class="flex border-b border-stone-600 bg-stone-900/50">
          <button onclick="NotebookUI.switchPanel('notebook')" class="px-6 py-3 text-sm font-medium transition-colors ${currentPanel === 'notebook' ? 'bg-stone-800 text-amber-400 border-b-2 border-amber-400' : 'text-stone-400 hover:text-white'}">
            📝 推理笔记 (${stats.totalClues + stats.totalReasonings + stats.totalTodos})
          </button>
          <button onclick="NotebookUI.switchPanel('evidence')" class="px-6 py-3 text-sm font-medium transition-colors ${currentPanel === 'evidence' ? 'bg-stone-800 text-amber-400 border-b-2 border-amber-400' : 'text-stone-400 hover:text-white'}">
            🔍 证据标记 (${stats.evidenceMarked})
          </button>
          <button onclick="NotebookUI.switchPanel('characters')" class="px-6 py-3 text-sm font-medium transition-colors ${currentPanel === 'characters' ? 'bg-stone-800 text-amber-400 border-b-2 border-amber-400' : 'text-stone-400 hover:text-white'}">
            👤 人物档案 (${stats.charactersAnalyzed})
          </button>
        </div>

        <!-- 内容区域 -->
        <div id="notebook-content" class="flex-1 overflow-y-auto p-6"></div>
      </div>
    `;

    renderContent();
  }

  function switchPanel(panel) {
    currentPanel = panel;
    renderPanel();
  }

  function renderContent() {
    const content = document.getElementById('notebook-content');
    if (!content) return;

    if (currentPanel === 'notebook') renderNotebook(content);
    else if (currentPanel === 'evidence') renderEvidenceMarks(content);
    else if (currentPanel === 'characters') renderCharacters(content);
  }

  // ========== 推理笔记板 ==========
  function renderNotebook(container) {
    const notebook = PlayerData.getNotebook();

    // 计算关键词状态
    const caseData = window.GameData || {};
    const allKeywords = caseData.noteKeywords || [];
    const state = window.GameState ? GameState.state : (window._gameState || {});
    const discoveredKwIds = state.discoveredKeywords || [];
    const discoveredKeywords = allKeywords.filter(kw => discoveredKwIds.includes(kw.id));
    const discoveredKwCount = discoveredKeywords.length;
    const totalKwCount = allKeywords.length;

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 线索栏 -->
        <div class="bg-stone-900/50 rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-blue-400">🔎 我发现的线索</h3>
            <span class="text-xs text-stone-400">${notebook.clues.length}</span>
          </div>
          <div id="clues-list" class="space-y-2 mb-3">
            ${renderItemList(notebook.clues, 'clues')}
          </div>
          <div class="flex gap-2">
            <input id="new-clue-input" type="text" placeholder="添加线索..." class="flex-1 px-3 py-2 bg-stone-800 rounded-lg text-sm border border-stone-600 focus:border-blue-500 focus:outline-none" onkeypress="if(event.key==='Enter') NotebookUI.addItem('clues')">
            <button onclick="NotebookUI.addItem('clues')" class="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm">+</button>
          </div>
        </div>

        <!-- 推理栏 -->
        <div class="bg-stone-900/50 rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-amber-400">💡 我的推理</h3>
            <span class="text-xs text-stone-400">${notebook.reasonings.length}</span>
          </div>
          <div id="reasonings-list" class="space-y-2 mb-3">
            ${renderItemList(notebook.reasonings, 'reasonings')}
          </div>
          <div class="flex gap-2">
            <input id="new-reasoning-input" type="text" placeholder="添加推理..." class="flex-1 px-3 py-2 bg-stone-800 rounded-lg text-sm border border-stone-600 focus:border-amber-500 focus:outline-none" onkeypress="if(event.key==='Enter') NotebookUI.addItem('reasonings')">
            <button onclick="NotebookUI.addItem('reasonings')" class="px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm">+</button>
          </div>
        </div>

        <!-- 待验证栏 -->
        <div class="bg-stone-900/50 rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-green-400">✅ 待验证</h3>
            <span class="text-xs text-stone-400">${notebook.todos.length > 0 ? notebook.todos.filter(t => t.done).length + '/' + notebook.todos.length : notebook.todos.length}</span>
          </div>
          <div id="todos-list" class="space-y-2 mb-3">
            ${renderItemList(notebook.todos, 'todos')}
          </div>
          <div class="flex gap-2">
            <input id="new-todo-input" type="text" placeholder="添加待办..." class="flex-1 px-3 py-2 bg-stone-800 rounded-lg text-sm border border-stone-600 focus:border-green-500 focus:outline-none" onkeypress="if(event.key==='Enter') NotebookUI.addItem('todos')">
            <button onclick="NotebookUI.addItem('todos')" class="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm">+</button>
          </div>
        </div>
      </div>

      <!-- 已解锁关键词 -->
      <div class="mt-4 p-3 bg-stone-800/50 rounded-lg border border-stone-700">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-amber-400">🔑 已解锁关键词</span>
          <span class="text-xs text-stone-400">${discoveredKwCount}/${totalKwCount}</span>
        </div>
        ${discoveredKwCount > 0 ? `
          <div class="flex flex-wrap gap-2">
            ${discoveredKeywords.map(kw => `
              <div class="px-2 py-1 bg-amber-900/30 border border-amber-700 rounded text-xs">
                <span class="text-amber-300 font-bold">${kw.keyword}</span>
                <span class="text-stone-400 ml-1">${kw.description}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <p class="text-xs text-stone-500">在笔记中写下推理关键词，可能解锁隐藏内容...</p>
        `}
      </div>
    `;
  }

  function renderItemList(items, type) {
    if (items.length === 0) {
      return '<p class="text-stone-400 text-sm text-center py-4">暂无内容</p>';
    }
    return items.map(item => `
      <div class="flex items-start gap-2 p-2 bg-stone-800 rounded-lg group ${item.done ? 'opacity-50' : ''}">
        ${type === 'todos' ? `
          <input type="checkbox" ${item.done ? 'checked' : ''} onchange="NotebookUI.toggleItem('${type}', '${item.id}')" class="mt-1 cursor-pointer">
        ` : ''}
        <span class="flex-1 text-sm ${item.done ? 'line-through' : ''}">${escapeHtml(item.text)}</span>
        <button onclick="NotebookUI.deleteItem('${type}', '${item.id}')" class="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-red-400 transition-opacity text-xs">×</button>
      </div>
    `).join('');
  }

  function addItem(type) {
    const input = document.getElementById(`new-${type}-input`);
    if (input && input.value.trim()) {
      const text = input.value.trim();
      PlayerData.addNotebookItem(type, text);
      input.value = '';
      // 检测笔记关键词
      checkKeywords(text);
      renderContent();
    } else if (input) {
      // 空值时高亮输入框提示
      input.classList.add('border-red-500', 'ring-2', 'ring-red-500/30');
      input.placeholder = '请输入内容...';
      setTimeout(() => {
        input.classList.remove('border-red-500', 'ring-2', 'ring-red-500/30');
      }, 1500);
    }
  }

  // 检测笔记关键词
  function checkKeywords(text) {
    const caseData = window.GameData || {};
    const keywords = caseData.noteKeywords || [];
    const state = window.GameState ? GameState.state : (window._gameState || {});
    const discovered = state.discoveredKeywords || [];

    keywords.forEach(kw => {
      if (discovered.includes(kw.id)) return;
      // 检测关键词和别名
      const allKeywords = [kw.keyword, ...(kw.aliases || [])];
      const found = allKeywords.some(k => text.toLowerCase().includes(k.toLowerCase()));
      if (found) {
        // 解锁关键词
        if (window.GameState) {
          GameState.state.discoveredKeywords.push(kw.id);
          GameState.save();
        }
        // 触发解锁反馈
        if (kw.unlockType === 'dialog' && kw.unlockContent) {
          if (window.GameUI) {
            GameUI.showDialog({
              speaker: kw.unlockContent.speaker || '系统',
              color: '#fbbf24',
              text: `💡 发现关键词「${kw.keyword}」！\n\n${kw.unlockContent.text}`
            });
          }
          if (kw.unlockContent.confidence) {
            state.confidence = Math.min(100, state.confidence + kw.unlockContent.confidence);
            if (window.GameState) GameState.save();
          }
        } else if (kw.unlockType === 'confidence' && kw.unlockContent) {
          state.confidence = Math.min(100, state.confidence + (kw.unlockContent.confidence || 5));
          if (window.GameState) GameState.save();
          if (window.GameUI) {
            GameUI.showToast(`发现关键词「${kw.keyword}」！信心值 +${kw.unlockContent.confidence || 5}`, 'success', 2500);
          }
        }
        if (window.AudioManager) AudioManager.playSfx('collect_reveal');
      }
    });
  }

  function toggleItem(type, itemId) {
    PlayerData.toggleNotebookItem(type, itemId);
    renderContent();
  }

  function deleteItem(type, itemId) {
    PlayerData.deleteNotebookItem(type, itemId);
    renderContent();
  }

  // ========== 证据标记 ==========
  function renderEvidenceMarks(container) {
    const allEvidence = window._gameEvidence || [];
    const gameState = window._gameState || {};
    const isTrialPhase = gameState.gamePhase === 'trial' || gameState.gamePhase === 'ending';
    const collectedIds = gameState.collectedEvidence || [];
    const evidenceList = isTrialPhase
      ? allEvidence
      : allEvidence.filter(ev => collectedIds.includes(ev.id));
    const notes = PlayerData.getAllEvidenceNotes();

    container.innerHTML = `
      <div class="space-y-3 min-h-[200px]">
        ${evidenceList.length === 0 ? '<div class="text-stone-400 text-sm text-center py-12">暂无收集的证据</div>' :
        evidenceList.map(ev => {
          const note = notes[ev.id] || { note: '', tags: [], rating: 0 };
          return `
            <div class="bg-stone-900/50 rounded-xl p-4">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h4 class="font-bold text-amber-400">${escapeHtml(ev.name)}</h4>
                  <p class="text-xs text-stone-500">${escapeHtml(ev.foundIn || '')}</p>
                </div>
                <div class="flex items-center gap-1">
                  ${[1,2,3,4,5].map(n => `
                    <button onclick="NotebookUI.setRating('${ev.id}', ${n})" class="text-lg ${note.rating >= n ? 'text-yellow-400' : 'text-stone-600'} hover:scale-110 transition-transform">★</button>
                  `).join('')}
                </div>
              </div>
              <textarea
                onchange="NotebookUI.saveEvidenceNote('${ev.id}')"
                id="evidence-note-${ev.id}"
                placeholder="记录你对这件证据的观察和推理..."
                class="w-full px-3 py-2 bg-stone-800 rounded-lg text-sm border border-stone-600 focus:border-amber-500 focus:outline-none resize-none"
                rows="2"
              >${escapeHtml(note.note)}</textarea>
              <div class="mt-2 flex flex-wrap gap-1">
                ${['关键证据', '疑点', '时间线', '伪造', '关联人物'].map(tag => `
                  <button onclick="NotebookUI.toggleTag('${ev.id}', '${tag}')" class="text-xs px-2 py-1 rounded-full transition-colors ${note.tags.includes(tag) ? 'bg-amber-600 text-white' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'}">
                    ${tag}
                  </button>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function saveEvidenceNote(evidenceId) {
    const textarea = document.getElementById(`evidence-note-${evidenceId}`);
    const current = PlayerData.getEvidenceNote(evidenceId);
    PlayerData.saveEvidenceNote(evidenceId, {
      ...current,
      note: textarea.value
    });
    GameUI.showToast('证据笔记已保存', 'success', 1500);
  }

  function setRating(evidenceId, rating) {
    const current = PlayerData.getEvidenceNote(evidenceId);
    PlayerData.saveEvidenceNote(evidenceId, {
      ...current,
      rating: current.rating === rating ? 0 : rating
    });
    renderContent();
  }

  function toggleTag(evidenceId, tag) {
    const current = PlayerData.getEvidenceNote(evidenceId);
    const tags = current.tags.includes(tag)
      ? current.tags.filter(t => t !== tag)
      : [...current.tags, tag];
    PlayerData.saveEvidenceNote(evidenceId, { ...current, tags });
    renderContent();
  }

  // ========== 人物档案 ==========
  function renderCharacters(container) {
    const allWitnesses = window._gameWitnesses || [];
    const gameState = window._gameState || {};
    const isTrialPhase = gameState.gamePhase === 'trial' || gameState.gamePhase === 'ending';
    const interviewedIds = gameState.interviewedWitnesses || [];
    const witnesses = isTrialPhase
      ? allWitnesses
      : allWitnesses.filter(w => interviewedIds.includes(w.id));
    const notes = PlayerData.getAllCharacterNotes();

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[200px]">
        ${witnesses.length === 0 ? '<div class="text-stone-400 text-sm text-center py-12 col-span-2">暂无询问的人物</div>' :
        witnesses.map(w => {
          const note = notes[w.id] || { suspicion: 50, note: '', relations: [] };
          const suspicionColor = note.suspicion >= 75 ? 'text-red-400' : note.suspicion >= 50 ? 'text-yellow-400' : 'text-green-400';
          return `
            <div class="bg-stone-900/50 rounded-xl p-4">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center text-lg">👤</div>
                <div class="flex-1">
                  <h4 class="font-bold">${escapeHtml(w.name)}</h4>
                  <p class="text-xs text-stone-500">${escapeHtml(w.description || '')}</p>
                </div>
              </div>
              <div class="mb-3">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-stone-400">可疑度</span>
                  <span class="font-bold ${suspicionColor}">${note.suspicion}%</span>
                </div>
                <input type="range" min="0" max="100" value="${note.suspicion}"
                  onchange="NotebookUI.setSuspicion('${w.id}', this.value)"
                  class="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer">
              </div>
              <textarea
                onchange="NotebookUI.saveCharacterNote('${w.id}')"
                id="char-note-${w.id}"
                placeholder="记录你对这个人的判断..."
                class="w-full px-3 py-2 bg-stone-800 rounded-lg text-sm border border-stone-600 focus:border-amber-500 focus:outline-none resize-none"
                rows="2"
              >${escapeHtml(note.note)}</textarea>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function setSuspicion(characterId, value) {
    const current = PlayerData.getCharacterNote(characterId);
    PlayerData.saveCharacterNote(characterId, { ...current, suspicion: parseInt(value) });
    renderContent();
  }

  function saveCharacterNote(characterId) {
    const textarea = document.getElementById(`char-note-${characterId}`);
    const current = PlayerData.getCharacterNote(characterId);
    PlayerData.saveCharacterNote(characterId, {
      ...current,
      note: textarea.value
    });
    GameUI.showToast('人物笔记已保存', 'success', 1500);
  }

  // ========== 导出 ==========
  function exportJson() {
    PlayerData.exportData();
    GameUI.showToast('已导出JSON备份文件', 'success');
  }

  function exportText() {
    PlayerData.exportAsText();
    GameUI.showToast('已导出文本笔记', 'success');
  }

  // ========== 工具函数 ==========
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // ========== 公共API ==========
  return {
    open,
    remove,
    switchPanel,
    addItem,
    toggleItem,
    deleteItem,
    saveEvidenceNote,
    setRating,
    toggleTag,
    setSuspicion,
    saveCharacterNote,
    exportJson,
    exportText
  };
})();

window.NotebookUI = NotebookUI;
