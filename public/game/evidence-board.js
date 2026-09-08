/**
 * 证据关联系统
 * 玩家可以选择证据/证人进行关联，发现矛盾点
 */

const EvidenceBoard = (function() {
  // 预设的成功关联（从案件数据读取，支持多案件）
  // 注意：不能在模块加载时缓存，因为案件数据是异步加载的
  function loadPresetLinks() {
    return (window.GameData && window.GameData.presetLinks) || [];
  }

  // 状态
  let selectedFirst = null; // {id, type, element}
  let boardOverlay = null;

  /**
   * 打开证据板
   */
  function openBoard() {
    if (!window._gameEvidence || !window._gameWitnesses) {
      console.error('游戏数据未加载');
      return;
    }

    // 获取玩家已发现的证据和证人
    // 调查阶段：只显示已发现的（防剧透）；审判阶段：全部显示（所有人都在场）
    const gameState = window._gameState || {};
    const isTrialPhase = gameState.gamePhase === 'trial' || gameState.gamePhase === 'ending';
    const collectedIds = gameState.collectedEvidence || [];
    const interviewedIds = gameState.interviewedWitnesses || [];
    const discoveredEvidence = isTrialPhase
      ? window._gameEvidence
      : window._gameEvidence.filter(ev => collectedIds.includes(ev.id));
    const discoveredWitnesses = isTrialPhase
      ? window._gameWitnesses
      : window._gameWitnesses.filter(w => interviewedIds.includes(w.id));

    // 清除之前的选择
    selectedFirst = null;

    // 创建遮罩
    boardOverlay = document.createElement('div');
    boardOverlay.id = 'evidence-board-overlay';
    boardOverlay.className = 'fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4';
    boardOverlay.setAttribute('role', 'dialog');
    boardOverlay.setAttribute('aria-modal', 'true');
    boardOverlay.setAttribute('aria-label', '线索关联板');
    boardOverlay.onclick = (e) => {
      if (e.target === boardOverlay) closeBoard();
    };

    // 获取玩家已建立的连线
    const playerLinks = (window.PlayerData && PlayerData.getEvidenceLinks()) || [];

    // 构建内容
    boardOverlay.innerHTML = `
      <div class="w-full max-w-5xl bg-stone-800 rounded-2xl shadow-2xl border border-stone-600 overflow-hidden max-h-[90vh] flex flex-col">
        <!-- 头部 -->
        <div class="flex items-center justify-between px-6 py-4 bg-stone-900/50 border-b border-stone-700">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2"><span style="color: var(--game-accent, #f59e0b);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>证据关联板</h2>
            <p class="text-xs text-stone-400 mt-1">选择两个物品/人物进行关联，发现隐藏的矛盾点</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-stone-400">已发现关联 <span class="text-amber-400 font-bold">${countCorrectLinks()}</span></span>
            <button onclick="EvidenceBoard.closeBoard()" class="text-stone-400 hover:text-white text-2xl w-11 h-11 flex items-center justify-center rounded hover:bg-stone-700 transition-colors" aria-label="关闭关联板" style="min-height:44px;">×</button>
          </div>
        </div>

        <!-- 选择提示 -->
        <div id="board-selection-hint" class="px-6 py-2 bg-amber-900/30 border-b border-amber-800/50 text-amber-300 text-sm">
          请点击选择第一个证据或证人...
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- 证据区 -->
          <div class="mb-6">
            <h3 class="text-sm font-bold text-stone-200 mb-3 flex items-center gap-2">
              <span>🔍</span> 证据
              <span class="text-xs text-stone-400 font-normal">(${discoveredEvidence.length})</span>
            </h3>
            <div id="board-evidence-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              ${discoveredEvidence.length > 0 ? renderEvidenceCards(discoveredEvidence) : ''}
            </div>
          </div>

          <!-- 证人区 -->
          <div class="mb-6">
            <h3 class="text-sm font-bold text-stone-200 mb-3 flex items-center gap-2">
              <span>👤</span> 人物
              <span class="text-xs text-stone-400 font-normal">(${discoveredWitnesses.length})</span>
            </h3>
            <div id="board-witness-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              ${discoveredWitnesses.length > 0 ? renderWitnessCards(discoveredWitnesses) : ''}
            </div>
          </div>

          <!-- 已建立的连线 -->
          <div>
            <h3 class="text-sm font-bold text-stone-200 mb-3 flex items-center gap-2">
              <span>📋</span> 已建立的关联
              <span class="text-xs text-stone-500 font-normal">(${playerLinks.length}条)</span>
            </h3>
            <div id="board-links-list" class="space-y-2">
              ${renderLinksList(playerLinks)}
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="px-6 py-3 bg-stone-900/50 border-t border-stone-700 flex justify-end items-center">
          <button onclick="EvidenceBoard.clearSelection()" class="text-xs text-stone-400 hover:text-white px-3 py-1.5 rounded hover:bg-stone-700">清除选择</button>
        </div>
      </div>
    `;

    document.body.appendChild(boardOverlay);

    // 绑定卡片点击事件
    bindCardEvents();
  }

  /**
   * 渲染证据卡片
   */
  function renderEvidenceCards(evidenceList) {
    return evidenceList.map(ev => `
      <button class="evidence-card text-left p-3 rounded-lg border-2 border-stone-600 bg-stone-700/50 hover:border-amber-500 hover:bg-stone-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
           data-id="${ev.id}" data-type="evidence" onclick="EvidenceBoard.selectItem('${ev.id}', 'evidence', this)"
           aria-pressed="false" aria-label="证据：${ev.name}">
        <div class="text-amber-400 mb-1"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
        <div class="text-sm font-bold text-white truncate">${ev.name}</div>
        <div class="text-xs text-stone-400 mt-1 line-clamp-2">${ev.description.substring(0, 30)}...</div>
      </button>
    `).join('');
  }

  /**
   * 渲染证人卡片
   */
  function renderWitnessCards(witnessList) {
    return witnessList.map(w => `
      <button class="witness-card text-left p-3 rounded-lg border-2 border-stone-600 bg-stone-700/50 hover:border-amber-500 hover:bg-stone-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
           data-id="${w.id}" data-type="witness" onclick="EvidenceBoard.selectItem('${w.id}', 'witness', this)"
           aria-pressed="false" aria-label="证人：${w.name}">
        <div class="text-2xl mb-1">${w.avatar || '👤'}</div>
        <div class="text-sm font-bold truncate" style="color: ${w.color || '#fff'}">${w.name}</div>
        <div class="text-xs text-stone-400 mt-1 line-clamp-2">${w.description.substring(0, 25)}...</div>
      </button>
    `).join('');
  }

  /**
   * 渲染已建立的连线列表
   */
  function renderLinksList(links) {
    if (links.length === 0) {
      return '<div class="text-stone-400 text-sm text-center py-4">暂无关联记录</div>';
    }

    return links.map(link => {
      const fromName = getItemName(link.from, link.fromType);
      const toName = getItemName(link.to, link.toType);
      const isCorrect = link.isCorrect;

      return `
        <div class="p-3 rounded-lg ${isCorrect ? 'bg-green-900/30 border border-green-700' : 'bg-stone-700/30 border border-stone-600'}">
          <div class="flex items-center gap-2 text-sm">
            <span class="${isCorrect ? 'text-green-400' : 'text-stone-400'}">${isCorrect ? '✓' : '○'}</span>
            <span class="text-white font-medium">${fromName}</span>
            <span class="text-stone-500">↔</span>
            <span class="text-white font-medium">${toName}</span>
            ${isCorrect ? `<span class="text-xs text-green-400 font-bold">${link.title || '关键关联'}</span>` : '<span class="text-xs text-stone-500">自定义关联</span>'}
          </div>
          ${link.conclusion ? `<p class="text-xs text-stone-300 mt-2 leading-relaxed">${link.conclusion}</p>` : ''}
          ${link.note ? `<p class="text-xs text-amber-300/70 mt-1">备注: ${link.note}</p>` : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * 获取物品名称
   */
  function getItemName(id, type) {
    if (type === 'evidence') {
      const ev = window._gameEvidence.find(e => e.id === id);
      return ev ? ev.name : id;
    } else {
      const w = window._gameWitnesses.find(x => x.id === id);
      return w ? w.name : id;
    }
  }

  /**
   * 绑定卡片点击事件
   */
  function bindCardEvents() {
    // 事件已通过onclick内联绑定
  }

  /**
   * 选择物品
   */
  function selectItem(id, type, element) {
    // 如果点击的是已选中的，取消选择
    if (selectedFirst && selectedFirst.id === id && selectedFirst.type === type) {
      clearSelection();
      return;
    }

    // 如果还没选第一个
    if (!selectedFirst) {
      selectedFirst = { id, type, element };
      element.classList.remove('border-stone-600');
      element.classList.add('border-amber-500', 'bg-amber-900/30', 'ring-2', 'ring-amber-500/50');
      element.setAttribute('aria-pressed', 'true');
      updateHint(`已选择：${getItemName(id, type)}，请选择第二个进行关联...`);
      return;
    }

    // 已经选了第一个，现在选第二个，进行关联
    const first = selectedFirst;
    const second = { id, type, element };

    // 清除高亮
    clearSelection();

    // 执行关联
    tryLink(first, second);
  }

  /**
   * 清除选择
   */
  function clearSelection() {
    if (selectedFirst && selectedFirst.element) {
      selectedFirst.element.classList.remove('border-amber-500', 'bg-amber-900/30', 'ring-2', 'ring-amber-500/50');
      selectedFirst.element.classList.add('border-stone-600');
      selectedFirst.element.setAttribute('aria-pressed', 'false');
    }
    selectedFirst = null;
    updateHint('请点击选择第一个证据或证人...');
  }

  /**
   * 更新提示
   */
  function updateHint(text) {
    const hint = document.getElementById('board-selection-hint');
    if (hint) hint.textContent = text;
  }

  /**
   * 尝试关联
   */
  function tryLink(first, second) {
    // 查找预设连线（顺序无关）
    const preset = loadPresetLinks().find(p =>
      (p.from === first.id && p.to === second.id) ||
      (p.from === second.id && p.to === first.id)
    );

    if (preset) {
      // 检查前置关联要求（竞争假设机制）
      if (preset.requiresLink) {
        const playerLinks = (window.PlayerData && PlayerData.getEvidenceLinks()) || [];
        const hasPrerequisite = playerLinks.some(l => l.presetId === preset.requiresLink);
        if (!hasPrerequisite) {
          // 前置关联未建立，显示提示而非直接成功
          if (window.GameUI) {
            GameUI.showModal({
              title: '🔍 需要更多线索',
              message: `这个结论需要先建立初步假设。请先尝试关联手帕与赫伯德夫人，建立初步假设后再验证这个方向。`,
              confirmText: '我知道了',
              hideCancel: true,
              type: 'info'
            });
          }
          return;
        }
      }
      // 成功关联
      handleSuccessLink(preset);
    } else {
      // 失败关联（但仍保存为自定义关联）
      handleCustomLink(first, second);
    }
  }

  /**
   * 处理成功关联
   */
  function handleSuccessLink(preset) {
    // 检查是否已经建立过
    const playerLinks = (window.PlayerData && PlayerData.getEvidenceLinks()) || [];
    const exists = playerLinks.find(l => l.presetId === preset.id);

    if (exists) {
      // 已经发现过
      showResultModal('already', preset);
      return;
    }

    // 保存到玩家数据
    const linkData = {
      presetId: preset.id,
      from: preset.from,
      to: preset.to,
      fromType: preset.fromType,
      toType: preset.toType,
      isCorrect: true,
      title: preset.title,
      conclusion: preset.conclusion,
      confidence: preset.confidence,
      timestamp: Date.now()
    };

    if (window.PlayerData) {
      PlayerData.addEvidenceLink(linkData);
      // 竞争假设：如果当前关联排除了另一个关联，标记被排除的关联
      if (preset.excludesLink && window.PlayerData && typeof PlayerData.markLinkExcluded === 'function') {
        PlayerData.markLinkExcluded(preset.excludesLink);
      }
      // 增加信心值
      if (window._gameState) {
        window._gameState.confidence = Math.min(100, window._gameState.confidence + preset.confidence);
      }
      // 自动添加到笔记推理栏
      if (window.NotebookUI && typeof NotebookUI.addItem === 'function') {
        NotebookUI.addItem('推理', `【${preset.title}】${preset.conclusion}`);
      }
      // 触发目标系统检查（find_relation 类型目标）
      if (window.GuideUI && typeof GuideUI.checkObjectives === 'function') {
        GuideUI.checkObjectives();
      }
    }

    // 显示成功结果，确认后刷新证据板
    showResultModal('success', preset, () => {
      closeBoard();
      openBoard();
    });
  }

  /**
   * 处理自定义关联（失败但保存）——给出可解释的反证
   */
  function handleCustomLink(first, second) {
    const linkData = {
      from: first.id,
      to: second.id,
      fromType: first.type,
      toType: second.type,
      isCorrect: false,
      timestamp: Date.now()
    };

    if (window.PlayerData) {
      PlayerData.addEvidenceLink(linkData);
    }

    // 根据组合类型给出可解释的反馈，而非笼统的"没有关联"
    const firstName = getItemName(first.id, first.type);
    const secondName = getItemName(second.id, second.type);
    let hint = '';

    if (first.type === 'evidence' && second.type === 'evidence') {
      hint = `「${firstName}」和「${secondName}」都是物证，但它们之间没有直接的因果关系。试试把物证与证人关联，或者检查它们是否指向同一个时间点。`;
    } else if (first.type === 'witness' && second.type === 'witness') {
      hint = `「${firstName}」和「${secondName}」的证词目前没有发现直接矛盾。仔细对比他们的证词细节，或者用物证来检验其中一人的说法。`;
    } else {
      const evidenceItem = first.type === 'evidence' ? first : second;
      const witnessItem = first.type === 'witness' ? first : second;
      hint = `「${evidenceItem ? getItemName(evidenceItem.id, evidenceItem.type) : ''}」不能直接证明「${witnessItem ? getItemName(witnessItem.id, witnessItem.type) : ''}」的说法。也许需要先收集更多证据，或者这条线索指向另一个人。`;
    }

    if (window.GameUI) {
      GameUI.showModal({
        title: '🤔 暂时没有发现直接关联',
        content: `
          <p class="text-stone-300 leading-relaxed text-sm">${hint}</p>
          <p class="text-stone-500 text-xs mt-3">这条组合已保存为你的自定义笔记，也许后续发现新线索后会产生联系。</p>
        `,
        confirmText: '继续推理',
        hideCancel: true,
        type: 'info'
      });
    }
  }

  /**
   * 显示结果模态框
   * @param {string} type - success | already | fail
   * @param {object} preset - 预设关联数据
   * @param {Function|object} onConfirmOrFirst - 成功时为回调函数，失败时为 first 对象
   * @param {object} second - 失败时的 second 对象
   */
  function showResultModal(type, preset, onConfirmOrFirst, second) {
    let title, content, icon, color;
    let onConfirm = null;
    let first = null;

    // 参数适配：success/already 时第三个参数是回调；fail 时第三个参数是 first
    if (type === 'fail') {
      first = onConfirmOrFirst;
    } else {
      onConfirm = onConfirmOrFirst;
    }

    if (type === 'success') {
      icon = '🎉';
      color = 'green';
      title = '发现关键关联！';
      content = `
        <div class="text-lg font-bold text-green-400 mb-2">${preset.title}</div>
        <p class="text-stone-300 leading-relaxed">${preset.conclusion}</p>
        <div class="mt-3 text-xs text-amber-400">信心值 +${preset.confidence} | 已自动记录到推理笔记</div>
      `;
    } else if (type === 'already') {
      icon = '📌';
      color = 'blue';
      title = '已经发现过这个关联';
      content = `
        <div class="text-lg font-bold text-blue-400 mb-2">${preset.title}</div>
        <p class="text-stone-300 leading-relaxed">${preset.conclusion}</p>
        <div class="mt-3 text-xs text-stone-400">这条关联已经记录在你的笔记中了</div>
      `;
    } else {
      icon = '🤔';
      color = 'stone';
      title = '暂时没有发现直接关联';
      content = `
        <p class="text-stone-300 leading-relaxed">
          ${getItemName(first.id, first.type)} 和 ${getItemName(second.id, second.type)} 
          之间似乎没有直接的矛盾或关联。
        </p>
        <p class="text-stone-400 text-sm mt-2">不过，这条关联已保存为你的自定义笔记，也许后续会发现新的联系？</p>
      `;
    }

    if (window.GameUI) {
      GameUI.showModal({
        title: `${icon} ${title}`,
        content: content,
        confirmText: '继续推理',
        hideCancel: true,
        onConfirm: onConfirm || (() => {})
      });
    }
  }

  /**
   * 统计正确关联数
   */
  function countCorrectLinks() {
    const playerLinks = (window.PlayerData && PlayerData.getEvidenceLinks()) || [];
    return playerLinks.filter(l => l.isCorrect).length;
  }

  /**
   * 关闭证据板
   */
  function closeBoard() {
    if (boardOverlay) {
      boardOverlay.remove();
      boardOverlay = null;
    }
    selectedFirst = null;
  }

  /**
   * 获取预设连线（供外部使用）
   */
  function getPresetLinks() {
    return loadPresetLinks();
  }

  return {
    openBoard,
    closeBoard,
    selectItem,
    clearSelection,
    getPresetLinks,
    countCorrectLinks
  };
})();

window.EvidenceBoard = EvidenceBoard;
