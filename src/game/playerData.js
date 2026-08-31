/**
 * 玩家数据与笔记系统
 * 包含：证据标记、人物档案、推理笔记板、导出导入
 * 所有数据存储在localStorage，无需后端
 */

const PlayerData = (function() {
  const STORAGE_KEY = 'fun-detective-player-data';
  const CURRENT_CASE = 'orient-express'; // 当前案件ID

  // 默认数据结构
  function getDefaultData() {
    return {
      caseId: CURRENT_CASE,
      lastSaved: Date.now(),
      evidenceNotes: {},      // 证据标记 { evidenceId: { note, tags, rating } }
      characterNotes: {},     // 人物档案 { characterId: { suspicion, note, relations } }
      notebook: {             // 推理笔记板
        clues: [],            // 线索
        reasonings: [],       // 推理
        todos: []             // 待验证
      },
      customLinks: [],        // 玩家自定义证据连线
      settings: {
        autoSave: true,
        textSize: 'normal'
      }
    };
  }

  // ========== 数据持久化 ==========
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        // 确保字段完整
        const defaults = getDefaultData();
        return {
          ...defaults,
          ...data,
          notebook: { ...defaults.notebook, ...(data.notebook || {}) },
          settings: { ...defaults.settings, ...(data.settings || {}) }
        };
      }
    } catch (e) {
      console.warn('加载玩家数据失败:', e);
    }
    return getDefaultData();
  }

  function save(data) {
    try {
      data.lastSaved = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('保存玩家数据失败:', e);
      return false;
    }
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ========== 证据标记 ==========
  function getEvidenceNote(evidenceId) {
    const data = load();
    return data.evidenceNotes[evidenceId] || { note: '', tags: [], rating: 0 };
  }

  function saveEvidenceNote(evidenceId, noteData) {
    const data = load();
    data.evidenceNotes[evidenceId] = {
      note: noteData.note || '',
      tags: noteData.tags || [],
      rating: noteData.rating || 0
    };
    save(data);
    return data.evidenceNotes[evidenceId];
  }

  function getAllEvidenceNotes() {
    return load().evidenceNotes;
  }

  // ========== 人物档案 ==========
  function getCharacterNote(characterId) {
    const data = load();
    return data.characterNotes[characterId] || { suspicion: 50, note: '', relations: [] };
  }

  function saveCharacterNote(characterId, noteData) {
    const data = load();
    data.characterNotes[characterId] = {
      suspicion: typeof noteData.suspicion === 'number' ? noteData.suspicion : 50,
      note: noteData.note || '',
      relations: noteData.relations || []
    };
    save(data);
    return data.characterNotes[characterId];
  }

  function getAllCharacterNotes() {
    return load().characterNotes;
  }

  // ========== 推理笔记板 ==========
  function getNotebook() {
    return load().notebook;
  }

  function addNotebookItem(type, text) {
    const data = load();
    const item = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      text: text,
      done: false,
      createdAt: Date.now()
    };
    if (data.notebook[type]) {
      data.notebook[type].push(item);
      save(data);
    }
    return item;
  }

  function updateNotebookItem(type, itemId, updates) {
    const data = load();
    const list = data.notebook[type];
    if (list) {
      const item = list.find(i => i.id === itemId);
      if (item) {
        Object.assign(item, updates);
        save(data);
        return item;
      }
    }
    return null;
  }

  function deleteNotebookItem(type, itemId) {
    const data = load();
    if (data.notebook[type]) {
      data.notebook[type] = data.notebook[type].filter(i => i.id !== itemId);
      save(data);
      return true;
    }
    return false;
  }

  function toggleNotebookItem(type, itemId) {
    const data = load();
    const list = data.notebook[type];
    if (list) {
      const item = list.find(i => i.id === itemId);
      if (item) {
        item.done = !item.done;
        save(data);
        return item;
      }
    }
    return null;
  }

  // ========== 自定义连线 ==========
  function addCustomLink(fromId, toId, label = '') {
    const data = load();
    const exists = data.customLinks.find(l =>
      (l.from === fromId && l.to === toId) || (l.from === toId && l.to === fromId)
    );
    if (!exists) {
      data.customLinks.push({ from: fromId, to: toId, label, createdAt: Date.now() });
      save(data);
      return true;
    }
    return false;
  }

  function removeCustomLink(fromId, toId) {
    const data = load();
    data.customLinks = data.customLinks.filter(l =>
      !((l.from === fromId && l.to === toId) || (l.from === toId && l.to === fromId))
    );
    save(data);
  }

  function getCustomLinks() {
    return load().customLinks;
  }

  // ========== 导出/导入 ==========
  function exportData() {
    const data = load();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `侦探笔记_${CURRENT_CASE}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportAsText() {
    const data = load();
    let text = '═══════════════════════════════\n';
    text += '  侦探推理笔记 - 东方快车谋杀案\n';
    text += '═══════════════════════════════\n\n';

    text += '【我的线索】\n';
    data.notebook.clues.forEach((c, i) => {
      text += `${i + 1}. ${c.text}${c.done ? ' ✓' : ''}\n`;
    });
    text += '\n';

    text += '【我的推理】\n';
    data.notebook.reasonings.forEach((r, i) => {
      text += `${i + 1}. ${r.text}${r.done ? ' ✓' : ''}\n`;
    });
    text += '\n';

    text += '【待验证】\n';
    data.notebook.todos.forEach((t, i) => {
      text += `${i + 1}. ${t.text}${t.done ? ' ✓' : ''}\n`;
    });
    text += '\n';

    text += '【人物可疑度】\n';
    Object.entries(data.characterNotes).forEach(([id, c]) => {
      text += `• ${id}: ${c.suspicion}% - ${c.note || '无备注'}\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `侦探笔记_${CURRENT_CASE}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.evidenceNotes && data.notebook) {
        save(data);
        return true;
      }
      return false;
    } catch (e) {
      console.error('导入失败:', e);
      return false;
    }
  }

  // ========== 统计 ==========
  function getStats() {
    const data = load();
    return {
      evidenceMarked: Object.keys(data.evidenceNotes).filter(id => data.evidenceNotes[id].note || data.evidenceNotes[id].tags.length > 0).length,
      charactersAnalyzed: Object.keys(data.characterNotes).filter(id => data.characterNotes[id].note || data.characterNotes[id].suspicion !== 50).length,
      totalClues: data.notebook.clues.length,
      totalReasonings: data.notebook.reasonings.length,
      totalTodos: data.notebook.todos.length,
      todosDone: data.notebook.todos.filter(t => t.done).length,
      customLinks: data.customLinks.length,
      lastSaved: data.lastSaved
    };
  }

  // ========== 公共API ==========
  return {
    // 持久化
    load,
    save,
    reset,
    // 证据标记
    getEvidenceNote,
    saveEvidenceNote,
    getAllEvidenceNotes,
    // 人物档案
    getCharacterNote,
    saveCharacterNote,
    getAllCharacterNotes,
    // 笔记板
    getNotebook,
    addNotebookItem,
    updateNotebookItem,
    deleteNotebookItem,
    toggleNotebookItem,
    // 连线
    addCustomLink,
    removeCustomLink,
    getCustomLinks,
    // 导出导入
    exportData,
    exportAsText,
    importData,
    // 统计
    getStats
  };
})();

window.PlayerData = PlayerData;
