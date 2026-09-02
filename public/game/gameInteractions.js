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
      if (GameState.state.dialogIndex >= 12) {
        GameState.state.gamePhase = 'investigation';
        GameState.state.currentScene = 'corridor';
        GameState.state.dialogIndex = 0;
      }
      GameRender.render();
    };

    window.__interact = function(itemId) {
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
            // 播放收集动画
            const rect = event.target.getBoundingClientRect();
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
        const witnessColors = {
          conductor: '#3b82f6',
          'mrs-hubbard': '#ec4899',
          mary: '#8b5cf6',
          colonel: '#22c55e',
          princess: '#eab308',
          countess: '#06b6d4',
        };
        const color = witnessColors[witness.id] || '#94a3b8';
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
      if (sceneId === 'dining-car' && GameState.state.gamePhase === 'investigation') {
        if (GameState.state.collectedEvidence.length >= 3 && GameState.state.interviewedWitnesses.length >= 2) {
          GameUI.showModal({
            title: '进入审判阶段？',
            message: '调查阶段将结束，未收集的证据将无法获取。确定要前往餐车进行审判吗？',
            confirmText: '进入审判',
            cancelText: '继续调查',
            type: 'warning',
            onConfirm: () => {
              GameState.state.gamePhase = 'trial';
              GameState.state.currentScene = 'dining-car';
              GameRender.render();
            }
          });
        } else {
          GameUI.showModal({
            title: '还不能进入审判',
            message: `还需要收集至少3件证据和询问2个证人。\n当前：证据${GameState.state.collectedEvidence.length}/3，证人${GameState.state.interviewedWitnesses.length}/2`,
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
      GameRender.render();
    };

    window.__selectWitness = function(witnessId) {
      GameState.state.currentWitness = witnessId;
      if (!GameState.state.interviewedWitnesses.includes(witnessId)) {
        GameState.state.interviewedWitnesses.push(witnessId);
      }
      GameRender.render();
    };

    window.__followUp = function() {
      const witness = GameState.getGameData().gameWitnesses.find(w => w.id === GameState.state.currentWitness);
      if (witness) {
        const witnessColors = {
          conductor: '#3b82f6',
          'mrs-hubbard': '#ec4899',
          mary: '#8b5cf6',
          colonel: '#22c55e',
          princess: '#eab308',
          countess: '#06b6d4',
        };
        const color = witnessColors[witness.id] || '#94a3b8';
        GameUI.showDialog({
          speaker: witness.name,
          color: color,
          text: witness.followUpTestimony,
        });
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
      
      if (witness?.contradiction && witness.contradiction.evidenceId === GameState.state.selectedEvidence) {
        // 正确指出矛盾
        const cont = GameState.getGameData().gameContradictions.find(c => c.witnessId === witness.id && c.evidenceId === GameState.state.selectedEvidence);
        if (cont && !GameState.state.contradictionsFound.includes(cont.id)) {
          GameState.state.contradictionsFound.push(cont.id);
          GameState.state.confidence = Math.min(100, GameState.state.confidence + 20);
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
      GameState.state.gamePhase = 'ending';
      GameRender.render();
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
          GameRender.render();
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
    loadCaseData(currentCaseId, () => {
      init();
    });
  
  return {
    handleSceneClick,
    addDialogueHistory,
    setWitnessReaction,
    toggleAudio,
    playSfx,
    witnessColors
  };
})();

window.GameInteractions = GameInteractions;
