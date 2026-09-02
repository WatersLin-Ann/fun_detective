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
  }
  // 后续案件在此添加
  // {
  //   id: 'xxx',
  //   name: '案件名称',
  //   description: '案件描述...',
  //   difficulty: '简单/中等/困难',
  //   estimatedTime: 'XX分钟',
  //   tags: ['标签1', '标签2'],
  //   dataFile: '/fun_detective/game/data-xxx.js',
  //   status: 'available/coming-soon',
  //   cover: '图标'
  // }
];

window.GameCases = GameCases;
