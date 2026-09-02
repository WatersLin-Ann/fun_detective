/**
 * 音效管理器
 * 支持BGM、SFX、音量控制、淡入淡出
 * 不依赖真实音频文件，使用Web Audio API生成占位合成音
 * 后续替换为真实文件只需修改audio-config.js
 */

const AudioManager = (function() {
  // ========== 状态 ==========
  let audioContext = null;
  let masterGain = null;
  let bgmGain = null;
  let sfxGain = null;
  let currentBgm = null;
  let currentBgmOscillator = null;
  let isMuted = false;
  let masterVolume = 0.7;
  let bgmVolume = 0.5;
  let sfxVolume = 0.8;
  let isInitialized = false;

  // ========== 初始化 ==========
  function init() {
    if (isInitialized) return;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioContext.createGain();
      bgmGain = audioContext.createGain();
      sfxGain = audioContext.createGain();

      masterGain.connect(audioContext.destination);
      bgmGain.connect(masterGain);
      sfxGain.connect(masterGain);

      masterGain.gain.value = isMuted ? 0 : masterVolume;
      bgmGain.gain.value = bgmVolume;
      sfxGain.gain.value = sfxVolume;

      isInitialized = true;
      console.log('[AudioManager] 初始化成功（Web Audio API 合成模式）');
    } catch (e) {
      console.warn('[AudioManager] 初始化失败:', e);
    }
  }

  // 确保AudioContext已启动（浏览器自动播放策略）
  function ensureContext() {
    if (!audioContext) init();
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }

  // ========== 占位合成音 ==========
  // 生成简单的音调作为占位
  function playTone(frequency, duration, type = 'sine', volume = 0.3, targetGain = null) {
    if (!audioContext || isMuted) return;
    ensureContext();

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    const now = audioContext.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(targetGain || sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  // 生成和弦（用于BGM占位）
  function playChord(frequencies, duration, type = 'sine', volume = 0.15) {
    if (!audioContext || isMuted) return;
    ensureContext();

    frequencies.forEach(freq => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = type;
      osc.frequency.value = freq;

      const now = audioContext.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.5);
      gain.gain.setValueAtTime(volume, now + duration - 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(bgmGain);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  // ========== BGM 控制 ==========
  // 播放BGM（占位：循环播放简单的氛围音）
  function playBgm(bgmId) {
    if (!audioContext || isMuted) return;
    ensureContext();

    // 停止当前BGM
    stopBgm();

    currentBgm = bgmId;

    // 占位BGM：根据不同场景播放不同的低音氛围
    const bgmPresets = {
      'intro': { freqs: [110, 165], type: 'sine', interval: 4000 },
      'investigation': { freqs: [130, 196], type: 'triangle', interval: 3500 },
      'trial': { freqs: [98, 147], type: 'sawtooth', interval: 3000 },
      'ending': { freqs: [174, 261], type: 'sine', interval: 5000 },
      'default': { freqs: [120, 180], type: 'sine', interval: 4000 }
    };

    const preset = bgmPresets[bgmId] || bgmPresets['default'];

    // 循环播放占位BGM
    const playLoop = () => {
      if (currentBgm !== bgmId || isMuted) return;
      playChord(preset.freqs, preset.interval / 1000, preset.type, 0.08);
      currentBgmOscillator = setTimeout(playLoop, preset.interval);
    };
    playLoop();

    console.log('[AudioManager] 播放BGM:', bgmId, '(占位合成音)');
  }

  // 停止BGM
  function stopBgm(fadeOut = 0.5) {
    if (currentBgmOscillator) {
      clearTimeout(currentBgmOscillator);
      currentBgmOscillator = null;
    }
    currentBgm = null;
  }

  // 淡入BGM
  function fadeInBgm(bgmId, duration = 1) {
    playBgm(bgmId);
  }

  // 淡出BGM
  function fadeOutBgm(duration = 1) {
    stopBgm();
  }

  // ========== SFX 控制 ==========
  // 播放音效
  function playSfx(sfxId) {
    if (!audioContext || isMuted) return;
    ensureContext();

    // 占位音效预设
    const sfxPresets = {
      'click': { freq: 800, duration: 0.08, type: 'square', volume: 0.15 },
      'collect': { freq: 880, duration: 0.15, type: 'sine', volume: 0.25 },
      'collect-2': { freq: 1100, duration: 0.2, type: 'sine', volume: 0.2 },
      'success': { freqs: [523, 659, 784], duration: 0.3, type: 'sine', volume: 0.2 },
      'error': { freq: 200, duration: 0.2, type: 'sawtooth', volume: 0.15 },
      'dialog': { freq: 600, duration: 0.05, type: 'sine', volume: 0.1 },
      'reveal': { freqs: [440, 554, 659], duration: 0.4, type: 'triangle', volume: 0.2 },
      'page': { freq: 1000, duration: 0.06, type: 'sine', volume: 0.1 },
      'warning': { freq: 300, duration: 0.15, type: 'square', volume: 0.15 },
      'triumph': { freqs: [523, 659, 784, 1047], duration: 0.5, type: 'sine', volume: 0.25 }
    };

    const preset = sfxPresets[sfxId];
    if (!preset) {
      console.warn('[AudioManager] 未找到音效:', sfxId);
      return;
    }

    if (preset.freqs) {
      // 和弦音效
      preset.freqs.forEach((freq, i) => {
        setTimeout(() => playTone(freq, preset.duration, preset.type, preset.volume), i * 80);
      });
    } else {
      playTone(preset.freq, preset.duration, preset.type, preset.volume);
    }
  }

  // ========== 音量控制 ==========
  function setMasterVolume(vol) {
    masterVolume = Math.max(0, Math.min(1, vol));
    if (masterGain && !isMuted) {
      masterGain.gain.value = masterVolume;
    }
  }

  function setBgmVolume(vol) {
    bgmVolume = Math.max(0, Math.min(1, vol));
    if (bgmGain) bgmGain.gain.value = bgmVolume;
  }

  function setSfxVolume(vol) {
    sfxVolume = Math.max(0, Math.min(1, vol));
    if (sfxGain) sfxGain.gain.value = sfxVolume;
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (masterGain) {
      masterGain.gain.value = isMuted ? 0 : masterVolume;
    }
    return isMuted;
  }

  function getMuteState() {
    return isMuted;
  }

  function getVolume() {
    return {
      master: masterVolume,
      bgm: bgmVolume,
      sfx: sfxVolume,
      muted: isMuted
    };
  }

  // ========== 真实文件支持（预留） ==========
  // 后续替换为真实音频文件时，使用此方法加载
  function loadAudio(url) {
    // 预留：真实文件加载逻辑
    return new Audio(url);
  }

  // ========== 导出API ==========
  return {
    init,
    ensureContext,
    // BGM
    playBgm,
    stopBgm,
    fadeInBgm,
    fadeOutBgm,
    // SFX
    playSfx,
    // 音量
    setMasterVolume,
    setBgmVolume,
    setSfxVolume,
    toggleMute,
    getMuteState,
    getVolume,
    // 工具
    loadAudio
  };
})();

window.AudioManager = AudioManager;
