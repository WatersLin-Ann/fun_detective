/**
 * 游戏交互处理模块
 * 负责：所有用户交互（场景点击/对话/审判/证据/音效）
 * 依赖：GameState, GameRender, GameUI, PlayerData, EvidenceBoard, AudioManager
 */

const GameInteractions = (function() {
  // 证人颜色映射
  const witnessColors = {
    conductor: "#3b82f6",
    "mrs-hubbard": "#ec4899",
    mary: "#8b5cf6",
    colonel: "#22c55e",
    princess: "#eab308",
    countess: "#06b6d4"
  };

    function addDialogueHistory(speaker, text, color) {
      if (!GameState.state.dialogueHistory) GameState.state.dialogueHistory = [];
      GameState.state.dialogueHistory.push({ speaker, text, color, time: Date.now() });
      // 最多保留50条
      if (GameState.state.dialogueHistory.length > 50) {
        GameState.state.dialogueHistory = GameState.state.dialogueHistory.slice(-50);
      }
    }
    
    // 切换对话历史显示
    window.__toggleTrialHistory = function() {
      GameState.state.showHistory = !GameState.state.showHistory;
      const panel = document.getElementById('trial-history-panel');
      if (panel) panel.classList.toggle('hidden');
      renderTrial();
    };
    
    // 设置证人表情
    function setWitnessReaction(reaction) {
      GameState.state.witnessReaction = reaction;
      setTimeout(() => {
        GameState.state.witnessReaction = 'normal';
        if (GameState.state.currentWitness) renderTrial();
      }, 2000);
    }

    // 游戏交互函数
    window.__introContinue = function() {
      GameState.state.dialogIndex++;
      const dialogs = GameState.getGameData().gameDialogs;
      const introLen = dialogs?.intro?.length || 6;
      const invStartLen = dialogs?.investigationStart?.length || 6;
      const totalIntro = introLen + invStartLen;
      const meta = window.GameData?.meta || {};

      if (GameState.state.dialogIndex >= totalIntro) {
        // 纯法庭案件（如逆转裁判）开场结束直接进入审判
        if (meta.flowType === 'courtroom-only') {
          GameState.state.gamePhase = 'trial';
          GameState.state.trialPhase = 'opening';
          GameState.state.currentScene = meta.trialScene || 'courtroom';
          // 纯法庭案件证据在开庭时全部预置
          if (Array.isArray(GameState.getGameData().gameEvidence)) {
            GameState.state.collectedEvidence = GameState.getGameData().gameEvidence.map(e => e.id);
            GameState.state.interviewedWitnesses = [];
          }
        } else {
          GameState.state.gamePhase = 'investigation';
          // 从案件配置取首个调查场景，兼容数组/对象两种scenes结构
          const scenes = GameState.getGameData().gameScenes;
          let firstScene = meta.firstScene;
          if (!firstScene) {
            if (Array.isArray(scenes)) {
              firstScene = (scenes.find(s => s.id !== 'intro') || scenes[0])?.id;
            } else if (scenes && typeof scenes === 'object') {
              firstScene = Object.values(scenes).find(s => s.id !== 'intro')?.id || Object.keys(scenes)[0];
            }
          }
          GameState.state.currentScene = firstScene || 'corridor';
        }
        GameState.state.dialogIndex = 0;
        GameState.save();
      }
      GameRender.render();
    };

    window.__interact = function(itemId, sourceRect) {
      const scene = GameState.getGameData().gameScenes.find(s => s.id === GameState.state.currentScene);
      const item = scene?.interactables.find(i => i.id === itemId);
      if (!item) return;

      if (item.type === 'evidence' && item.evidenceId) {
        if (!GameState.state.collectedEvidence.includes(item.evidenceId)) {
          const evidence = GameState.getGameData().gameEvidence.find(e => e.id === item.evidenceId);
          // 使用证据卡片替代alert
          GameUI.showEvidenceCard(evidence, (ev) => {
            GameState.state.collectedEvidence.push(ev.id);
            playSfx('collect_evidence');
            GameUI.showToast(`收集到证据：${ev.name}`, 'success');
            // 自动添加到笔记线索
            PlayerData.addNotebookItem('clues', `【证据】${ev.name}：${ev.description}`);
            // 自动收集该证据的时间线索
            if (window.TimelineUI) {
              TimelineUI.autoDiscoverBySource('证据', ev.id);
            }
            // 更新引导系统
            if (window.GuideUI) {
              GuideUI.updateLastAction();
              GuideUI.checkObjectives();
              GuideUI.renderObjective();
            }
            // 播放收集动画（使用传入的源位置，无则用屏幕中心）
            const rect = sourceRect || { left: window.innerWidth / 2, top: window.innerHeight / 2 };
            GameUI.playCollectAnimation(rect.left, rect.top, ev.name);
            GameRender.render();
          });
        } else {
          const evidence = GameState.getGameData().gameEvidence.find(e => e.id === item.evidenceId);
          GameUI.showEvidenceCard(evidence, null);
        }
      } else if (item.type === 'witness' && item.witnessId) {
        if (!GameState.state.interviewedWitnesses.includes(item.witnessId)) {
          GameState.state.interviewedWitnesses.push(item.witnessId);
          GameUI.showToast(`询问了${GameState.getGameData().gameWitnesses.find(w => w.id === item.witnessId)?.name}`, 'info');
        }
        const witness = GameState.getGameData().gameWitnesses.find(w => w.id === item.witnessId);
        // 优先读证人自带颜色，其次读案件的witnessColors映射，最后默认灰色
        const caseWitnessColors = window.GameData?.witnessColors || {};
        const color = witness.color || caseWitnessColors[witness.id] || '#94a3b8';
        // 使用对话框替代alert
        GameUI.showDialog({
          speaker: witness.name,
          color: color,
          text: witness.initialTestimony,
          options: witness.followUpTestimony ? [{
            text: '追问更多细节',
            action: () => {
              GameUI.showDialog({
                speaker: witness.name,
                color: color,
                text: witness.followUpTestimony,
              });
            }
          }] : [],
        });
      } else if (item.type === 'object') {
        GameUI.showDialog({
          speaker: '',
          color: '#94a3b8',
          text: item.description,
        });
      }
      GameRender.render();
    };

    window.__exit = function(sceneId) {
      const meta = window.GameData?.meta || {};
      const trialScene = meta.trialScene || 'dining-car';
      const trialSceneName = meta.trialSceneName || '审判室';
      const req = meta.trialRequirement || { minEvidence: 3, minWitnesses: 2 };
      const evCount = GameState.state.collectedEvidence.length;
      const wtCount = GameState.state.interviewedWitnesses.length;

      if (sceneId === trialScene && GameState.state.gamePhase === 'investigation') {
        if (evCount >= req.minEvidence && wtCount >= req.minWitnesses) {
          GameUI.showModal({
            title: '进入审判阶段？',
            message: `调查阶段将结束，未收集的证据将无法获取。确定要前往${trialSceneName}进行审判吗？`,
            confirmText: '进入审判',
            cancelText: '继续调查',
            type: 'warning',
            onConfirm: () => {
              GameState.state.gamePhase = 'trial';
              GameState.state.trialPhase = 'opening';
              GameState.state.currentScene = trialScene;
              GameState.save();
              playSfx('ui_page');
              // 更新引导系统
              if (window.GuideUI) {
                GuideUI.updateLastAction();
                GuideUI.checkObjectives();
                GuideUI.renderObjective();
              }
              GameRender.render();
            }
          });
        } else {
          GameUI.showModal({
            title: '还不能进入审判',
            message: `还需要收集至少${req.minEvidence}件证据和询问${req.minWitnesses}个证人。\n当前：证据${evCount}/${req.minEvidence}，证人${wtCount}/${req.minWitnesses}`,
            confirmText: '我知道了',
            cancelText: '关闭',
            type: 'info',
            onConfirm: () => {},
            onCancel: () => {}
          });
          return;
        }
      }
      GameState.state.currentScene = sceneId;
      // 自动收集该场景的时间线索
      if (window.TimelineUI) {
        TimelineUI.autoDiscoverBySource('场景', sceneId);
      }
      // 更新引导系统
      if (window.GuideUI) {
        GuideUI.updateLastAction();
        GuideUI.checkObjectives();
        GuideUI.renderObjective();
      }
      GameRender.render();
    };

    window.__selectWitness = function(witnessId) {
      GameState.state.currentWitness = witnessId;
      if (!GameState.state.interviewedWitnesses.includes(witnessId)) {
        GameState.state.interviewedWitnesses.push(witnessId);
      }
      // 更新证人状态
      if (!GameState.state.witnessStates[witnessId]) {
        GameState.state.witnessStates[witnessId] = {};
      }
      GameState.state.witnessStates[witnessId].questioned = true;
      GameState.state.witnessStates[witnessId].emotion = 'confident';
      GameState.save();
      // 自动收集该证人的时间线索
      if (window.TimelineUI) {
        TimelineUI.autoDiscoverBySource('证人', witnessId);
      }
      // 更新引导系统
      if (window.GuideUI) {
        GuideUI.updateLastAction();
        GuideUI.checkObjectives();
        GuideUI.renderObjective();
      }
      GameRender.render();
    };

    window.__followUp = function() {
      const witness = GameState.getGameData().gameWitnesses.find(w => w.id === GameState.state.currentWitness);
      if (witness) {
        const color = witnessColors[witness.id] || '#94a3b8';
        GameUI.showDialog({
          speaker: witness.name,
          color: color,
          text: witness.followUpTestimony,
        });
        // 更新证人状态
        const wid = witness.id;
        if (!GameState.state.witnessStates[wid]) {
          GameState.state.witnessStates[wid] = {};
        }
        GameState.state.witnessStates[wid].followedUp = true;
        GameState.state.witnessStates[wid].emotion = 'nervous';
        GameState.save();
        playSfx('dialog_continue');
      }
      GameRender.render();
    };

    window.__presentEvidence = function() {
      GameState.state.evidenceMode = 'select';
      GameState.state.showEvidenceBar = true;
      GameRender.render();
    };

    window.__selectEvidence = function(evidenceId) {
      if (GameState.state.evidenceMode === 'select') {
        GameState.state.selectedEvidence = evidenceId;
        GameRender.render();
      } else {
        const evidence = GameState.getGameData().gameEvidence.find(e => e.id === evidenceId);
        GameUI.showEvidenceCard(evidence, null);
      }
    };

    window.__cancelEvidence = function() {
      GameState.state.evidenceMode = 'view';
      GameState.state.selectedEvidence = null;
      GameState.state.showEvidenceBar = false;
      GameRender.render();
    };

    window.__confirmPresentEvidence = function() {
      const witness = GameState.getGameData().gameWitnesses.find(w => w.id === GameState.state.currentWitness);
      const evidence = GameState.getGameData().gameEvidence.find(e => e.id === GameState.state.selectedEvidence);

      // 记录出示证据次数
      GameState.state.evidencePresented = (GameState.state.evidencePresented || 0) + 1;
      GameState.save();

      if (witness?.contradiction && witness.contradiction.evidenceId === GameState.state.selectedEvidence) {
        // 正确指出矛盾
        const cont = GameState.getGameData().gameContradictions.find(c => c.witnessId === witness.id && c.evidenceId === GameState.state.selectedEvidence);
        if (cont && !GameState.state.contradictionsFound.includes(cont.id)) {
          GameState.state.contradictionsFound.push(cont.id);
          GameState.state.confidence = Math.min(100, GameState.state.confidence + 20);
          // 更新证人状态：被指出矛盾后崩溃
          const wid = witness.id;
          if (!GameState.state.witnessStates[wid]) {
            GameState.state.witnessStates[wid] = {};
          }
          GameState.state.witnessStates[wid].contradicted = true;
          GameState.state.witnessStates[wid].emotion = 'breakdown';
          GameState.save();
          playSfx('trial_correct');
          GameUI.showDialog({
            speaker: '波洛',
            color: '#fbbf24',
            text: `正确！发现矛盾！\n\n${witness.contradiction.revealedText}\n\n信心值 +20`,
          });
        }
      } else {
        // 错误
        GameState.state.confidence = Math.max(0, GameState.state.confidence - 10);
        // 证人愤怒
        if (witness) {
          const wid = witness.id;
          if (!GameState.state.witnessStates[wid]) {
            GameState.state.witnessStates[wid] = {};
          }
          GameState.state.witnessStates[wid].emotion = 'angry';
          GameState.save();
        }
        playSfx('trial_wrong');
        GameUI.showToast('这个证据与证词没有直接矛盾... 信心值 -10', 'warning', 3000);
      }
      
      GameState.state.evidenceMode = 'view';
      GameState.state.selectedEvidence = null;
      GameState.state.showEvidenceBar = false;
      GameRender.render();
    };

    window.__closeWitnessDialog = function() {
      GameState.state.currentWitness = null;
      GameRender.render();
    };

    window.__goToEnding = function() {
      // 使用新的结局系统
      if (window.EndingUI) {
        EndingUI.showEnding();
      } else {
        GameState.state.gamePhase = 'ending';
        GameRender.render();
      }
    };

    window.__makeFinalChoice = function(choice) {
      GameUI.showModal({
        title: '做出最终选择？',
        message: '这将决定游戏结局，无法更改。确定要做出这个选择吗？',
        confirmText: '确定',
        cancelText: '再想想',
        type: 'danger',
        onConfirm: () => {
          GameState.state.choices['final-choice'] = choice;
          // 两个选择都是合理的结局，不设错误选择
          // 直接进入结局
          if (window.EndingUI) {
            EndingUI.showEnding();
          } else {
            GameState.state.gamePhase = 'ending';
            GameRender.render();
          }
        }
      });
    };

    // 证据栏按钮
    document.getElementById('evidence-btn')?.addEventListener('click', () => {
      GameState.state.showEvidenceBar = !GameState.state.showEvidenceBar;
      GameState.state.evidenceMode = 'view';
      GameRender.render();
    });

    // 重置按钮
    document.getElementById('reset-btn')?.addEventListener('click', () => {
      GameUI.showModal({
        title: '重置游戏？',
        message: '所有进度将丢失，确定要重置吗？',
        confirmText: '重置',
        cancelText: '取消',
        type: 'danger',
        onConfirm: () => {
        localStorage.removeItem('fun-detective-prototype-save');
        state = {
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
        };
        GameRender.render();
        }
      });
    });

    // 开场继续按钮
    document.getElementById('intro-continue')?.addEventListener('click', () => {
      window.__introContinue();
    });

    // 结局重新开始
    document.getElementById('ending-restart')?.addEventListener('click', () => {
      localStorage.removeItem('fun-detective-prototype-save');
      window.location.reload();
    });

    // 启动
    // 音量切换
    function toggleAudio() {
      if (!window.AudioManager) return;
      const isMuted = AudioManager.toggleMute();
      const btn = document.getElementById('audio-toggle-btn');
      if (btn) btn.textContent = isMuted ? '🔇' : '🔊';
      if (!isMuted) {
        AudioManager.playSfx('click');
      }
    }

    // 全局音效辅助函数
    function playSfx(sfxId) {
      if (window.AudioManager) AudioManager.playSfx(sfxId);
    }

    // 加载案件数据后初始化
    const _urlParams = new URLSearchParams(window.location.search);
    const _caseId = _urlParams.get('case') || 'orient-express';
    GameState.loadCaseData(_caseId, () => {
      GameState.init();
    });
  

    // 开始质询
    window.__startQuestioning = function() {
      GameState.state.trialPhase = 'questioning';
      GameState.save();
      playSfx('ui_page');
      GameRender.render();
    };

    // 异议系统
    window.__object = function() {
      const witness = GameState.getGameData().gameWitnesses.find(w => w.id === GameState.state.currentWitness);
      if (!witness) return;

      // 播放异议动画
      GameState.state.objectionActive = true;
      GameRender.render();
      playSfx('trial_object');

      // 1.5秒后关闭动画，打开证据选择
      setTimeout(() => {
        GameState.state.objectionActive = false;
        GameState.state.evidenceMode = 'select';
        GameState.state.showEvidenceBar = true;
        GameRender.render();
      }, 1500);
    };

    // 进入总结陈词
    window.__goToClosing = function() {
      GameState.state.trialPhase = 'closing';
      GameState.state.currentWitness = null;
      GameState.save();
      playSfx('ui_page');
      GameRender.render();
    };

  return {
    handleSceneClick,
    addDialogueHistory,
    setWitnessReaction,
    toggleAudio,
    playSfx,
    witnessColors
  };
  // 注意：__startQuestioning/__object/__goToClosing通过window.__xxx暴露
})();

window.GameInteractions = GameInteractions;
