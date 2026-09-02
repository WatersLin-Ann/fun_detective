/**
 * 案件配置文件
 * 列出所有可用的可玩案件
 */

const GameCases = [
  {
    id: 'orient-express',
    name: '东方快车：推理审判',
    description: '阿加莎·克里斯蒂经典作品改编。深夜列车上发生谋杀案，12名乘客各怀秘密，你需要通过收集证据、询问证人、关联线索来揭开真相。',
    difficulty: '中等',
    estimatedTime: '20-30分钟',
    tags: ['推理小说', '封闭空间', '多人作案'],
    dataFile: '/fun_detective/game/data-orient-express.js',
    status: 'available',
    cover: '🚂'
  },
  {
    id: 'study-in-scarlet',
    name: '血字的研究',
    description: '福尔摩斯首秀案件。伦敦空屋中发生离奇谋杀，墙上血字"RACHE"隐藏着复仇的真相。通过戒指、脚印、烟灰等线索，推理出凶手的真实身份。',
    difficulty: '简单',
    estimatedTime: '15-20分钟',
    tags: ['推理小说', '侦探', '复仇'],
    dataFile: '/fun_detective/game/data-study-in-scarlet.js',
    status: 'available',
    cover: '🔍'
  }
  // 后续案件在此添加
];

window.GameCases = GameCases;
