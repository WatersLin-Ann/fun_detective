/**
 * 游戏UI工具模块
 * 包含对话框、证据卡片、模态框、Toast通知等通用UI组件
 * 纯前端实现，无外部依赖
 */

const GameUI = (function() {
  // ========== 状态管理 ==========
  const state = {
    dialogHistory: [],
    isTyping: false,
    typewriterTimer: null,
    dialogRemoveTimer: null,
  };

  // ========== 工具函数 ==========
  function createElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========== Toast 通知 ==========
  function showToast(message, type = 'info', duration = 2500) {
    const colors = {
      info: 'bg-blue-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600',
    };
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };

    const toast = createElement(`
      <div class="fixed top-20 left-1/2 -translate-x-1/2 z-[100] ${colors[type]} text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 transform translate-y-[-20px] opacity-0 transition-all duration-300">
        <span>${icons[type]}</span>
        <span class="font-medium">${escapeHtml(message)}</span>
      </div>
    `);
    document.body.appendChild(toast);

    // 入场动画（setTimeout替代rAF，兼容后台标签）
    setTimeout(() => {
      toast.style.transform = 'translate(-50%, 0)';
      toast.style.opacity = '1';
    }, 10);

    // 自动消失
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -20px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ========== 对话框系统 ==========
  /**
   * 显示对话框
   * @param {Object} options - 对话框配置
   * @param {string} options.speaker - 说话人名字
   * @param {string} options.color - 说话人颜色（hex）
   * @param {string} options.text - 对话内容
   * @param {Array} options.options - 选项列表 [{text, action, condition}]
   * @param {Function} options.onComplete - 对话显示完成回调
   * @param {boolean} options.showHistory - 是否显示历史按钮
   */
  function showDialog(options) {
    const {
      speaker = '',
      color = '#ffffff',
      text = '',
      options: choices = [],
      onComplete = null,
      showHistory = true,
    } = options;

    // 记录到历史
    if (speaker && text) {
      state.dialogHistory.push({ speaker, text, color, time: Date.now() });
      if (state.dialogHistory.length > 100) {
        state.dialogHistory = state.dialogHistory.slice(-100);
      }
    }

    // 移除已有对话框（立即移除，不等退场动画，防止与新对话框冲突）
    if (state.dialogRemoveTimer) {
      clearTimeout(state.dialogRemoveTimer);
      state.dialogRemoveTimer = null;
    }
    const oldOverlay = document.getElementById('game-dialog-overlay');
    if (oldOverlay) oldOverlay.remove();

    const dialog = createElement(`
      <div id="game-dialog-overlay" class="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 backdrop-blur-sm" onclick="GameUI._handleDialogOverlayClick(event)">
        <div class="w-full max-w-3xl bg-stone-800 rounded-t-2xl shadow-2xl border-t border-stone-600 overflow-hidden transform translate-y-full transition-transform duration-300" id="game-dialog-box">
          <!-- 历史记录面板 -->
          <div id="game-dialog-history" class="hidden max-h-48 overflow-y-auto bg-stone-900/80 p-4 border-b border-stone-700">
            <div class="text-xs text-stone-400 mb-2">对话历史</div>
            <div id="game-dialog-history-list"></div>
          </div>
          <!-- 对话头部 -->
          <div class="flex items-center justify-between px-6 py-3 bg-stone-900/50 border-b border-stone-700">
            <div class="flex items-center gap-2">
              ${speaker ? `<span class="font-bold" style="color: ${color}">${escapeHtml(speaker)}</span>` : ''}
            </div>
            <div class="flex items-center gap-2">
              ${showHistory ? `<button onclick="GameUI.toggleDialogHistory()" class="text-xs text-stone-400 hover:text-white px-2 py-1 rounded hover:bg-stone-700">历史 (${state.dialogHistory.length})</button>` : ''}
              <button onclick="GameUI.removeDialog()" class="text-stone-400 hover:text-white text-xl leading-none">×</button>
            </div>
          </div>
          <!-- 对话内容 -->
          <div class="p-6 min-h-[120px]">
            <p id="game-dialog-text" class="text-stone-200 leading-relaxed text-base"></p>
          </div>
          <!-- 选项区域 -->
          <div id="game-dialog-options" class="px-6 pb-6 flex flex-col gap-2"></div>
        </div>
      </div>
    `);

    document.body.appendChild(dialog);

    // 入场动画（用setTimeout而非rAF，避免后台标签时永久不可见）
    setTimeout(() => {
      document.getElementById('game-dialog-box').style.transform = 'translateY(0)';
    }, 10);

    // 打字机效果
    const textEl = document.getElementById('game-dialog-text');
    let charIndex = 0;
    state.isTyping = true;

    function typeNext() {
      if (charIndex < text.length) {
        textEl.textContent = text.substring(0, charIndex + 1);
        charIndex++;
        state.typewriterTimer = setTimeout(typeNext, 30);
      } else {
        state.isTyping = false;
        // 移除跳过提示
        const skipHint = document.getElementById('game-dialog-skip-hint');
        if (skipHint) skipHint.remove();
        // 显示选项
        renderOptions(choices, onComplete);
        if (onComplete) onComplete();
      }
    }
    typeNext();

    // 打字机期间显示跳过提示
    if (text.length > 10) {
      const skipHint = document.createElement('div');
      skipHint.id = 'game-dialog-skip-hint';
      skipHint.className = 'absolute bottom-2 right-4 text-stone-500 text-xs animate-pulse';
      skipHint.textContent = '▸ 点击跳过';
      const dialogBox = document.getElementById('game-dialog-box');
      if (dialogBox) dialogBox.style.position = 'relative';
      const textContainer = textEl.parentElement;
      if (textContainer) {
        textContainer.style.position = 'relative';
        textContainer.appendChild(skipHint);
      }
    }

    // 点击跳过打字机
    textEl.onclick = () => {
      if (state.isTyping) {
        clearTimeout(state.typewriterTimer);
        textEl.textContent = text;
        state.isTyping = false;
        const skipHint = document.getElementById('game-dialog-skip-hint');
        if (skipHint) skipHint.remove();
        renderOptions(choices, onComplete);
        if (onComplete) onComplete();
      }
    };

    // 渲染历史
    renderHistory();
  }

  function renderOptions(choices, onComplete) {
    const container = document.getElementById('game-dialog-options');
    if (!container) return;

    if (choices.length === 0) {
      // 没有选项时显示继续按钮
      container.innerHTML = `
        <button onclick="GameUI.removeDialog()" class="self-end px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-medium transition-colors">
          继续
        </button>
      `;
      return;
    }

    container.innerHTML = choices.map((choice, i) => {
      const disabled = choice.condition === false;
      return `
        <button
          onclick="GameUI._selectOption(${i})"
          class="text-left px-4 py-3 rounded-lg transition-all ${disabled ? 'bg-stone-700/50 text-stone-500 cursor-not-allowed' : 'bg-stone-700 hover:bg-stone-600 text-white hover:translate-x-1'}"
          ${disabled ? 'disabled' : ''}
        >
          <span class="text-primary-400 mr-2">${String.fromCharCode(65 + i)}.</span>
          ${escapeHtml(choice.text)}
          ${choice.hint ? `<span class="text-xs text-stone-400 ml-2">(${choice.hint})</span>` : ''}
        </button>
      `;
    }).join('');

    // 存储选项回调
    window._dialogChoices = choices;
  }

  function _selectOption(index) {
    const choices = window._dialogChoices || [];
    const choice = choices[index];
    if (choice && choice.action) {
      removeDialog();
      choice.action();
    }
  }

  function _handleDialogOverlayClick(event) {
    // 点击遮罩不关闭，防止误触
    if (event.target.id === 'game-dialog-overlay') {
      // 不做任何事
    }
  }

  function toggleDialogHistory() {
    const panel = document.getElementById('game-dialog-history');
    if (panel) {
      panel.classList.toggle('hidden');
      renderHistory();
    }
  }

  function renderHistory() {
    const list = document.getElementById('game-dialog-history-list');
    if (!list) return;

    const recent = state.dialogHistory.slice(-20);
    list.innerHTML = recent.map(h => `
      <div class="text-sm py-1 border-b border-stone-700/50">
        <span class="font-medium" style="color: ${h.color}">${escapeHtml(h.speaker)}：</span>
        <span class="text-stone-400">${escapeHtml(h.text.substring(0, 80))}${h.text.length > 80 ? '...' : ''}</span>
      </div>
    `).join('');

    // 滚动到底部
    list.scrollTop = list.scrollHeight;
  }

  function removeDialog() {
    // 清除之前的移除定时器，防止旧定时器移除新对话框
    if (state.dialogRemoveTimer) {
      clearTimeout(state.dialogRemoveTimer);
      state.dialogRemoveTimer = null;
    }
    const overlay = document.getElementById('game-dialog-overlay');
    if (overlay) {
      const box = document.getElementById('game-dialog-box');
      if (box) {
        box.style.transform = 'translateY(100%)';
        state.dialogRemoveTimer = setTimeout(() => {
          overlay.remove();
          state.dialogRemoveTimer = null;
        }, 300);
      } else {
        overlay.remove();
      }
    }
    clearTimeout(state.typewriterTimer);
    state.isTyping = false;
  }

  // ========== 证据卡片系统 ==========
  /**
   * 显示证据卡片
   * @param {Object} evidence - 证据对象
   * @param {Function} onCollect - 收集回调
   */
  function showEvidenceCard(evidence, onCollect = null) {
    removeEvidenceCard();

    const card = createElement(`
      <div id="game-evidence-overlay" class="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm" onclick="GameUI._handleEvidenceOverlayClick(event)">
        <div class="w-full max-w-md bg-stone-800 rounded-2xl shadow-2xl border border-stone-600 overflow-hidden transform scale-95 opacity-0 transition-all duration-300" id="game-evidence-card">
          <!-- 卡片头部 -->
          <div class="bg-gradient-to-r from-amber-900/50 to-stone-800 p-4 border-b border-stone-600">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-amber-600/30 rounded-lg flex items-center justify-center text-2xl">🔍</div>
              <div>
                <h3 class="font-bold text-lg text-amber-400">${escapeHtml(evidence.name)}</h3>
                <p class="text-xs text-stone-400">发现于：${escapeHtml(evidence.foundIn || '犯罪现场')}</p>
              </div>
            </div>
          </div>
          <!-- 观察到的事实 -->
          <div class="p-4">
            <div class="text-xs text-stone-400 mb-2 uppercase tracking-wide">观察到的事实</div>
            <p class="text-stone-200 text-sm leading-relaxed mb-4">${escapeHtml(evidence.description)}</p>
            <!-- 可展开的细节 -->
            <div id="evidence-detail" class="hidden">
              <div class="text-xs text-stone-400 mb-2 uppercase tracking-wide">进一步观察</div>
              <p class="text-stone-300 text-sm leading-relaxed bg-stone-900/50 p-3 rounded-lg">${escapeHtml(evidence.keyInfo || '')}</p>
              <p class="text-xs text-stone-500 mt-2 italic">💡 这只是观察到的事实，推理需要你自己完成</p>
            </div>
          </div>
          <!-- 操作按钮 -->
          <div class="px-4 pb-4 flex gap-2">
            <button onclick="GameUI.toggleEvidenceDetail()" class="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm transition-colors">
              查看细节
            </button>
            <button onclick="GameUI.collectEvidence()" class="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-bold transition-colors">
              加入证据栏
            </button>
          </div>
        </div>
      </div>
    `);

    document.body.appendChild(card);

    // 入场动画（setTimeout替代rAF，兼容后台标签）
    setTimeout(() => {
      const cardEl = document.getElementById('game-evidence-card');
      cardEl.style.transform = 'scale(1)';
      cardEl.style.opacity = '1';
    });

    // 存储回调
    window._evidenceCollectCallback = onCollect;
    window._currentEvidence = evidence;
  }

  function toggleEvidenceDetail() {
    const detail = document.getElementById('evidence-detail');
    if (detail) {
      detail.classList.toggle('hidden');
    }
  }

  function collectEvidence() {
    const evidence = window._currentEvidence;
    const callback = window._evidenceCollectCallback;
    removeEvidenceCard();
    if (callback) callback(evidence);
  }

  function _handleEvidenceOverlayClick(event) {
    if (event.target.id === 'game-evidence-overlay') {
      removeEvidenceCard();
    }
  }

  function removeEvidenceCard() {
    const overlay = document.getElementById('game-evidence-overlay');
    if (overlay) {
      const card = document.getElementById('game-evidence-card');
      if (card) {
        card.style.transform = 'scale(0.95)';
        card.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
      } else {
        overlay.remove();
      }
    }
  }

  // ========== 模态框系统 ==========
  /**
   * 显示确认模态框
   * @param {Object} options - 配置
   * @param {string} options.title - 标题
   * @param {string} options.message - 消息
   * @param {string} options.confirmText - 确认按钮文字
   * @param {string} options.cancelText - 取消按钮文字
   * @param {Function} options.onConfirm - 确认回调
   * @param {Function} options.onCancel - 取消回调
   * @param {string} options.type - 类型：warning/info/danger
   */
  function showModal(options) {
    const {
      title = '确认',
      message = '',
      confirmText = '确认',
      cancelText = '取消',
      onConfirm = null,
      onCancel = null,
      type = 'warning',
    } = options;

    const colors = {
      warning: 'bg-yellow-600 hover:bg-yellow-500',
      danger: 'bg-red-600 hover:bg-red-500',
      info: 'bg-blue-600 hover:bg-blue-500',
    };
    const icons = {
      warning: '⚠️',
      danger: '🚨',
      info: 'ℹ️',
    };

    removeModal();

    const modal = createElement(`
      <div id="game-modal-overlay" class="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 backdrop-blur-sm" onclick="GameUI._handleModalOverlayClick(event)">
        <div class="w-full max-w-sm bg-stone-800 rounded-2xl shadow-2xl border border-stone-600 overflow-hidden transform scale-95 opacity-0 transition-all duration-200" id="game-modal-box">
          <div class="p-6 text-center">
            <div class="text-4xl mb-4">${icons[type]}</div>
            <h3 class="font-bold text-xl mb-2">${escapeHtml(title)}</h3>
            <p class="text-stone-400 text-sm">${escapeHtml(message)}</p>
          </div>
          <div class="flex gap-2 px-6 pb-6">
            <button onclick="GameUI.cancelModal()" class="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors">
              ${escapeHtml(cancelText)}
            </button>
            <button onclick="GameUI.confirmModal()" class="flex-1 px-4 py-2 ${colors[type]} rounded-lg font-bold transition-colors">
              ${escapeHtml(confirmText)}
            </button>
          </div>
        </div>
      </div>
    `);

    document.body.appendChild(modal);

    // 入场动画（setTimeout替代rAF，兼容后台标签）
    setTimeout(() => {
      const box = document.getElementById('game-modal-box');
      box.style.transform = 'scale(1)';
      box.style.opacity = '1';
    }, 10);

    window._modalCallbacks = { onConfirm, onCancel };
  }

  function confirmModal() {
    const callbacks = window._modalCallbacks;
    removeModal();
    if (callbacks && callbacks.onConfirm) callbacks.onConfirm();
  }

  function cancelModal() {
    const callbacks = window._modalCallbacks;
    removeModal();
    if (callbacks && callbacks.onCancel) callbacks.onCancel();
  }

  function _handleModalOverlayClick(event) {
    if (event.target.id === 'game-modal-overlay') {
      cancelModal();
    }
  }

  function removeModal() {
    const overlay = document.getElementById('game-modal-overlay');
    if (overlay) overlay.remove();
  }

  // ========== 收集动画 ==========
  /**
   * 播放证据收集动画（从点击位置飞到证据栏）
   * @param {number} startX - 起始X
   * @param {number} startY - 起始Y
   * @param {string} itemName - 物品名
   */
  function playCollectAnimation(startX, startY, itemName) {
    const flyItem = createElement(`
      <div class="fixed z-[100] pointer-events-none text-3xl" style="left: ${startX}px; top: ${startY}px; transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);">
        🔍
      </div>
    `);
    document.body.appendChild(flyItem);

    // 目标位置：证据栏按钮
    const target = document.getElementById('evidence-btn');
    const targetRect = target ? target.getBoundingClientRect() : { left: window.innerWidth - 100, top: 20 };

    // 飞行动画（setTimeout替代rAF，兼容后台标签）
    setTimeout(() => {
      flyItem.style.left = targetRect.left + 'px';
      flyItem.style.top = targetRect.top + 'px';
      flyItem.style.transform = 'scale(0.3) rotate(360deg)';
      flyItem.style.opacity = '0.5';
    }, 10);

    setTimeout(() => {
      flyItem.remove();
      // 证据栏按钮抖动
      if (target) {
        target.style.transform = 'scale(1.2)';
        setTimeout(() => target.style.transform = 'scale(1)', 200);
      }
    }, 800);
  }

  // ========== 导出公共API ==========
  return {
    showToast,
    showDialog,
    removeDialog,
    toggleDialogHistory,
    _selectOption,
    _handleDialogOverlayClick,
    showEvidenceCard,
    toggleEvidenceDetail,
    collectEvidence,
    removeEvidenceCard,
    _handleEvidenceOverlayClick,
    showModal,
    confirmModal,
    cancelModal,
    removeModal,
    _handleModalOverlayClick,
    playCollectAnimation,
    getDialogHistory: () => state.dialogHistory,
    clearDialogHistory: () => { state.dialogHistory = []; },
  };
})();

// 挂载到全局
window.GameUI = GameUI;
