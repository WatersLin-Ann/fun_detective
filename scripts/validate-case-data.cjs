/**
 * 案件数据 Schema 校验脚本
 * 用法: node scripts/validate-case-data.js
 * 校验每个 src/game/data-*.js 文件的必填字段和类型
 * 有错误时退出码为 1，可集成到 CI 或 pre-commit
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GAME_DIR = path.join(__dirname, '..', 'src', 'game');
const DATA_FILES = fs.readdirSync(GAME_DIR).filter(f => f.startsWith('data-') && f.endsWith('.js'));

let totalErrors = 0;
let totalWarnings = 0;

function validateCase(filePath) {
  const fileName = path.basename(filePath);
  const errors = [];
  const warnings = [];

  // 读取文件
  const code = fs.readFileSync(filePath, 'utf-8');

  // 在沙箱中执行，捕获 window.GameData
  const sandbox = {
    window: {},
    document: { createElement: () => ({}) },
    URLSearchParams: class { constructor(){} get(){ return null; } },
    console,
    Date,
    setTimeout,
    clearTimeout,
  };
  sandbox.global = sandbox;

  try {
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { filename: fileName });
  } catch (e) {
    errors.push(`文件执行失败: ${e.message}`);
    return { fileName, errors, warnings };
  }

  const data = sandbox.window.GameData;
  if (!data) {
    errors.push('window.GameData 未定义（IIFE 可能未正确赋值）');
    return { fileName, errors, warnings };
  }

  // ========== meta 校验 ==========
  const meta = data.meta;
  if (!meta) {
    errors.push('缺少 meta 对象');
  } else {
    if (!meta.id) errors.push('meta.id 缺失');
    if (!meta.name && !meta.title) errors.push('meta.name 缺失（title 字段已废弃，请改用 name）');
    if (meta.title && !meta.name) warnings.push('meta 使用了 title 字段，建议统一为 name');
    if (!meta.flowType) warnings.push('meta.flowType 缺失，默认按 investigation-trial 处理');
    if (meta.flowType === 'investigation-trial') {
      if (!meta.firstScene) warnings.push('investigation-trial 案件缺少 meta.firstScene，将自动取首个非intro场景');
      if (!meta.trialScene) warnings.push('缺少 meta.trialScene，默认 dining-car');
      if (!meta.trialRequirement) warnings.push('缺少 meta.trialRequirement，默认 {minEvidence:3, minWitnesses:2}');
    }
    if (meta.flowType === 'courtroom-only') {
      if (!meta.trialScene) errors.push('courtroom-only 案件必须指定 meta.trialScene');
    }
  }

  // ========== scenes 校验 ==========
  if (!data.scenes) {
    errors.push('缺少 scenes');
  } else if (!Array.isArray(data.scenes)) {
    errors.push(`scenes 必须是数组，当前是 ${typeof data.scenes}（对象格式已废弃）`);
  } else {
    data.scenes.forEach((scene, i) => {
      if (!scene.id) errors.push(`scenes[${i}].id 缺失`);
      if (!scene.name) errors.push(`scenes[${i}](${scene.id || '?'}).name 缺失`);
      if (!Array.isArray(scene.interactables)) errors.push(`scenes[${i}](${scene.id}).interactables 必须是数组`);
      if (!Array.isArray(scene.exits)) errors.push(`scenes[${i}](${scene.id}).exits 必须是数组`);
      if (!scene.background && !scene.sceneType) warnings.push(`scenes[${i}](${scene.id}) 缺少 background 或 sceneType`);
    });
  }

  // ========== evidence 校验 ==========
  if (!Array.isArray(data.evidence)) {
    errors.push('evidence 必须是数组');
  } else {
    data.evidence.forEach((ev, i) => {
      if (!ev.id) errors.push(`evidence[${i}].id 缺失`);
      if (!ev.name) errors.push(`evidence[${i}](${ev.id || '?'}).name 缺失`);
      if (!ev.description) errors.push(`evidence[${i}](${ev.id}).description 缺失`);
      if (ev.scene && !ev.foundIn) warnings.push(`evidence[${i}](${ev.id}) 使用了废弃字段 scene，建议改用 foundIn`);
      if (ev.detail && !ev.keyInfo) warnings.push(`evidence[${i}](${ev.id}) 使用了废弃字段 detail，建议改用 keyInfo`);
    });
  }

  // ========== witnesses 校验 ==========
  if (!Array.isArray(data.witnesses)) {
    errors.push('witnesses 必须是数组');
  } else {
    data.witnesses.forEach((w, i) => {
      if (!w.id) errors.push(`witnesses[${i}].id 缺失`);
      if (!w.name) errors.push(`witnesses[${i}](${w.id || '?'}).name 缺失`);
      if (!w.initialTestimony) errors.push(`witnesses[${i}](${w.id}).initialTestimony 缺失`);
      if (w.followUpTestimony === undefined) warnings.push(`witnesses[${i}](${w.id}) 缺少 followUpTestimony（设为 null 可隐藏追问按钮）`);
    });
  }

  // ========== dialogs 校验 ==========
  if (!data.dialogs) {
    errors.push('缺少 dialogs');
  } else {
    if (!Array.isArray(data.dialogs.intro)) {
      errors.push('dialogs.intro 必须是字符串数组');
    } else {
      data.dialogs.intro.forEach((line, i) => {
        if (typeof line !== 'string') {
          errors.push(`dialogs.intro[${i}] 必须是字符串，当前是 ${typeof line}（对象格式 {speaker,text} 已废弃）`);
        }
      });
    }
    if (data.dialogs.investigationStart && !Array.isArray(data.dialogs.investigationStart)) {
      errors.push('dialogs.investigationStart 必须是数组');
    }
  }

  // ========== contradictions 校验 ==========
  if (!Array.isArray(data.contradictions)) {
    warnings.push('contradictions 不是数组，审判阶段可能无法使用异议功能');
  }

  // ========== trialOpening 校验 ==========
  if (data.trialOpening && !Array.isArray(data.trialOpening)) {
    errors.push('trialOpening 必须是字符串数组');
  }
  if (!data.trialOpening) {
    warnings.push('缺少 trialOpening，将使用 meta 生成通用审判开场文案');
  }

  // ========== IIFE 变量名校验 ==========
  const varMatch = code.match(/^const\s+(\w+)\s*=\s*\(function\(\)/m);
  if (varMatch && varMatch[1] === 'GameData') {
    errors.push('IIFE 变量名不能是 GameData（会与全局 window.GameData 冲突），应使用 CaseData_xxx 格式');
  }

  return { fileName, errors, warnings };
}

console.log('═══════════════════════════════════════════');
console.log('  案件数据 Schema 校验');
console.log('═══════════════════════════════════════════\n');

DATA_FILES.forEach(file => {
  const filePath = path.join(GAME_DIR, file);
  const result = validateCase(filePath);
  totalErrors += result.errors.length;
  totalWarnings += result.warnings.length;

  const status = result.errors.length > 0 ? '❌ FAIL' : result.warnings.length > 0 ? '⚠️  WARN' : '✅  OK';
  console.log(`${status}  ${result.fileName}`);

  result.errors.forEach(e => console.log(`   ✗ ${e}`));
  result.warnings.forEach(w => console.log(`   ! ${w}`));
  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log('   全部通过');
  }
  console.log('');
});

console.log('═══════════════════════════════════════════');
console.log(`  总计: ${DATA_FILES.length} 个案件, ${totalErrors} 个错误, ${totalWarnings} 个警告`);
console.log('═══════════════════════════════════════════');

if (totalErrors > 0) {
  console.log('\n❌ 校验失败，请修复上述错误后再提交。');
  process.exit(1);
} else {
  console.log('\n✅ 校验通过。');
  process.exit(0);
}
