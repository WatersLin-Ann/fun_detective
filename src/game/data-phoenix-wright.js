/**
 * 案件数据：逆转裁判 - 最初的逆转
 * 类型：游戏
 * 地区：日本
 * 难度：简单
 */

const CaseData_phoenixWright = (function() {
  // ========== 基础信息 ==========
  const meta = {
    id: 'phoenix-wright-1',
    name: '逆转裁判：最初的逆转',
    type: '游戏',
    region: '日本',
    difficulty: '简单',
    description: '成步堂龙一的首次出庭。他的童年朋友矢张政志被指控杀害了女友高日美佳。作为辩护律师，你需要在法庭上证明矢张的清白，找出真凶。',
    detective: '成步堂龙一',
    victim: '高日美佳',
    defendant: '矢张政志',
    realCulprit: '山野星雄',
    flowType: 'courtroom-only',
    firstScene: 'courtroom',
    trialScene: 'courtroom',
    trialSceneName: '法庭',
    trialRequirement: { minEvidence: 0, minWitnesses: 0 }
  };

  // ========== 场景 ==========
  const scenes = [
    {
      id: 'intro',
      name: '法院走廊',
      description: '法院走廊。你是成步堂龙一，一名新手律师。今天是你第一次出庭辩护。',
      background: 'linear-gradient(180deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)',
      sceneType: 'office',
      interactables: [],
      exits: [{ to: 'courtroom', label: '进入法庭' }]
    },
    {
      id: 'courtroom',
      name: '法庭',
      description: '庄严的法庭。法官坐在高位，检察官在对面，被告席上是你的童年朋友矢张政志。',
      background: 'linear-gradient(180deg, #5c3d1e 0%, #3d2914 50%, #2a1a0a 100%)',
      sceneType: 'dining',
      interactables: [],
      exits: []
    },
    {
      id: 'witness',
      name: '证人席',
      description: '证人山野星雄站在证人席上，神情紧张但故作镇定。',
      background: 'linear-gradient(180deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)',
      sceneType: 'office',
      interactables: [],
      exits: [{ to: 'courtroom', label: '返回法庭' }]
    }
  ];

  // ========== 证据 ==========
  const evidence = [
    {
      id: 'ev-thinker',
      name: '思考者摆件',
      description: '一个做成思考者姿势的时钟摆件。案发时放在死者公寓的桌子上。底部有血迹。',
      foundIn: 'courtroom',
      icon: '🕰️',
      keyInfo: '这个摆件其实是一个时钟，按压头部会报时。案发时停在2:00。'
    },
    {
      id: 'ev-badge',
      name: '律师徽章',
      description: '成步堂龙一的律师徽章，金色的天平图案。',
      foundIn: 'intro',
      icon: '⚖️',
      keyInfo: '新手律师的象征。今天第一次在法庭上使用。'
    },
    {
      id: 'ev-autopsy',
      name: '解剖记录',
      description: '死者高日美佳，24岁女性。死亡时间推测为7月31日下午1:00-2:00。死因：钝器击打头部。',
      foundIn: 'courtroom',
      icon: '📋',
      keyInfo: '凶器被认为是思考者摆件。死者体内检测出少量安眠药成分。'
    },
    {
      id: 'ev-photo',
      name: '现场照片',
      description: '案发现场照片。死者倒在地上，思考者摆件在旁边，窗户开着。',
      foundIn: 'courtroom',
      icon: '📷',
      keyInfo: '注意：照片中思考者摆件的位置与证人描述不符。'
    },
    {
      id: 'ev-blackout',
      name: '停电记录',
      description: '案发公寓楼7月31日下午1:00-3:00因检修停电。',
      foundIn: 'courtroom',
      icon: '⚡',
      keyInfo: '停电期间，电子时钟会停止运行。这是关键证据！'
    },
    {
      id: 'ev-list',
      name: '失物清单',
      description: '死者公寓的失物清单。丢失物品：一个思考者时钟（与凶器同款）。',
      foundIn: 'courtroom',
      icon: '📝',
      keyInfo: '死者此前丢失了一个同样的思考者时钟。凶手可能用这个作为凶器。'
    }
  ];

  // ========== 证人 ==========
  const witnesses = [
    {
      id: 'wit-yama',
      name: '山野星雄',
      role: '控方证人',
      description: '报纸推销员，自称案发时在推销报纸。神情紧张，眼神闪烁。',
      color: '#ef4444',
      initialTestimony: '那天下午1点左右，我在那栋公寓推销报纸。我看到被告从房间里冲出来，神色慌张。我绝对没有看错！',
      followUpTestimony: '大概下午1点左右吧，我记得很清楚。我在1楼，抬头看到2楼的房间门开着，被告冲了出来。我绝对没有看错！',
      contradiction: {
        evidenceId: 'ev-blackout',
        revealedText: '山野说他在1点看到被告，但1点到3点公寓正在停电！电梯无法使用，他不可能在1楼看到2楼的情况。他在说谎！',
        confidence: 20
      }
    },
    {
      id: 'wit-yahari',
      name: '矢张政志',
      role: '被告',
      description: '成步堂的童年朋友，被指控杀害女友。性格冲动但内心善良。',
      color: '#3b82f6',
      initialTestimony: '我那天确实去了美佳家，但我们只是吵架了！我走的时候她还活着！我没有杀她！',
      followUpTestimony: '我发现她好像在跟别的男人交往...但我没有杀她！我走的时候她还活着！大概中午12点半吧，我很生气，摔门就走了。',
      contradiction: null
    },
    {
      id: 'wit-judge',
      name: '法官',
      role: '裁判长',
      description: '经验丰富的老法官，主持法庭审判。严肃但公正。',
      color: '#fbbf24',
      initialTestimony: '辩护律师，请开始你的询问。记住，法庭上证据至上。',
      followUpTestimony: null,
      contradiction: null
    }
  ];

  // ========== 对话 ==========
  const dialogs = {
    intro: [
      '千寻老师：成步堂，今天是你第一次出庭。紧张吗？',
      '成步堂：有一点...但我相信矢张是无辜的。',
      '千寻老师：记住三个原则：第一，相信委托人；第二，证据至上；第三，绝境中也要逆转思维。',
      '成步堂：我明白了。走吧，法庭在等着我们。'
    ],
    investigationStart: [
      '法官：现在开庭。审理被告人矢张政志涉嫌杀害高日美佳一案。',
      '检察官：控方主张，被告因感情纠纷，于7月31日下午闯入死者公寓，用钝器击打头部致死。',
      '法官：辩护律师，请开始你的询问。记住，法庭上证据至上。',
      '成步堂：（深吸一口气）我准备好了。'
    ],
    // 证人详细对话记录（参考数据，引擎使用witness.initialTestimony/followUpTestimony）
    'wit-yama': [
      { speaker: '山野星雄', color: '#ef4444', text: '我那天在推销报纸，看到被告从房间里跑出来。' },
      { speaker: '成步堂', color: '#3b82f6', text: '（追问）你说的"那天"具体是什么时间？' },
      { speaker: '山野星雄', color: '#ef4444', text: '大概...下午1点左右吧。我记得很清楚。' },
      { speaker: '成步堂', color: '#3b82f6', text: '（追问）你在几楼看到的？' },
      { speaker: '山野星雄', color: '#ef4444', text: '我在1楼，抬头看到2楼的房间门开着，被告冲了出来。' }
    ],
    'wit-yahari': [
      { speaker: '矢张政志', color: '#3b82f6', text: '我和美佳吵架了，因为她最近总是躲着我。' },
      { speaker: '成步堂', color: '#3b82f6', text: '（追问）你们为什么吵架？' },
      { speaker: '矢张政志', color: '#3b82f6', text: '我发现她好像在跟别的男人交往...但我没有杀她！我走的时候她还活着！' },
      { speaker: '成步堂', color: '#3b82f6', text: '（追问）你几点离开的？' },
      { speaker: '矢张政志', color: '#3b82f6', text: '大概中午12点半吧。我很生气，摔门就走了。' }
    ]
  };

  // ========== 矛盾点 ==========
  const contradictions = [
    {
      id: 'cont-1',
      witnessId: 'wit-yama',
      evidenceId: 'ev-blackout',
      title: '停电与目击时间',
      description: '山野说1点在1楼看到2楼的被告，但1-3点公寓停电，电梯无法使用。',
      confidence: 20
    },
    {
      id: 'cont-2',
      witnessId: 'wit-yama',
      evidenceId: 'ev-thinker',
      title: '思考者时钟的时间',
      description: '思考者时钟停在2:00，但停电会让电子钟停止。实际时间可能不是2点。',
      confidence: 15
    },
    {
      id: 'cont-3',
      witnessId: 'wit-yama',
      evidenceId: 'ev-list',
      title: '丢失的同款时钟',
      description: '死者丢失了一个同款思考者时钟。凶手可能用丢失的那个作案，然后放回现场。',
      confidence: 15
    },
    {
      id: 'cont-4',
      witnessId: 'wit-yahari',
      evidenceId: 'ev-autopsy',
      title: '死亡时间与离开时间',
      description: '矢张12:30离开，但死亡时间是1:00-2:00。时间上矢张有不在场证明。',
      confidence: 10
    }
  ];

  // ========== 证据关联 ==========
  const presetLinks = [
    { id: 'link-1', evidence1: 'ev-blackout', evidence2: 'ev-thinker', description: '停电导致时钟停止，思考者显示的时间不准确', confidence: 15 },
    { id: 'link-2', evidence1: 'ev-list', evidence2: 'ev-thinker', description: '丢失的同款时钟可能才是真正的凶器', confidence: 15 },
    { id: 'link-3', evidence1: 'ev-autopsy', evidence2: 'ev-photo', description: '解剖记录与现场照片对比，确认死因和现场状态', confidence: 10 },
    { id: 'link-4', evidence1: 'ev-blackout', evidence2: 'ev-photo', description: '停电时窗户开着，凶手可能从窗户进入', confidence: 10 },
    { id: 'link-5', evidence1: 'ev-badge', evidence2: 'ev-autopsy', description: '律师徽章与解剖记录，律师的职责是找出真相', confidence: 5 }
  ];

  // ========== 时间线 ==========
  const timeline = [
    { id: 'tl-pw-001', time: '12:00', title: '矢张到达公寓', description: '被告矢张政志到达死者高日美佳的公寓', source: '证人', sourceId: 'wit-yahari', category: '证词' },
    { id: 'tl-pw-002', time: '12:30', title: '矢张离开公寓', description: '矢张与死者吵架后摔门离开', source: '证人', sourceId: 'wit-yahari', category: '证词' },
    { id: 'tl-pw-003', time: '13:00', title: '公寓开始停电', description: '公寓楼因检修开始停电，持续到15:00', source: '证据', sourceId: 'ev-blackout', category: '物证' },
    { id: 'tl-pw-004', time: '13:00', title: '山野声称目击', description: '山野星雄声称在1楼看到被告从2楼冲出', source: '证人', sourceId: 'wit-yama', category: '证词' },
    { id: 'tl-pw-005', time: '14:00', title: '推测死亡时间', description: '死者高日美佳被钝器击打头部死亡', source: '证据', sourceId: 'ev-autopsy', category: '推测' },
    { id: 'tl-pw-006', time: '15:00', title: '停电结束', description: '公寓供电恢复', source: '证据', sourceId: 'ev-blackout', category: '行程' },
    { id: 'tl-pw-007', time: '16:00', title: '发现尸体', description: '有人发现死者并报警', source: '场景', sourceId: 'courtroom', category: '行程' }
  ];

  const timelineContradictions = [
    { id: 'tc-pw-001', event1: 'tl-pw-003', event2: 'tl-pw-004', description: '13:00开始停电，电梯无法使用，山野不可能在1楼看到2楼的情况', confidence: 15 },
    { id: 'tc-pw-002', event1: 'tl-pw-002', event2: 'tl-pw-005', description: '矢张12:30离开，死亡时间14:00左右，时间上存在不在场证明', confidence: 10 }
  ];

  // ========== 笔记关键词 ==========
  const noteKeywords = [
    { id: 'kw-pw-001', keyword: '停电', aliases: ['断电', '停电记录'], category: '推理', unlockType: 'dialog', description: '停电的关键作用', unlockContent: { speaker: '成步堂', text: '停电！电梯无法使用，山野说他在1楼看到2楼的情况，这根本不可能！他在说谎！', confidence: 15 } },
    { id: 'kw-pw-002', keyword: '时钟', aliases: ['思考者', '摆件'], category: '线索', unlockType: 'dialog', description: '思考者时钟的秘密', unlockContent: { speaker: '千寻老师', text: '思考者摆件其实是一个时钟。停电会让电子钟停止，所以它显示的时间不一定准确。', confidence: 10 } },
    { id: 'kw-pw-003', keyword: '矢张', aliases: ['被告', '朋友'], category: '推理', unlockType: 'dialog', description: '相信委托人', unlockContent: { speaker: '成步堂', text: '矢张是我的童年朋友，我相信他没有杀人。他12:30就离开了，死亡时间是1点以后，他有不在场证明！', confidence: 10 } },
    { id: 'kw-pw-004', keyword: '山野', aliases: ['推销员', '证人'], category: '推理', unlockType: 'dialog', description: '证人的破绽', unlockContent: { speaker: '成步堂', text: '山野星雄，这个推销员在说谎。他为什么要撒谎？难道他才是真正的凶手？', confidence: 10 } },
    { id: 'kw-pw-005', keyword: '逆转', aliases: ['逆转思维', '反过来想'], category: '推理', unlockType: 'confidence', description: '逆转的思维', unlockContent: { speaker: '千寻老师', text: '当你走投无路时，试着逆转思维。不是"被告为什么杀人"，而是"谁有动机杀人"。', confidence: 10 } },
    { id: 'kw-pw-006', keyword: '安眠药', aliases: ['药', '昏睡'], category: '线索', unlockType: 'dialog', description: '安眠药的作用', unlockContent: { speaker: '成步堂', text: '死者体内有安眠药！凶手可能先让死者昏睡，然后再作案。这说明凶手是熟人，能让死者放下戒心。', confidence: 15 } }
  ];

  // ========== 游戏目标 ==========
  const objectives = [
    { id: 'obj-pw-001', phase: 'investigation', title: '了解案件概况', description: '阅读开场对话，了解案件背景', type: 'collect_evidence', target: 2, hint: '点击场景中的物品收集证据' },
    { id: 'obj-pw-002', phase: 'investigation', title: '收集关键证据', description: '收集法庭上的所有证据', type: 'collect_evidence', target: 5, hint: '在法庭场景中收集证据' },
    { id: 'obj-pw-003', phase: 'investigation', title: '询问证人', description: '询问山野星雄和矢张政志', type: 'interview_witness', target: 2, hint: '点击证人卡片与他们对话' },
    { id: 'obj-pw-004', phase: 'investigation', title: '整理推理笔记', description: '打开笔记，记录你的推理', type: 'open_notebook', target: 1, hint: '点击顶部"笔记"按钮' },
    { id: 'obj-pw-005', phase: 'investigation', title: '进入审判', description: '准备好后进入审判阶段', type: 'enter_trial', target: 1, hint: '点击"进入审判"按钮' },
    { id: 'obj-pw-006', phase: 'trial', title: '质询证人', description: '在审判中质询山野星雄', type: 'question_all_witnesses', target: 1, hint: '点击证人进行质询' },
    { id: 'obj-pw-007', phase: 'trial', title: '出示证据', description: '在质询中出示关键证据', type: 'present_evidence', target: 2, hint: '点击"出示证据"按钮' }
  ];

  // ========== 结局配置 ==========
  const endings = [
    { id: 'ending-s', grade: 'S', minConfidence: 90, title: '完美逆转', description: '你完美地揭露了真相！山野星雄的谎言被你一一戳穿，矢张政志被无罪释放。千寻老师微笑着说："这就是逆转的力量。"法庭上响起了掌声。', detectiveComment: '出色！你不仅证明了委托人的清白，还找出了真凶。', color: '#fbbf24' },
    { id: 'ending-a', grade: 'A', minConfidence: 75, title: '成功辩护', description: '你成功为矢张辩护，虽然有少数细节没有完全理清，但核心证据无懈可击。法官宣判被告无罪。', detectiveComment: '非常好的辩护，只差一点点就完美了。', color: '#22c55e' },
    { id: 'ending-b', grade: 'B', minConfidence: 60, title: '勉强胜诉', description: '你找到了关键矛盾，但推理过程中有些跳跃。法官最终宣判无罪，但检察官似乎不太服气。', detectiveComment: '结论正确，但过程可以更严谨。', color: '#3b82f6' },
    { id: 'ending-c', grade: 'C', minConfidence: 40, title: '存疑判决', description: '你的辩护让法官产生了合理怀疑，但证据不够充分。案件被发回重审。矢张暂时获释，但真凶仍逍遥法外。', detectiveComment: '方向对了，但还需要更多证据支撑。', color: '#f97316' },
    { id: 'ending-d', grade: 'D', minConfidence: 0, title: '辩护失败', description: '你未能证明委托人的清白。矢张政志被判有罪。但你知道，真相被埋葬了。也许有一天，你能找到真正的凶手。', detectiveComment: '这次失败了，但每个律师都有失败的时候。再来一次吧。', color: '#ef4444' }
  ];

  // ========== 成就配置 ==========
  const achievements = [
    { id: 'ach-pw-001', name: '初出茅庐', description: '首次通关逆转裁判', condition: 'complete', rarity: '普通' },
    { id: 'ach-pw-002', name: '证据收藏家', description: '收集案件中所有证据', condition: 'all_evidence', rarity: '稀有' },
    { id: 'ach-pw-003', name: '审讯专家', description: '询问案件中所有证人', condition: 'all_witnesses', rarity: '稀有' },
    { id: 'ach-pw-004', name: '矛盾猎手', description: '发现案件中所有矛盾', condition: 'all_contradictions', rarity: '史诗' },
    { id: 'ach-pw-005', name: '时间侦探', description: '发现所有时间线矛盾', condition: 'all_timeline_contradictions', rarity: '史诗' },
    { id: 'ach-pw-006', name: '关键词大师', description: '发现案件中所有关键词', condition: 'all_keywords', rarity: '稀有' },
    { id: 'ach-pw-007', name: '完美逆转', description: '获得S级结局', condition: 's_ending', rarity: '传说' },
    { id: 'ach-pw-008', name: '证据关联大师', description: '发现所有证据关联', condition: 'all_links', rarity: '史诗' }
  ];

  // ========== 证人颜色映射 ==========
  const witnessColors = {
    'wit-yama': '#ef4444',
    'wit-yahari': '#3b82f6',
    'wit-judge': '#fbbf24'
  };

  const trialOpening = [
    '现在开始审理被告人矢张政志涉嫌杀害高日美佳一案。',
    '控方主张，被告因感情纠纷，于7月31日下午闯入死者公寓，用钝器击打头部致死。',
    '辩护律师成步堂龙一，请开始你的询问。记住，法庭上证据至上。'
  ];

  return {
    meta,
    scenes,
    evidence,
    witnesses,
    dialogs,
    contradictions,
    trialOpening,
    presetLinks,
    timeline,
    timelineContradictions,
    noteKeywords,
    objectives,
    endings,
    achievements,
    witnessColors
  };
})();

window.CaseData_phoenixWright = CaseData_phoenixWright;
window.GameData = CaseData_phoenixWright;
