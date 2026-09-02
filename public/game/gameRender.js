/**
 * 游戏渲染模块
 * 负责：所有渲染函数（场景/对话/审判/结局/证据栏）
 * 依赖：GameState
 */

const GameRender = (function() {
  // 证人颜色映射（统一管理，消除重复）
  const witnessColors = {
    conductor: "#3b82f6",
    "mrs-hubbard": "#ec4899",
    mary: "#8b5cf6",
    colonel: "#22c55e",
    princess: "#eab308",
    countess: "#06b6d4"
  };

  function getWitnessColor(id) {
    return witnessColors[id] || "#94a3b8";
  }

  // 火柴人渲染工具
  function stickFigure(color, size = 48) {
    return `<div style="width:${size}px;height:${size}px;position:relative;">
      <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:${size*0.4}px;height:${size*0.4}px;border-radius:50%;background:${color};"></div>
      <div style="position:absolute;top:${size*0.4}px;left:50%;transform:translateX(-50%);width:${size*0.1}px;height:${size*0.35}px;background:${color};"></div>
      <div style="position:absolute;top:${size*0.5}px;left:50%;transform:translateX(-50%) rotate(25deg);width:${size*0.3}px;height:${size*0.08}px;background:${color};transform-origin:left center;"></div>
      <div style="position:absolute;top:${size*0.5}px;left:50%;transform:translateX(-50%) rotate(-25deg);width:${size*0.3}px;height:${size*0.08}px;background:${color};transform-origin:right center;"></div>
    </div>`;
  }

  // 带表情的火柴人
  function stickFigureWithExpr(color, expr, size = 56) {
    const eyes = { normal: '● ●', happy: '◠ ◠', sad: '◡ ◡', angry: '> <', surprised: '○ ○', thinking: '● -' };
    const mouth = { normal: '—', happy: '◡', sad: '◠', angry: '︵', surprised: '○', thinking: '~' };
    return `<div style="width:${size}px;height:${size}px;position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="width:${size*0.5}px;height:${size*0.5}px;border-radius:50%;background:${color};display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:${size*0.12}px;color:#1a1a1a;">
        <div style="line-height:1;">${eyes[expr] || eyes.normal}</div>
        <div style="line-height:1;margin-top:2px;">${mouth[expr] || mouth.normal}</div>
      </div>
      <div style="width:${size*0.12}px;height:${size*0.3}px;background:${color};margin-top:-2px;"></div>
    </div>`;
  }

    function render() {
      updateTopBar();

      // 根据游戏阶段播放BGM
      if (window.AudioManager && window.AudioConfig && AudioConfig.settings.autoPlayBgm) {
        const bgmId = AudioConfig.phaseBgmMap[GameState.state.gamePhase] || 'investigation';
        AudioManager.playBgm(bgmId);
      }
      
      // 隐藏所有阶段
      document.getElementById('intro-section').classList.add('hidden');
      document.getElementById('investigation-section').classList.add('hidden');
      document.getElementById('trial-section').classList.add('hidden');
      document.getElementById('ending-section').classList.add('hidden');

      if (GameState.state.gamePhase === 'intro') {
        renderIntro();
      } else if (GameState.state.gamePhase === 'investigation') {
        renderInvestigation();
      } else if (GameState.state.gamePhase === 'trial') {
        renderTrial();
      } else if (GameState.state.gamePhase === 'ending') {
        renderEnding();
      }

      renderEvidenceBar();
      GameState.save();
    }

    function updateTopBar() {
      const phaseNames = { intro: '开场', investigation: '调查', trial: '审判', ending: '结局' };
      document.getElementById('phase-indicator').textContent = phaseNames[GameState.state.gamePhase] || '';
      document.getElementById('confidence-display').textContent = `信心值: ${GameState.state.confidence}`;
      document.getElementById('evidence-count').textContent = GameState.state.collectedEvidence.length;
      // 动态设置案件标题
      const caseTitleEl = document.getElementById('case-title');
      const caseName = window.GameData?.meta?.name || window.GameData?.meta?.title || '推理游戏';
      if (caseTitleEl) {
        caseTitleEl.textContent = caseName;
      }
      // 动态设置浏览器标签页标题
      if (document.title !== `${caseName} | Fun Detective`) {
        document.title = `${caseName} | Fun Detective`;
      }
      // 音频总开关关闭时（用户尚未提供真实音乐），隐藏音量按钮
      const audioBtn = document.getElementById('audio-toggle-btn');
      if (audioBtn) {
        const audioEnabled = window.AudioConfig?.settings?.audioEnabled === true;
        audioBtn.style.display = audioEnabled ? '' : 'none';
      }
    }

    // 开场渲染
    function renderIntro() {
      document.getElementById('intro-section').classList.remove('hidden');
      const dialogs = GameState.getGameData().gameDialogs;
      if (!dialogs) {
        document.getElementById('intro-text').textContent = '案件数据加载异常，请刷新页面';
        return;
      }
      const useIntro = GameState.state.dialogIndex < 6;
      const texts = useIntro ? dialogs.intro : dialogs.investigationStart;
      const idx = useIntro ? GameState.state.dialogIndex : GameState.state.dialogIndex - 6;
      let text = texts?.[idx];
      // 防御性处理：如果不是字符串，转换为字符串
      if (text !== null && text !== undefined && typeof text !== 'string') {
        console.warn('对话内容不是字符串:', text);
        text = typeof text === 'object' ? (text.text || text.content || JSON.stringify(text)) : String(text);
      }
      document.getElementById('intro-text').textContent = text || '';
      
      const btn = document.getElementById('intro-continue');
      if (GameState.state.dialogIndex >= 11) {
        btn.textContent = '开始调查';
      } else {
        btn.textContent = '继续';
      }
    }

    // 调查阶段渲染
    function renderInvestigation() {
      document.getElementById('investigation-section').classList.remove('hidden');
      
      // 防御性检查：场景数据必须是数组
      const scenes = GameState.getGameData().gameScenes;
      if (!Array.isArray(scenes)) {
        console.error('场景数据不是数组:', scenes);
        document.getElementById('game-scene-container').innerHTML = '<div class="text-red-400 p-4">场景数据异常，请刷新页面</div>';
        return;
      }

      // 场景切换动画
      const sceneContainer = document.getElementById('game-scene-container');
      if (sceneContainer && !GameState.state.isTransitioning) {
        GameState.state.isTransitioning = true;
        sceneContainer.style.opacity = '0';
        sceneContainer.style.transform = 'translateY(10px)';
        sceneContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => {
          sceneContainer.style.opacity = '1';
          sceneContainer.style.transform = 'translateY(0)';
          GameState.state.isTransitioning = false;
        }, 50);
      }

      const scene = scenes.find(s => s.id === GameState.state.currentScene);
      if (!scene) {
        console.error('未找到场景:', GameState.state.currentScene, '可用场景:', scenes.map(s => s.id));
        document.getElementById('game-scene-container').innerHTML = '<div class="text-red-400 p-4">场景未找到: ' + GameState.state.currentScene + '</div>';
        return;
      }

      const container = document.getElementById('game-scene-container');
      
      // 场景背景配置
      const sceneBgs = {
        train: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        room: 'linear-gradient(180deg, #2d2d2d 0%, #3d3d3d 50%, #4a4a4a 100%)',
        corridor: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 50%, #333 100%)',
        dining: 'linear-gradient(180deg, #3d2914 0%, #5c3d1e 50%, #7a5230 100%)',
        outdoor: 'linear-gradient(180deg, #87ceeb 0%, #98d8c8 50%, #f7dc6f 100%)',
        office: 'linear-gradient(180deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)',
      };
      const bgGradient = scene.sceneType ? sceneBgs[scene.sceneType] : scene.background;
      
      // 场景装饰HTML
      let sceneDecor = '';
      if (scene.sceneType === 'train') {
        sceneDecor = `<div class="absolute inset-0 pointer-events-none"><div class="absolute top-8 left-1/4 w-20 h-28 bg-gradient-to-b from-blue-900/50 to-blue-950/70 rounded-lg border-4 border-stone-700"></div><div class="absolute top-8 right-1/4 w-20 h-28 bg-gradient-to-b from-blue-900/50 to-blue-950/70 rounded-lg border-4 border-stone-700"></div><div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-stone-800 to-transparent"></div></div>`;
      } else if (scene.sceneType === 'corridor') {
        sceneDecor = `<div class="absolute inset-0 pointer-events-none"><div class="absolute top-1/4 left-4 w-10 h-28 bg-stone-700/50 rounded border-2 border-stone-600"></div><div class="absolute top-1/4 right-4 w-10 h-28 bg-stone-700/50 rounded border-2 border-stone-600"></div><div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-stone-900 to-transparent"></div></div>`;
      } else if (scene.sceneType === 'room') {
        sceneDecor = `<div class="absolute inset-0 pointer-events-none"><div class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-amber-900/60 to-transparent"></div><div class="absolute bottom-20 left-1/2 -translate-x-1/2 w-16 h-32 border-4 border-stone-600 rounded-t-lg bg-stone-800/30"></div></div>`;
      } else if (scene.sceneType === 'dining') {
        sceneDecor = `<div class="absolute inset-0 pointer-events-none"><div class="absolute bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-amber-800/60 rounded-lg"></div><div class="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-12 bg-stone-600"></div><div class="absolute top-10 left-1/2 -translate-x-1/2 w-16 h-6 bg-yellow-600/40 rounded-full blur-sm"></div></div>`;
      }
      
      // 火柴人SVG生成函数
      function stickFigure(color, size = 48) {
        return `<svg width="${size}" height="${size * 1.4}" viewBox="0 0 100 140" class="drop-shadow-lg"><circle cx="50" cy="25" r="18" fill="none" stroke="${color}" stroke-width="3"/><text x="50" y="28" text-anchor="middle" font-size="10" fill="${color}">● ●</text><text x="50" y="38" text-anchor="middle" font-size="8" fill="${color}">—</text><line x1="50" y1="43" x2="50" y2="90" stroke="${color}" stroke-width="3"/><line x1="50" y1="55" x2="25" y2="75" stroke="${color}" stroke-width="3"/><line x1="50" y1="55" x2="75" y2="75" stroke="${color}" stroke-width="3"/><line x1="50" y1="90" x2="35" y2="125" stroke="${color}" stroke-width="3"/><line x1="50" y1="90" x2="65" y2="125" stroke="${color}" stroke-width="3"/></svg>`;
      }
      
      container.innerHTML = `
        <div class="game-scene relative w-full h-[420px] rounded-xl overflow-hidden shadow-inner" style="background: ${bgGradient}">
          ${sceneDecor}
          <div class="absolute top-4 left-4 bg-black/60 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
            <h3 class="font-bold text-sm">${scene.name}</h3>
          </div>
          <div class="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
            <p class="text-sm leading-relaxed">${scene.description}</p>
          </div>
          ${scene.interactables.map(item => {
            const isCollected = item.evidenceId && GameState.state.collectedEvidence.includes(item.evidenceId);
            const isInterviewed = item.witnessId && GameState.state.interviewedWitnesses.includes(item.witnessId);
            const itemColor = item.color || (item.type === 'witness' ? '#3b82f6' : item.type === 'evidence' ? '#eab308' : '#78716c');
            if (item.type === 'witness') {
              return `<button class="absolute interactable group" style="left: ${item.position.x}%; top: ${item.position.y}%; transform: translate(-50%, -50%)" onclick="window.__interact('${item.id}', {left: event.clientX, top: event.clientY})"><div class="relative transition-all duration-300 ${isInterviewed ? 'opacity-60' : 'hover:scale-110'}">${stickFigure(itemColor)}${isInterviewed ? '<div class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>' : ''}</div><div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">${item.name}${isInterviewed ? ' (已询问)' : ''}</div></button>`;
            } else {
              const icon = item.type === 'evidence' ? (isCollected ? '✅' : '🔍') : '🚪';
              const bgColor = item.type === 'evidence' ? 'bg-yellow-500/80' : 'bg-stone-500/80';
              return `<button class="absolute interactable group" style="left: ${item.position.x}%; top: ${item.position.y}%; transform: translate(-50%, -50%)" onclick="window.__interact('${item.id}', {left: event.clientX, top: event.clientY})"><div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${bgColor} ${isCollected ? 'opacity-40 scale-90' : 'hover:scale-110'}">${icon}</div><div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">${item.name}${isCollected ? ' (已收集)' : ''}</div></button>`;
            }
          }).join('')}
          <div class="absolute top-4 right-4 flex flex-col gap-2">
            ${scene.exits.map(exit => `<button class="bg-white/90 hover:bg-white text-stone-800 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all hover:scale-105" onclick="window.__exit('${exit.to}')">${exit.label} →</button>`).join('')}
          </div>
        </div>
      `;
    }

    // 审判阶段渲染（多阶段：开场/质询/总结/判决）
    function renderTrial() {
      document.getElementById('trial-section').classList.remove('hidden');

      const { gameWitnesses, gameContradictions } = GameState.getGameData();
      const st = GameState.state;

      // 根据审判阶段渲染不同内容
      if (st.trialPhase === 'opening') {
        renderTrialOpening();
      } else if (st.trialPhase === 'questioning') {
        renderTrialQuestioning();
      } else if (st.trialPhase === 'closing') {
        renderTrialClosing();
      }

      // 异议动画遮罩
      if (st.objectionActive) {
        const overlay = document.getElementById('objection-overlay');
        if (overlay) overlay.classList.remove('hidden');
      }
    }

    // 审判开场
    function renderTrialOpening() {
      const panelContainer = document.getElementById('trial-panel-container');
      const caseData = window.GameData || {};
      const meta = caseData.meta || {};
      // 优先读案件自定义的审判开场文案，否则用meta生成通用文案
      const openingLines = caseData.trialOpening || [
        `现在开始审理${meta.name || '本案'}。${meta.victim ? '受害者' + meta.victim + '。' : ''}`,
        `${meta.detective ? meta.detective + '，' : ''}请开始你的质询。`
      ];
      const openingHtml = openingLines.map(line =>
        `<p class="text-stone-300 leading-relaxed mb-3"><span class="text-amber-400 font-bold">法官：</span>${line}</p>`
      ).join('');
      panelContainer.innerHTML = `
        <div class="bg-stone-800 rounded-xl p-8 text-center">
          <div class="text-6xl mb-4">⚖️</div>
          <h2 class="text-2xl font-bold mb-4">审判开始</h2>
          <div class="bg-stone-900/50 rounded-lg p-6 mb-6 text-left max-w-2xl mx-auto">
            ${openingHtml}
            <p class="text-stone-400 text-sm">
              提示：询问每位证人，通过追问获取更多信息，发现矛盾时点击"异议！"并出示证据反驳。
            </p>
          </div>
          <button onclick="window.__startQuestioning()" class="px-8 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-bold text-lg transition-all hover:scale-105">
            开始质询 →
          </button>
        </div>
      `;
    }

    // 审判质询阶段
    function renderTrialQuestioning() {
      const { gameWitnesses, gameContradictions } = GameState.getGameData();
      const st = GameState.state;
      const panelContainer = document.getElementById('trial-panel-container');

      // 计算进度
      const questionedCount = Object.values(st.witnessStates).filter(w => w.questioned).length;
      const contradictedCount = Object.values(st.witnessStates).filter(w => w.contradicted).length;

      panelContainer.innerHTML = `
        <div class="bg-stone-800 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold">⚖️ 证人质询</h2>
            <div class="flex items-center gap-4 text-sm">
              <span>已质询: <span class="text-amber-400 font-bold">${questionedCount}</span></span>
              <span>矛盾: <span class="text-red-400 font-bold">${contradictedCount}</span></span>
              <span>信心: <span class="${st.confidence >= 60 ? 'text-green-400' : st.confidence >= 30 ? 'text-yellow-400' : 'text-red-400'} font-bold">${st.confidence}</span></span>
            </div>
          </div>
          <div class="w-full bg-stone-700 rounded-full h-2 mb-6">
            <div class="h-2 rounded-full bg-gradient-to-r from-amber-500 to-red-500" style="width: ${(questionedCount / gameWitnesses.length) * 100}%"></div>
          </div>

          <h3 class="font-bold mb-3">选择证人：</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            ${gameWitnesses.map(w => {
              const ws = st.witnessStates[w.id] || {};
              const emotionLabels = { normal: '', confident: '😏自信', nervous: '😰紧张', angry: '😠愤怒', breakdown: '😱崩溃' };
              return `
                <button class="p-4 rounded-lg text-left transition-all ${st.currentWitness === w.id ? 'bg-amber-700 ring-2 ring-amber-400' : 'bg-stone-700 hover:bg-stone-600'} ${ws.contradicted ? 'border-2 border-red-500' : ''}" onclick="window.__selectWitness('${w.id}')">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-2xl">${w.avatar}</span>
                    <span class="font-bold text-sm">${w.name}</span>
                    ${ws.contradicted ? '<span class="text-red-400 text-xs">⚡矛盾</span>' : ''}
                  </div>
                  <p class="text-xs text-stone-400 mb-1">${w.description}</p>
                  <div class="flex gap-1 text-xs">
                    ${ws.questioned ? '<span class="text-green-400">✓已问</span>' : '<span class="text-stone-500">未问</span>'}
                    ${ws.followedUp ? '<span class="text-blue-400">✓追问</span>' : ''}
                    ${ws.emotion && ws.emotion !== 'normal' ? `<span class="text-purple-400">${emotionLabels[ws.emotion] || ''}</span>` : ''}
                  </div>
                </button>
              `;
            }).join('')}
          </div>

          ${questionedCount >= gameWitnesses.length ? `
            <button class="w-full py-3 bg-amber-600 rounded-lg font-bold hover:bg-amber-500 transition-all" onclick="window.__goToClosing()">
              进入总结陈词 →
            </button>
          ` : `
            <p class="text-center text-stone-500 text-sm">询问所有证人后可进入总结陈词</p>
          `}
        </div>
      `;

      // 如果选中了证人，显示证词
      if (st.currentWitness) {
        renderWitnessTestimony();
      }
    }

    // 渲染证人证词
    function renderWitnessTestimony() {
      const { gameWitnesses, gameContradictions } = GameState.getGameData();
      const st = GameState.state;
      const witness = gameWitnesses.find(w => w.id === st.currentWitness);
      if (!witness) return;

      const ws = st.witnessStates[witness.id] || {};
      const dialogContainer = document.getElementById('trial-dialog-container');
      const isFollowedUp = ws.followedUp || st.interviewedWitnesses.includes(witness.id);
      const testimony = isFollowedUp ? witness.followUpTestimony : witness.initialTestimony;
      const hasContradiction = witness.contradiction && !st.contradictionsFound.find(c => {
        const cont = gameContradictions.find(gc => gc.id === c);
        return cont && cont.witnessId === witness.id;
      });

      const emotionColors = {
        normal: 'text-stone-300',
        confident: 'text-blue-300',
        nervous: 'text-yellow-300',
        angry: 'text-red-300',
        breakdown: 'text-purple-300'
      };
      const textColor = emotionColors[ws.emotion] || 'text-stone-300';

      dialogContainer.innerHTML = `
        <div class="bg-stone-900/80 rounded-xl p-6 mt-4">
          <div class="flex items-start gap-4 mb-4">
            <div class="flex-shrink-0">
              ${stickFigureWithExpr(witnessColors[witness.id] || '#94a3b8', ws.emotion || 'normal', 64)}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h4 class="font-bold" style="color: ${witnessColors[witness.id] || '#94a3b8'}">${witness.name}</h4>
                ${ws.emotion && ws.emotion !== 'normal' ? `<span class="text-xs px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded">${ws.emotion}</span>` : ''}
              </div>
              <p class="${textColor} leading-relaxed">${testimony}</p>
            </div>
          </div>

          <div class="flex gap-3 flex-wrap">
            ${!ws.followedUp ? `<button class="px-4 py-2 bg-stone-600 rounded-lg hover:bg-stone-500 transition-colors" onclick="window.__followUp()">追问</button>` : ''}
            ${hasContradiction ? `<button class="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500 font-bold transition-all hover:scale-105" onclick="window.__object()">⚡ 异议！</button>` : ''}
            <button class="px-4 py-2 bg-stone-700 rounded-lg hover:bg-stone-600 transition-colors" onclick="window.__closeWitnessDialog()">关闭</button>
          </div>
        </div>
      `;
    }

    // 审判总结陈词
    function renderTrialClosing() {
      const { gameWitnesses, gameContradictions } = GameState.getGameData();
      const st = GameState.state;
      const panelContainer = document.getElementById('trial-panel-container');

      const foundContradictions = st.contradictionsFound.map(id => {
        return gameContradictions.find(c => c.id === id);
      }).filter(Boolean);

      panelContainer.innerHTML = `
        <div class="bg-stone-800 rounded-xl p-6">
          <h2 class="text-xl font-bold mb-4">📋 总结陈词</h2>
          <div class="bg-stone-900/50 rounded-lg p-4 mb-6">
            <p class="text-stone-300 leading-relaxed mb-3">
              <span class="text-amber-400 font-bold">波洛：</span>各位，经过详细的质询，我已经发现了${foundContradictions.length}处关键矛盾。让我们整理一下线索...
            </p>
          </div>

          <h3 class="font-bold mb-3">已发现的矛盾：</h3>
          <div class="space-y-2 mb-6">
            ${foundContradictions.length > 0 ? foundContradictions.map(c => `
              <div class="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <p class="text-sm text-red-300">⚡ ${c.description}</p>
              </div>
            `).join('') : '<p class="text-stone-500 text-sm">未发现矛盾点</p>'}
          </div>

          <div class="flex items-center justify-between mb-4 p-3 bg-stone-900/50 rounded-lg">
            <span class="text-stone-400">最终信心值：</span>
            <span class="text-2xl font-bold ${st.confidence >= 60 ? 'text-green-400' : st.confidence >= 30 ? 'text-yellow-400' : 'text-red-400'}">${st.confidence}</span>
          </div>

          <button class="w-full py-3 bg-amber-600 rounded-lg font-bold hover:bg-amber-500 transition-all" onclick="window.__goToEnding()">
            进入最终选择 →
          </button>
        </div>
      `;
    }

    // 结局渲染
    function renderEnding() {
      document.getElementById('ending-section').classList.remove('hidden');
      const choice = GameState.state.choices['final-choice'];
      let ending;
      if (choice === 'reveal') {
        ending = { name: '真相大白', description: '你揭露了真相：12名乘客都是凶手，他们为了给阿姆斯特朗一家复仇，每人刺了一刀。你选择将真相告诉警方。正义得到了伸张，但法外之情也令人唏嘘。' };
      } else {
        ending = { name: '法外容情', description: '你揭露了真相，但理解了12人的动机。你选择向警方隐瞒真相，说凶手已经逃走。正义，有时在法律之外。波洛的内心，或许永远不会平静。' };
      }

      // 信心值评级
      const confidence = GameState.state.confidence;
      let grade, gradeColor, gradeText;
      if (confidence >= 90) { grade = 'S'; gradeColor = 'text-yellow-400'; gradeText = '完美推理！你洞察了一切真相'; }
      else if (confidence >= 70) { grade = 'A'; gradeColor = 'text-green-400'; gradeText = '出色的推理，几乎没有遗漏'; }
      else if (confidence >= 50) { grade = 'B'; gradeColor = 'text-blue-400'; gradeText = '不错的推理，但还有一些疑点'; }
      else if (confidence >= 30) { grade = 'C'; gradeColor = 'text-yellow-500'; gradeText = '推理不够充分，真相仍有迷雾'; }
      else { grade = 'D'; gradeColor = 'text-red-400'; gradeText = '推理失败，真凶逍遥法外'; }

      document.getElementById('ending-title').textContent = ending.name;
      document.getElementById('ending-description').textContent = ending.description;
      document.getElementById('stat-evidence').textContent = GameState.state.collectedEvidence.length;
      document.getElementById('stat-witness').textContent = GameState.state.interviewedWitnesses.length;
      document.getElementById('stat-contradiction').textContent = GameState.state.contradictionsFound.length;
      document.getElementById('stat-confidence').textContent = GameState.state.confidence;

      // 显示评级
      const gradeEl = document.getElementById('ending-grade');
      if (gradeEl) {
        gradeEl.innerHTML = `<div class="text-center mb-4"><div class="text-6xl font-bold ${gradeColor}">${grade}</div><div class="text-sm text-stone-400 mt-2">${gradeText}</div></div>`;
      }
    }

    // 证据栏渲染
    function renderEvidenceBar() {
      const container = document.getElementById('evidence-bar-container');
      if (!GameState.state.showEvidenceBar) {
        container.innerHTML = '';
        return;
      }
      
      const evidence = GameState.state.collectedEvidence.map(id => GameState.getGameData().gameEvidence.find(e => e.id === id)).filter(Boolean);
      container.innerHTML = `
        <div class="fixed bottom-0 left-0 right-0 bg-stone-900 p-4 z-50 border-t border-stone-700">
          <div class="container-page">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold">${GameState.state.evidenceMode === 'select' ? '选择要出示的证据' : `证据栏 (${evidence.length})`}</h3>
              ${GameState.state.evidenceMode === 'select' ? `<button class="text-sm text-stone-400 hover:text-white" onclick="window.__cancelEvidence()">取消</button>` : ''}
            </div>
            ${evidence.length === 0 ? '<p class="text-stone-400 text-sm">还没有收集到任何证据</p>' : `
              <div class="flex gap-3 overflow-x-auto pb-2">
                ${evidence.map(e => `
                  <button class="flex-shrink-0 w-40 p-3 rounded-lg text-left transition-all ${GameState.state.selectedEvidence === e.id ? 'bg-primary-600 ring-2 ring-primary-400' : 'bg-stone-800 hover:bg-stone-700'}" onclick="window.__selectEvidence('${e.id}')">
                    <div class="font-bold text-sm mb-1">${e.name}</div>
                    <div class="text-xs text-stone-300">${e.description}</div>
                    ${GameState.state.selectedEvidence === e.id && GameState.state.evidenceMode === 'select' ? '<div class="mt-2 text-xs text-primary-200">点击确认出示</div>' : ''}
                  </button>
                `).join('')}
              </div>
            `}
            ${GameState.state.evidenceMode === 'select' && GameState.state.selectedEvidence ? `
              <button class="mt-3 w-full py-2 bg-yellow-600 rounded-lg font-bold hover:bg-yellow-500" onclick="window.__confirmPresentEvidence()">
                确认出示「${GameState.getGameData().gameEvidence.find(e => e.id === GameState.state.selectedEvidence)?.name}」
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }


    // 记录对话历史

  return {
    render,
    updateTopBar,
    renderIntro,
    renderInvestigation,
    renderTrial,
    renderEnding,
    renderEvidenceBar,
    stickFigure,
    stickFigureWithExpr,
    getWitnessColor,
    witnessColors
  };
})();

window.GameRender = GameRender;
