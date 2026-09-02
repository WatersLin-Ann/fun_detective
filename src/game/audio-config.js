/**
 * 音效配置文件
 * 定义游戏中所有音效的触发点和配置
 * 
 * 【架构说明】
 * 当前使用Web Audio API生成占位合成音，不依赖真实音频文件。
 * 后续引入真实文件时，只需在此文件中配置文件路径，
 * AudioManager会自动优先使用真实文件，无文件时回退到合成音。
 * 
 * 【文件命名规范】
 * BGM: bgm_<场景>.mp3  (例: bgm_investigation.mp3)
 * SFX: sfx_<动作>.mp3  (例: sfx_collect.mp3)
 * 
 * 【存放路径】
 * public/game/audio/bgm/
 * public/game/audio/sfx/
 */

const AudioConfig = {
  // ========== 全局设置 ==========
  settings: {
    masterVolume: 0.7,
    bgmVolume: 0.4,
    sfxVolume: 0.8,
    bgmFadeDuration: 1.0,  // BGM切换淡入淡出时长（秒）
    autoPlayBgm: true      // 场景切换自动播放BGM
  },

  // ========== BGM 配置 ==========
  // 按游戏阶段/场景配置背景音乐
  bgm: {
    // 开场阶段
    intro: {
      file: '/fun_detective/game/audio/bgm/bgm_intro.mp3',
      loop: true,
      volume: 0.4,
      description: '神秘悬疑的开场氛围'
    },
    // 调查阶段
    investigation: {
      file: '/fun_detective/game/audio/bgm/bgm_investigation.mp3',
      loop: true,
      volume: 0.35,
      description: '探索推理的紧张感'
    },
    // 审判阶段
    trial: {
      file: '/fun_detective/game/audio/bgm/bgm_trial.mp3',
      loop: true,
      volume: 0.45,
      description: '法庭对峙的压迫感'
    },
    // 结局阶段
    ending: {
      file: '/fun_detective/game/audio/bgm/bgm_ending.mp3',
      loop: false,
      volume: 0.4,
      description: '真相大白的释然感'
    },
    // 证据关联板
    evidence_board: {
      file: '/fun_detective/game/audio/bgm/bgm_evidence.mp3',
      loop: true,
      volume: 0.3,
      description: '思考推理的沉静感'
    }
  },

  // ========== SFX 配置 ==========
  // 按交互事件配置音效
  sfx: {
    // UI交互
    ui_click: {
      file: '/fun_detective/game/audio/sfx/sfx_click.mp3',
      volume: 0.6,
      description: '按钮点击',
      trigger: '所有按钮点击'
    },
    ui_hover: {
      file: '/fun_detective/game/audio/sfx/sfx_hover.mp3',
      volume: 0.3,
      description: '按钮悬停',
      trigger: '鼠标悬停可点击元素'
    },
    ui_page: {
      file: '/fun_detective/game/audio/sfx/sfx_page.mp3',
      volume: 0.5,
      description: '翻页/切换',
      trigger: 'Tab切换、场景切换'
    },

    // 收集相关
    collect_evidence: {
      file: '/fun_detective/game/audio/sfx/sfx_collect.mp3',
      volume: 0.8,
      description: '收集证据成功',
      trigger: '点击场景中的证据物品'
    },
    collect_witness: {
      file: '/fun_detective/game/audio/sfx/sfx_collect_2.mp3',
      volume: 0.7,
      description: '询问证人完成',
      trigger: '完成证人对话'
    },
    collect_reveal: {
      file: '/fun_detective/game/audio/sfx/sfx_reveal.mp3',
      volume: 0.75,
      description: '发现关键线索',
      trigger: '揭示重要信息、矛盾点'
    },

    // 对话相关
    dialog_start: {
      file: '/fun_detective/game/audio/sfx/sfx_dialog.mp3',
      volume: 0.4,
      description: '对话开始',
      trigger: '打开对话框'
    },
    dialog_continue: {
      file: '/fun_detective/game/audio/sfx/sfx_dialog.mp3',
      volume: 0.3,
      description: '对话继续',
      trigger: '点击继续对话'
    },
    dialog_option: {
      file: '/fun_detective/game/audio/sfx/sfx_click.mp3',
      volume: 0.5,
      description: '选择对话选项',
      trigger: '点击对话选项'
    },

    // 证据关联
    link_success: {
      file: '/fun_detective/game/audio/sfx/sfx_success.mp3',
      volume: 0.8,
      description: '关联成功',
      trigger: '建立正确的证据关联'
    },
    link_fail: {
      file: '/fun_detective/game/audio/sfx/sfx_error.mp3',
      volume: 0.6,
      description: '关联失败',
      trigger: '建立错误的证据关联'
    },
    link_select: {
      file: '/fun_detective/game/audio/sfx/sfx_click.mp3',
      volume: 0.5,
      description: '选择关联物品',
      trigger: '在证据板中选择物品'
    },

    // 审判相关
    trial_question: {
      file: '/fun_detective/game/audio/sfx/sfx_warning.mp3',
      volume: 0.7,
      description: '审判提问',
      trigger: '法官/检察官提问'
    },
    trial_object: {
      file: '/fun_detective/game/audio/sfx/sfx_reveal.mp3',
      volume: 0.8,
      description: '提出异议',
      trigger: '玩家提出异议/反驳'
    },
    trial_correct: {
      file: '/fun_detective/game/audio/sfx/sfx_success.mp3',
      volume: 0.8,
      description: '反驳正确',
      trigger: '成功指出矛盾'
    },
    trial_wrong: {
      file: '/fun_detective/game/audio/sfx/sfx_error.mp3',
      volume: 0.7,
      description: '反驳错误',
      trigger: '指出错误的矛盾'
    },

    // 结局相关
    ending_reveal: {
      file: '/fun_detective/game/audio/sfx/sfx_triumph.mp3',
      volume: 0.9,
      description: '真相揭晓',
      trigger: '最终真相揭示'
    },
    ending_bad: {
      file: '/fun_detective/game/audio/sfx/sfx_error.mp3',
      volume: 0.7,
      description: '失败结局',
      trigger: '推理失败结局'
    }
  },

  // ========== 场景-BGM映射 ==========
  // 游戏阶段到BGM的映射
  phaseBgmMap: {
    'intro': 'intro',
    'investigation': 'investigation',
    'trial': 'trial',
    'ending': 'ending'
  },

  // ========== 音量预设 ==========
  presets: {
    mute: { master: 0, bgm: 0, sfx: 0 },
    low: { master: 0.3, bgm: 0.2, sfx: 0.4 },
    medium: { master: 0.6, bgm: 0.35, sfx: 0.7 },
    high: { master: 0.9, bgm: 0.5, sfx: 0.9 }
  }
};

window.AudioConfig = AudioConfig;
