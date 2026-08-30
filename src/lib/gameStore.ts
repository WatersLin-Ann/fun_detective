// 游戏状态管理
import { gameEvidence, gameWitnesses, gameContradictions, gameScenes } from '../data/prototype-orient-express';

export interface GameState {
  currentScene: string;
  gamePhase: 'intro' | 'investigation' | 'trial' | 'ending';
  collectedEvidence: string[];
  interviewedWitnesses: string[];
  contradictionsFound: string[];
  confidence: number;
  choices: Record<string, string>;
  dialogIndex: number;
  currentWitness: string | null;
  showEvidenceBar: boolean;
  selectedEvidence: string | null;
}

const STORAGE_KEY = 'fun-detective-prototype-save';

// 初始状态
export function createInitialState(): GameState {
  return {
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
  };
}

// 从localStorage加载存档
export function loadGame(): GameState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('加载存档失败:', e);
  }
  return null;
}

// 保存游戏
export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('保存失败:', e);
  }
}

// 重置游戏
export function resetGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// 状态更新函数
export function collectEvidence(state: GameState, evidenceId: string): GameState {
  if (state.collectedEvidence.includes(evidenceId)) return state;
  const newState = {
    ...state,
    collectedEvidence: [...state.collectedEvidence, evidenceId],
  };
  saveGame(newState);
  return newState;
}

export function interviewWitness(state: GameState, witnessId: string): GameState {
  const newState = {
    ...state,
    interviewedWitnesses: state.interviewedWitnesses.includes(witnessId)
      ? state.interviewedWitnesses
      : [...state.interviewedWitnesses, witnessId],
    currentWitness: witnessId,
  };
  saveGame(newState);
  return newState;
}

export function revealContradiction(state: GameState, contradictionId: string): GameState {
  if (state.contradictionsFound.includes(contradictionId)) return state;
  const newState = {
    ...state,
    contradictionsFound: [...state.contradictionsFound, contradictionId],
    confidence: Math.min(100, state.confidence + 20),
  };
  saveGame(newState);
  return newState;
}

export function wrongEvidence(state: GameState): GameState {
  const newState = {
    ...state,
    confidence: Math.max(0, state.confidence - 10),
  };
  saveGame(newState);
  return newState;
}

export function changeScene(state: GameState, sceneId: string): GameState {
  const newState = {
    ...state,
    currentScene: sceneId,
    currentWitness: null,
    showEvidenceBar: false,
    selectedEvidence: null,
  };
  saveGame(newState);
  return newState;
}

export function changePhase(state: GameState, phase: GameState['gamePhase']): GameState {
  const newState = {
    ...state,
    gamePhase: phase,
    dialogIndex: 0,
  };
  saveGame(newState);
  return newState;
}

export function advanceDialog(state: GameState): GameState {
  const newState = {
    ...state,
    dialogIndex: state.dialogIndex + 1,
  };
  saveGame(newState);
  return newState;
}

export function makeChoice(state: GameState, choiceKey: string, choiceValue: string): GameState {
  const newState = {
    ...state,
    choices: { ...state.choices, [choiceKey]: choiceValue },
  };
  saveGame(newState);
  return newState;
}

export function toggleEvidenceBar(state: GameState): GameState {
  const newState = {
    ...state,
    showEvidenceBar: !state.showEvidenceBar,
  };
  saveGame(newState);
  return newState;
}

export function selectEvidence(state: GameState, evidenceId: string | null): GameState {
  const newState = {
    ...state,
    selectedEvidence: evidenceId,
  };
  saveGame(newState);
  return newState;
}

// 辅助函数
export function getEvidenceById(id: string) {
  return gameEvidence.find((e) => e.id === id);
}

export function getWitnessById(id: string) {
  return gameWitnesses.find((w) => w.id === id);
}

export function getSceneById(id: string) {
  return gameScenes.find((s) => s.id === id);
}

export function getContradictionByWitnessAndEvidence(witnessId: string, evidenceId: string) {
  return gameContradictions.find(
    (c) => c.witnessId === witnessId && c.evidenceId === evidenceId
  );
}

export function isInvestigationComplete(state: GameState): boolean {
  // 收集至少3件证据，询问至少3个证人
  return state.collectedEvidence.length >= 3 && state.interviewedWitnesses.length >= 3;
}

export function isTrialComplete(state: GameState): boolean {
  // 发现至少3个矛盾点
  return state.contradictionsFound.length >= 3;
}

export function getEnding(state: GameState) {
  const choice = state.choices['final-choice'];
  if (choice === 'reveal') {
    return {
      id: 'truth',
      name: '真相大白',
      description: '你揭露了真相：12名乘客都是凶手，他们为了给阿姆斯特朗一家复仇，每人刺了一刀。你选择将真相告诉警方。',
    };
  } else if (choice === 'conceal' && state.confidence >= 50) {
    return {
      id: 'mercy',
      name: '法外容情',
      description: '你揭露了真相，但理解了12人的动机。你选择向警方隐瞒真相，说凶手已经逃走。正义，有时在法律之外。',
    };
  } else {
    return {
      id: 'mercy',
      name: '法外容情',
      description: '你揭露了真相，但理解了12人的动机。你选择向警方隐瞒真相，说凶手已经逃走。正义，有时在法律之外。',
    };
  }
}
