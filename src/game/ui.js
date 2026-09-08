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
  let _escBound = false;
  let _lastFocusedElement = null;

  // ========== SVG 图标库（替换 emoji，统一视觉风格） ==========
  const icons = {
    evidence: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    notebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    timeline: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    relation: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    help: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    reset: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
    exit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    more: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    door: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    eye: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
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
    const icons_svg = {
      info: icons.info,
      success: icons.success,
      warning: icons.warning,
      error: icons.error,
    };

    const toast = createElement(`
      <div class="fixed top-20 left-1/2 -translate-x-1/2 z-[100] ${colors[type]} text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 transform translate-y-[-20px] opacity-0 transition-all duration-300" role="status" aria-live="polite">
        <span class="flex items-center">${icons_svg[type]}</span>
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
      <div id="game-dialog-overlay" class="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="对话" onclick="GameUI._handleDialogOverlayClick(event)">
        <div class="w-full max-w-3xl bg-stone-800 rounded-t-2xl shadow-2xl border-t border-stone-600 overflow-hidden transform translate-y-full transition-transform duration-300" id="game-dialog-box" data-tour="dialog">
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
              <button onclick="GameUI.removeDialog()" class="text-stone-400 hover:text-white text-xl w-11 h-11 flex items-center justify-center rounded hover:bg-stone-700 transition-colors" aria-label="关闭对话" style="min-height:44px;">×</button>
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

    // 记录触发元素，关闭后恢复焦点
    _lastFocusedElement = document.activeElement;

    const card = createElement(`
      <div id="game-evidence-overlay" class="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm" onclick="GameUI._handleEvidenceOverlayClick(event)" role="dialog" aria-modal="true" aria-labelledby="evidence-card-title">
        <div class="w-full max-w-md bg-stone-800 rounded-2xl shadow-2xl border border-stone-600 overflow-hidden transform scale-95 opacity-0 transition-all duration-300" id="game-evidence-card">
          <!-- 卡片头部 -->
          <div class="bg-gradient-to-r from-amber-900/50 to-stone-800 p-4 border-b border-stone-600 flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-amber-600/30 rounded-lg flex items-center justify-center text-2xl">🔍</div>
              <div>
                <h3 id="evidence-card-title" class="font-bold text-lg text-amber-400">${escapeHtml(evidence.name)}</h3>
                <p class="text-xs text-stone-400">发现于：${escapeHtml(evidence.foundIn || '犯罪现场')}</p>
              </div>
            </div>
            <button onclick="GameUI.removeEvidenceCard()" class="text-stone-400 hover:text-white text-xl w-11 h-11 flex items-center justify-center rounded hover:bg-stone-700 transition-colors" aria-label="关闭证据详情" style="min-height:44px;">×</button>
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
      if (cardEl) {
        cardEl.style.transform = 'scale(1)';
        cardEl.style.opacity = '1';
        // 初始焦点到关闭按钮
        const closeBtn = cardEl.querySelector('button[aria-label="关闭证据详情"]');
        if (closeBtn) closeBtn.focus();
      }
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
      content = null,  // 富文本内容（不转义），优先于 message
      confirmText = '确认',
      cancelText = '取消',
      onConfirm = null,
      onCancel = null,
      type = 'warning',
      hideCancel = false,
    } = options;

    const colors = {
      warning: 'bg-yellow-600 hover:bg-yellow-500',
      danger: 'bg-red-600 hover:bg-red-500',
      info: 'bg-blue-600 hover:bg-blue-500',
    };
    const modalIcons = {
      warning: icons.warning,
      danger: icons.error,
      info: icons.info,
    };

    removeModal();

    const modal = createElement(`
      <div id="game-modal-overlay" class="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="确认对话框" onclick="GameUI._handleModalOverlayClick(event)">
        <div class="w-full max-w-sm bg-stone-800 rounded-2xl shadow-2xl border border-stone-600 overflow-hidden transform scale-95 opacity-0 transition-all duration-200" id="game-modal-box">
          <div class="p-6 text-center">
            <div class="mb-4 flex justify-center text-amber-400">${modalIcons[type] || icons.info}</div>
            <h3 class="font-bold text-xl mb-2">${escapeHtml(title)}</h3>
            ${content ? `<div class="text-left">${content}</div>` : `<p class="text-stone-400 text-sm">${escapeHtml(message)}</p>`}
          </div>
          <div class="flex gap-2 px-6 pb-6">
            ${hideCancel ? '' : `<button onclick="GameUI.cancelModal()" class="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors">
              ${escapeHtml(cancelText)}
            </button>`}
            <button onclick="GameUI.confirmModal()" class="${hideCancel ? 'flex-1' : 'flex-1'} px-4 py-2 ${colors[type]} rounded-lg font-bold transition-colors">
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

  // ========== 更多菜单 ==========
  function toggleMoreMenu() {
    const menu = document.getElementById('more-menu');
    if (!menu) return;
    if (menu.classList.contains('hidden')) {
      openMoreMenu();
    } else {
      closeMoreMenu();
    }
  }

  function openMoreMenu() {
    const menu = document.getElementById('more-menu');
    if (menu) {
      menu.classList.remove('hidden');
      // 点击外部关闭
      setTimeout(() => {
        document.addEventListener('click', _outsideMoreMenuClick, { once: true });
      }, 10);
    }
  }

  function closeMoreMenu() {
    const menu = document.getElementById('more-menu');
    if (menu) menu.classList.add('hidden');
    document.removeEventListener('click', _outsideMoreMenuClick);
  }

  function _outsideMoreMenuClick(e) {
    const menu = document.getElementById('more-menu');
    const moreBtn = document.getElementById('more-btn');
    if (menu && !menu.contains(e.target) && moreBtn && !moreBtn.contains(e.target)) {
      closeMoreMenu();
    }
  }

  // ========== 无障碍：焦点管理与 Esc 处理 ==========
  function openOverlay(overlayId, focusSelector) {
    _lastFocusedElement = document.activeElement;
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    setTimeout(() => {
      const focusEl = overlay.querySelector(focusSelector || 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusEl) focusEl.focus();
    }, 50);
  }

  function closeOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) overlay.classList.add('hidden');
    if (_lastFocusedElement && typeof _lastFocusedElement.focus === 'function') {
      _lastFocusedElement.focus();
    }
  }

  function handleEscKey(e) {
    if (e.key !== 'Escape') return;
    const overlays = [
      { id: 'game-modal-overlay', close: () => GameUI.cancelModal() },
      { id: 'notebook-overlay', close: () => { if (window.NotebookUI) NotebookUI.close(); } },
      { id: 'evidence-board-overlay', close: () => { if (window.EvidenceBoard) EvidenceBoard.closeBoard(); } },
      { id: 'game-evidence-overlay', close: () => GameUI.removeEvidenceCard() },
      { id: 'timeline-overlay', close: () => { if (window.TimelineUI) TimelineUI.close(); } },
      { id: 'tutorial-overlay', close: () => { if (window.GuideUI) GuideUI.closeTutorial(); } },
      { id: 'more-menu', close: () => GameUI.closeMoreMenu() },
      { id: 'game-dialog-overlay', close: () => GameUI.removeDialog() },
      { id: 'objection-overlay', close: () => {
        // 异议遮罩：Esc 可提前关闭动画
        if (window.GameState) GameState.state.objectionActive = false;
        if (window.GameRender) GameRender.render();
      } }
      // 注意：ending-overlay 是终局界面，不允许 Esc 取消，只能通过按钮离开
    ];
    for (const ov of overlays) {
      const el = document.getElementById(ov.id);
      if (el && !el.classList.contains('hidden')) {
        ov.close();
        e.preventDefault();
        return;
      }
    }
  }

  if (!_escBound) {
    document.addEventListener('keydown', handleEscKey);
    _escBound = true;
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
    toggleMoreMenu,
    openMoreMenu,
    closeMoreMenu,
    openOverlay,
    closeOverlay,
    handleEscKey,
    icons,
    getDialogHistory: () => state.dialogHistory,
    clearDialogHistory: () => { state.dialogHistory = []; },
  };
})();

// 挂载到全局
window.GameUI = GameUI;
