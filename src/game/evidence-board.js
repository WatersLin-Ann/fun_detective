/**
 * 证据关联系统
 * 玩家可以选择证据/证人进行关联，发现矛盾点
 */

const EvidenceBoard = (function() {
  // 预设的成功关联（证据ID + 证人ID → 推理结论）
  const presetLinks = [
    {
      id: 'link-watch-conductor',
      from: 'watch',
      to: 'conductor',
      fromType: 'evidence',
      toType: 'witness',
      title: '时间矛盾',
      conclusion: '怀表停在1:15，而列车员说1:15听到动静却以为是赫伯德夫人。时间完全吻合，这不是巧合。',
      confidence: 20,
      noteCategory: '推理'
    },
    {
      id: 'link-handkerchief-hubbard',
      from: 'handkerchief',
      to: 'mrs-hubbard',
      fromType: 'evidence',
      toType: 'witness',
      title: '手帕的H字母',
      conclusion: '现场手帕绣着字母"H"，而赫伯德夫人(Hubbard)的姓氏首字母正是H。这块手帕可能属于她。',
      confidence: 15,
      noteCategory: '推理'
    },
    {
      id: 'link-ash-mary',
      from: 'ash',
      to: 'mary',
      fromType: 'evidence',
      toType: 'witness',
      title: '香烟灰的秘密',
      conclusion: '现场有两种烟灰，受害者只抽雪茄。玛丽抽香烟，而她说自己睡得很沉——那香烟灰是怎么来的？',
      confidence: 20,
      noteCategory: '推理'
    },
    {
      id: 'link-handkerchief-pincess',
      from: 'handkerchief',
      to: 'princess',
      fromType: 'evidence',
      toType: 'witness',
      title: '俄文的H',
      conclusion: '手帕上的"H"在俄文中对应"N"，而公主的教名娜塔莉亚(Natalia)首字母正是N。这块手帕的真正主人可能是公主。',
      confidence: 25,
      noteCategory: '推理'
    },
    {
      id: 'link-window-body',
      from: 'window',
      to: 'body',
      fromType: 'evidence',
      toType: 'evidence',
      title: '伪造的逃走路线',
      conclusion: '窗户大开但雪地上没有脚印，说明凶手没有从窗户逃走。窗户是故意打开的，用来伪造外人作案的假象。',
      confidence: 15,
      noteCategory: '推理'
    }
  ];

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
            <h2 class="text-xl font-bold text-white">🔗 证据关联板</h2>
            <p class="text-xs text-stone-400 mt-1">选择两个物品/人物进行关联，发现隐藏的矛盾点</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-stone-400">已发现关联 <span class="text-amber-400 font-bold">${countCorrectLinks()}</span></span>
            <button onclick="EvidenceBoard.closeBoard()" class="text-stone-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-stone-700">×</button>
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
            <h3 class="text-sm font-bold text-stone-300 mb-3 flex items-center gap-2">
              <span>🔍</span> 证据
            </h3>
            <div id="board-evidence-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              ${discoveredEvidence.length > 0 ? renderEvidenceCards(discoveredEvidence) : ''}
            </div>
          </div>

          <!-- 证人区 -->
          <div class="mb-6">
            <h3 class="text-sm font-bold text-stone-300 mb-3 flex items-center gap-2">
              <span>👤</span> 人物
            </h3>
            <div id="board-witness-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              ${discoveredWitnesses.length > 0 ? renderWitnessCards(discoveredWitnesses) : ''}
            </div>
          </div>

          <!-- 已建立的连线 -->
          <div>
            <h3 class="text-sm font-bold text-stone-300 mb-3 flex items-center gap-2">
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
      <div class="evidence-card cursor-pointer p-3 rounded-lg border-2 border-stone-600 bg-stone-700/50 hover:border-amber-500 hover:bg-stone-700 transition-all"
           data-id="${ev.id}" data-type="evidence" onclick="EvidenceBoard.selectItem('${ev.id}', 'evidence', this)">
        <div class="text-2xl mb-1">🔎</div>
        <div class="text-sm font-bold text-white truncate">${ev.name}</div>
        <div class="text-xs text-stone-400 mt-1 line-clamp-2">${ev.description.substring(0, 30)}...</div>
      </div>
    `).join('');
  }

  /**
   * 渲染证人卡片
   */
  function renderWitnessCards(witnessList) {
    return witnessList.map(w => `
      <div class="witness-card cursor-pointer p-3 rounded-lg border-2 border-stone-600 bg-stone-700/50 hover:border-amber-500 hover:bg-stone-700 transition-all"
           data-id="${w.id}" data-type="witness" onclick="EvidenceBoard.selectItem('${w.id}', 'witness', this)">
        <div class="text-2xl mb-1">${w.avatar || '👤'}</div>
        <div class="text-sm font-bold truncate" style="color: ${w.color || '#fff'}">${w.name}</div>
        <div class="text-xs text-stone-400 mt-1 line-clamp-2">${w.description.substring(0, 25)}...</div>
      </div>
    `).join('');
  }

  /**
   * 渲染已建立的连线列表
   */
  function renderLinksList(links) {
    if (links.length === 0) {
      return '<div class="text-stone-500 text-sm text-center py-4">还没有建立任何关联，尝试选择两个物品进行关联吧</div>';
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
    const preset = presetLinks.find(p =>
      (p.from === first.id && p.to === second.id) ||
      (p.from === second.id && p.to === first.id)
    );

    if (preset) {
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
    const playerLinks = (window.PlayerData && PlayerData.getState().evidenceLinks) || [];
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
      // 增加信心值
      if (window._gameState) {
        window._gameState.confidence = Math.min(100, window._gameState.confidence + preset.confidence);
      }
      // 自动添加到笔记推理栏
      if (window.NotebookUI && typeof NotebookUI.addItem === 'function') {
        NotebookUI.addItem('推理', `【${preset.title}】${preset.conclusion}`);
      }
    }

    // 显示成功结果
    showResultModal('success', preset);

    // 刷新证据板
    setTimeout(() => {
      closeBoard();
      openBoard();
    }, 1500);
  }

  /**
   * 处理自定义关联（失败但保存）
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

    showResultModal('fail', null, first, second);
  }

  /**
   * 显示结果模态框
   */
  function showResultModal(type, preset, first, second) {
    let title, content, icon, color;

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
        onConfirm: () => {}
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
    return presetLinks;
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
