/**
 * 案件数据：血字的研究
 * 作者：阿瑟·柯南·道尔
 * 通用案件数据格式
 */

const CaseData_studyInScarlet = (function() {
  // ========== 场景数据 ==========
  const scenes = [
    {
      id: "intro",
      name: "贝克街221B",
      description: "清晨，福尔摩斯收到雷斯垂德警官的求助信。伦敦空屋中发生了一起离奇的谋杀案，死者面部扭曲，墙上还有用血写的字母...",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      sceneType: "room",
      interactables: [
        { id: "door", name: "房门", description: "通往楼下的门，该出发了。", type: "object", position: { x: 80, y: 50 } }
      ],
      exits: [{ to: "crime-scene", label: "前往案发现场" }]
    },
    {
      id: "crime-scene",
      name: "劳里斯顿花园街3号",
      description: "一栋空屋，烛光摇曳。死者伊瑙克·锥伯倒在地上，面部表情扭曲。墙上用鲜血写着一个词：RACHE。",
      background: "linear-gradient(135deg, #2d1b1b 0%, #1a0f0f 50%, #0f0a0a 100%)",
      sceneType: "room",
      interactables: [
        { id: "body", name: "锥伯的尸体", description: "死者面部表情痛苦扭曲，嘴唇有杏仁味，无明显外伤。", type: "evidence", evidenceId: "body", position: { x: 30, y: 60 } },
        { id: "blood-word", name: "墙上的血字", description: "墙上用鲜血写着'RACHE'，雷斯垂德认为是人名'Rachel'。", type: "evidence", evidenceId: "blood-word", position: { x: 70, y: 30 } },
        { id: "ring", name: "女式金戒指", description: "地板上发现一枚女式结婚戒指，似乎是故意留下的。", type: "evidence", evidenceId: "ring", position: { x: 50, y: 70 } },
        { id: "footprints", name: "地板脚印", description: "现场有两种脚印：大靴子印和小靴子印。", type: "evidence", evidenceId: "footprints", position: { x: 20, y: 40 } },
        { id: "cigar-ash", name: "雪茄烟灰", description: "壁炉旁有大量雪茄烟灰，是印度雪茄品牌。", type: "evidence", evidenceId: "cigar-ash", position: { x: 85, y: 65 } },
        { id: "lestrade", name: "雷斯垂德警官", description: "苏格兰场警官，负责此案，看起来很困惑。", type: "witness", witnessId: "lestrade", color: "#3b82f6", position: { x: 60, y: 45 } }
      ],
      exits: [
        { to: "street", label: "前往街道" },
        { to: "baker-street", label: "返回贝克街" }
      ]
    },
    {
      id: "street",
      name: "花园街",
      description: "案发房屋外的街道，泥泞的地面上留下了清晰的车轮印。一个路人正在附近徘徊。",
      background: "linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)",
      sceneType: "corridor",
      interactables: [
        { id: "carriage-tracks", name: "马车车轮痕迹", description: "屋外有马车车轮印，车轮间距较窄，是私人马车。", type: "evidence", evidenceId: "carriage-tracks", position: { x: 40, y: 55 } },
        { id: "passerby", name: "路人", description: "案发当晚经过街道的路人，似乎看到了什么。", type: "witness", witnessId: "passerby", color: "#8b5cf6", position: { x: 70, y: 40 } }
      ],
      exits: [
        { to: "crime-scene", label: "返回现场" },
        { to: "baker-street", label: "前往贝克街" }
      ]
    },
    {
      id: "baker-street",
      name: "贝克街221B",
      description: "福尔摩斯的公寓，华生正在整理笔记。一个送信的小孩在门口等待。",
      background: "linear-gradient(135deg, #2d2a1f 0%, #1f1d15 50%, #15130d 100%)",
      sceneType: "room",
      interactables: [
        { id: "watson", name: "华生医生", description: "福尔摩斯的助手，正在记录案件细节。", type: "witness", witnessId: "watson", color: "#22c55e", position: { x: 30, y: 45 } },
        { id: "messenger", name: "送信小孩", description: "贝克街小分队成员，福尔摩斯让他用戒指去引蛇出洞。", type: "witness", witnessId: "messenger", color: "#eab308", position: { x: 65, y: 55 } }
      ],
      exits: [
        { to: "crime-scene", label: "前往现场" },
        { to: "dining-car", label: "开始审判" }
      ]
    },
    {
      id: "dining-car",
      name: "审判室",
      description: "福尔摩斯设下圈套，凶手即将现身。所有线索都指向了一个令人震惊的真相...",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      sceneType: "dining",
      interactables: [],
      exits: []
    }
  ];

  // ========== 证据数据 ==========
  const evidence = [
    {
      id: "body",
      name: "锥伯的尸体",
      description: "死者伊瑙克·锥伯，美国人。面部表情痛苦扭曲，嘴唇有杏仁味（氰化物特征），无明显外伤。",
      detail: "死者并非被刺杀，而是毒杀。面部表情显示他死前经历了极大的痛苦和恐惧。",
      icon: "💀"
    },
    {
      id: "blood-word",
      name: '血字"RACHE"',
      description: '墙上用鲜血写的大写字母"RACHE"。雷斯垂德认为是人名"Rachel"的不完整拼写。',
      detail: '"RACHE"是德语，意思是"复仇"。这不是人名，而是凶手留下的宣言。',
      icon: "🩸"
    },
    {
      id: "ring",
      name: "女式金戒指",
      description: "现场地板上发现的一枚女式结婚戒指，做工精致，似乎是故意放在显眼位置的。",
      detail: "死者是男性，这枚女式戒指不可能属于他。这是凶手故意留下的，用来引诱某人出现。",
      icon: "💍"
    },
    {
      id: "footprints",
      name: "地板脚印",
      description: "现场有两种脚印：一种是大靴子印（约43码），另一种是小靴子印（约38码）。",
      detail: "两种脚印说明现场至少有两个人。大靴子是凶手的，小靴子可能是死者的。",
      icon: "👣"
    },
    {
      id: "cigar-ash",
      name: "雪茄烟灰",
      description: "壁炉旁有大量雪茄烟灰，经过辨认是印度雪茄品牌，价格不菲。",
      detail: "死者不抽雪茄，这些烟灰属于凶手。凶手抽印度雪茄，说明他有一定经济实力。",
      icon: "🚬"
    },
    {
      id: "carriage-tracks",
      name: "马车车轮痕迹",
      description: "屋外泥泞地面上有马车车轮印，车轮间距较窄，是私人马车而非出租马车。",
      detail: "私人马车说明凶手有自己的马车，或者就是马车夫本人。车轮印的方向显示马车是从东边来的。",
      icon: "🛞"
    }
  ];

  // ========== 证人数据 ==========
  const witnesses = [
    {
      id: "lestrade",
      name: "雷斯垂德警官",
      avatar: "👮",
      description: "苏格兰场警官",
      initialTestimony: "我们接到报案后赶到现场，发现死者已经死亡。墙上有血字'RACHE'，我认为这是凶手想写'Rachel'这个人名，但没写完就被打断了。死者应该是被刺杀的，因为现场有血迹。",
      followUpTestimony: "经过进一步检查，我们没有找到凶器。死者身上没有财物损失，排除抢劫杀人。我还是认为'RACHE'是人名Rachel，我们正在调查叫Rachel的女性。",
      contradiction: {
        evidenceId: "blood-word",
        revealedText: "福尔摩斯：'RACHE'不是人名Rachel，而是德语'复仇'！你完全搞错了方向。而且死者没有外伤，不是刺杀，是毒杀！"
      },
      color: "#3b82f6"
    },
    {
      id: "watson",
      name: "华生医生",
      avatar: "👨‍⚕️",
      description: "福尔摩斯的助手",
      initialTestimony: "我和福尔摩斯一起检查了现场。作为医生，我注意到死者嘴唇有杏仁味，这是氰化物中毒的典型特征。福尔摩斯还发现了一枚女式戒指，他说这是破案的关键。",
      followUpTestimony: "福尔摩斯让我用报纸刊登戒指招领启事，他说这样可以引蛇出洞。他还派了贝克街小分队的孩子们去调查马车夫的信息。",
      contradiction: null,
      color: "#22c55e"
    },
    {
      id: "passerby",
      name: "路人",
      avatar: "🚶",
      description: "案发当晚的目击者",
      initialTestimony: "那天晚上我路过花园街，看到一个高个子男人从那栋空屋里出来，他好像喝了酒，走路摇摇晃晃的。我没太在意，就走了。",
      followUpTestimony: "等等，我想起来了，那个人旁边好像还有一辆马车！对，是一辆私人马车，不是出租的那种。那个人上了马车就走了。我当时只注意到那个人，没看清马车夫的样子。",
      contradiction: {
        evidenceId: "footprints",
        revealedText: "福尔摩斯：你说只看到一个人，但现场有两种脚印！大靴子是凶手的，小靴子是死者的。你看到的'高个子'就是凶手，他当时正在离开现场。"
      },
      color: "#8b5cf6"
    },
    {
      id: "messenger",
      name: "送信小孩",
      avatar: "👦",
      description: "贝克街小分队成员",
      initialTestimony: "福尔摩斯先生让我拿着那枚戒指去招领处，说会有人来认领。今天真的有个人来了！他是个马车夫，说戒指是他妻子的。我按福尔摩斯先生的吩咐，把他带到了这里。",
      followUpTestimony: "那个马车夫看起来很紧张，他一直问戒指在哪里。我注意到他的手很粗糙，确实是干体力活的。他抽雪茄，身上有一股印度雪茄的味道。",
      contradiction: {
        evidenceId: "ring",
        revealedText: "福尔摩斯：你说戒指是死者的？但这是一枚女式结婚戒指，死者是男性！这枚戒指是凶手故意留下的诱饵，而你，马车夫先生，就是凶手！"
      },
      color: "#eab308"
    }
  ];

  // ========== 对话数据 ==========
  const dialogs = {
    intro: [
      "福尔摩斯：华生，快看这封信。雷斯垂德又遇到麻烦了。",
      "华生：又是一起谋杀案？",
      "福尔摩斯：没错，在劳里斯顿花园街的一栋空屋里。死者叫锥伯，美国人。最有趣的是，墙上用血写了一个词。",
      "华生：什么词？",
      "福尔摩斯：'RACHE'。雷斯垂德认为是人名'Rachel'，但我有不同的看法。",
      "华生：那我们还等什么？出发吧！"
    ],
    investigationStart: [
      "雷斯垂德：福尔摩斯先生，您终于来了！现场就在里面。",
      "福尔摩斯：华生，注意观察。每一个细节都是线索。",
      "华生：好的，我会仔细记录。",
      "福尔摩斯：让我们看看这起'复仇'案的真相吧。",
      "雷斯垂德：您说什么？复仇？",
      "福尔摩斯：进去你就知道了。"
    ]
  };

  // ========== 矛盾点数据 ==========
  const contradictions = [
    { id: "c1", witnessId: "lestrade", evidenceId: "blood-word", description: "血字是德语'复仇'，不是人名Rachel", revealed: false },
    { id: "c2", witnessId: "passerby", evidenceId: "footprints", description: "路人说只看到一个人，但现场有两种脚印", revealed: false },
    { id: "c3", witnessId: "lestrade", evidenceId: "body", description: "雷斯垂德说是刺杀，但尸体无外伤是毒杀", revealed: false },
    { id: "c4", witnessId: "messenger", evidenceId: "ring", description: "戒指是女式的，不可能属于男性死者", revealed: false }
  ];

  // ========== 预设证据关联 ==========
  const presetLinks = [
    {
      id: 'link-bloodword-lestrade',
      from: 'blood-word', to: 'lestrade',
      fromType: 'evidence', toType: 'witness',
      title: '血字的真相',
      conclusion: '"RACHE"不是人名Rachel，而是德语"复仇"。凶手在现场留下复仇宣言，说明这是一起仇杀。',
      confidence: 20
    },
    {
      id: 'link-footprints-passerby',
      from: 'footprints', to: 'passerby',
      fromType: 'evidence', toType: 'witness',
      title: '不止一个人',
      conclusion: '路人说只看到一个人，但现场有两种脚印。大靴子是凶手的，小靴子是死者的。路人看到的就是凶手离开现场。',
      confidence: 15
    },
    {
      id: 'link-ring-messenger',
      from: 'ring', to: 'messenger',
      fromType: 'evidence', toType: 'witness',
      title: '戒指的诱饵',
      conclusion: '女式戒指不可能属于男性死者。这是凶手故意留下的诱饵，用来引诱相关人员出现。送信小孩引来的马车夫就是凶手。',
      confidence: 20
    },
    {
      id: 'link-cigar-body',
      from: 'cigar-ash', to: 'body',
      fromType: 'evidence', toType: 'evidence',
      title: '雪茄的主人',
      conclusion: '现场有印度雪茄烟灰，但死者不抽雪茄。这些烟灰属于凶手。送信小孩说马车夫抽印度雪茄，进一步印证了他的身份。',
      confidence: 15
    },
    {
      id: 'link-carriage-passerby',
      from: 'carriage-tracks', to: 'passerby',
      fromType: 'evidence', toType: 'witness',
      title: '马车夫的身份',
      conclusion: '私人马车痕迹+路人看到的马车+送信小孩引来的马车夫，所有线索都指向同一个人：凶手就是马车夫杰弗逊·侯波。',
      confidence: 20
    }
  ];


  // ========== 时间线数据 ==========
  const timeline = [
    { id: 'tl-sis-001', time: '18:00', title: '锥伯到达伦敦', description: '死者伊瑙克·锥伯到达伦敦，入住当地酒店。', source: '证据', sourceId: 'body', category: '行程' },
    { id: 'tl-sis-002', time: '20:00', title: '锥伯在酒馆', description: '锥伯在酒馆喝酒，与一名男子发生争吵。', source: '证人', sourceId: 'passerby', category: '证词' },
    { id: 'tl-sis-003', time: '22:00', title: '锥伯乘坐马车', description: '锥伯乘坐一辆私人马车前往花园街方向。', source: '证据', sourceId: 'carriage-tracks', category: '物证' },
    { id: 'tl-sis-004', time: '23:00', title: '路人看到高个子', description: '路人看到一个高个子男人从花园街空屋出来，走路摇摇晃晃。', source: '证人', sourceId: 'passerby', category: '证词' },
    { id: 'tl-sis-005', time: '23:30', title: '马车离开', description: '私人马车离开花园街，车轮痕迹显示是从东边来的。', source: '证据', sourceId: 'carriage-tracks', category: '物证' },
    { id: 'tl-sis-006', time: '08:00', title: '发现尸体', description: '警察接到报案，在空屋中发现锥伯的尸体。', source: '证人', sourceId: 'lestrade', category: '证词' }
  ];

  // 时间线矛盾
  const timelineContradictions = [
    { id: 'tc-sis-001', event1: 'tl-sis-004', event2: 'tl-sis-005', description: '路人说23:00看到高个子从空屋出来，但马车23:30才离开，中间有半小时的空白，凶手在这段时间做了什么？', confidence: 15 },
    { id: 'tc-sis-002', event1: 'tl-sis-006', event2: 'tl-sis-005', description: '警察08:00才发现尸体，但尸检显示死亡时间约在23:00-00:00，中间8个小时无人发现，说明现场偏僻。', confidence: 10 }
  ];




  // ========== 结局配置 ==========
  const endings = [
    {
      id: 'ending-s',
      grade: 'S',
      minConfidence: 90,
      title: '基本演绎法',
      description: '你完美地运用了演绎推理，从现场的蛛丝马迹中还原了整个案件。福尔摩斯说："出色，你已经掌握了基本演绎法的精髓。"',
      detectiveComment: '精彩！你的推理逻辑严密，无懈可击。',
      color: '#fbbf24'
    },
    {
      id: 'ending-a',
      grade: 'A',
      minConfidence: 75,
      title: '敏锐的观察',
      description: '你成功揭露了真相，你的观察力令人印象深刻。虽然有少数细节遗漏，但核心推理完全正确。',
      detectiveComment: '非常好，你有成为优秀侦探的天赋。',
      color: '#22c55e'
    },
    {
      id: 'ending-b',
      grade: 'B',
      minConfidence: 60,
      title: '合格的推理',
      description: '你找到了凶手，但推理过程中有些地方不够严谨。证据链可以更完整一些。',
      detectiveComment: '结论正确，但过程还有提升空间。',
      color: '#3b82f6'
    },
    {
      id: 'ending-c',
      grade: 'C',
      minConfidence: 40,
      title: '运气不错',
      description: '你的结论是对的，但很大程度上依赖直觉而非证据。如果这是真实案件，你的推理可能站不住脚。',
      detectiveComment: '直觉很重要，但证据更重要。',
      color: '#f97316'
    },
    {
      id: 'ending-d',
      grade: 'D',
      minConfidence: 0,
      title: '迷雾重重',
      description: '你未能揭露真相。凶手消失在伦敦的迷雾中，案件成为又一个未解之谜。',
      detectiveComment: '这次没成功，但伦敦的雾总会散的。再来一次吧。',
      color: '#ef4444'
    }
  ];

  // ========== 成就配置 ==========
  const achievements = [
    { id: 'ach-sis-001', name: '初出茅庐', description: '首次通关血字的研究', condition: 'complete', rarity: '普通' },
    { id: 'ach-sis-002', name: '证据收藏家', description: '收集案件中所有证据', condition: 'all_evidence', rarity: '稀有' },
    { id: 'ach-sis-003', name: '审讯专家', description: '询问案件中所有证人', condition: 'all_witnesses', rarity: '稀有' },
    { id: 'ach-sis-004', name: '矛盾猎手', description: '发现案件中所有矛盾', condition: 'all_contradictions', rarity: '史诗' },
    { id: 'ach-sis-005', name: '时间侦探', description: '发现所有时间线矛盾', condition: 'all_timeline_contradictions', rarity: '史诗' },
    { id: 'ach-sis-006', name: '关键词大师', description: '发现案件中所有关键词', condition: 'all_keywords', rarity: '稀有' },
    { id: 'ach-sis-007', name: '完美推理', description: '获得S级结局', condition: 's_ending', rarity: '传说' },
    { id: 'ach-sis-008', name: '证据关联大师', description: '发现所有证据关联', condition: 'all_links', rarity: '史诗' }
  ];

  // ========== 游戏目标配置 ==========
  const objectives = [
    { id: 'obj-sis-001', phase: 'investigation', title: '调查犯罪现场', description: '在空屋中收集所有可用的证据', type: 'collect_evidence', target: 4, hint: '点击场景中的物品来收集证据' },
    { id: 'obj-sis-002', phase: 'investigation', title: '询问相关证人', description: '至少询问2名证人了解情况', type: 'interview_witness', target: 2, hint: '点击证人卡片与他们对话' },
    { id: 'obj-sis-003', phase: 'investigation', title: '整理推理笔记', description: '打开笔记，记录你的推理思路', type: 'open_notebook', target: 1, hint: '点击顶部"笔记"按钮' },
    { id: 'obj-sis-004', phase: 'investigation', title: '发现证词矛盾', description: '在证人证词中找出至少1个矛盾', type: 'find_contradiction', target: 1, hint: '仔细对比不同证人的证词' },
    { id: 'obj-sis-005', phase: 'investigation', title: '准备进入审判', description: '收集足够证据后，进入审判阶段', type: 'enter_trial', target: 1, hint: '点击"进入审判"按钮' },
    { id: 'obj-sis-006', phase: 'trial', title: '质询所有证人', description: '在审判中质询所有证人', type: 'question_all_witnesses', target: 1, hint: '点击证人进行质询' },
    { id: 'obj-sis-007', phase: 'trial', title: '出示关键证据', description: '在质询中出示至少2次证据', type: 'present_evidence', target: 2, hint: '点击"出示证据"按钮' }
  ];

  // ========== 笔记关键词配置 ==========
  const noteKeywords = [
    { id: 'kw-sis-001', keyword: 'RACHE', aliases: ['rache', '复仇'], category: '推理', unlockType: 'dialog', description: '血字的含义', unlockContent: { speaker: '福尔摩斯', text: '"RACHE"在德语中是"复仇"的意思，不是什么人名Rachel。凶手在现场留下了复仇的宣言。', confidence: 15 } },
    { id: 'kw-sis-002', keyword: '马车夫', aliases: ['车夫', '马车'], category: '推理', unlockType: 'dialog', description: '马车夫的身份', unlockContent: { speaker: '福尔摩斯', text: '凶手是一名马车夫，他利用职业之便接近受害者。私人马车的痕迹和路人的证词都指向这一点。', confidence: 10 } },
    { id: 'kw-sis-003', keyword: '戒指', aliases: ['金戒指', '女式戒指'], category: '线索', unlockType: 'dialog', description: '戒指的诱饵', unlockContent: { speaker: '福尔摩斯', text: '女式戒指是凶手故意留下的诱饵，用来引诱与受害者相关的人出现。这是一个精心设计的圈套。', confidence: 10 } },
    { id: 'kw-sis-004', keyword: '毒杀', aliases: ['毒药', '氰化物'], category: '推理', unlockType: 'dialog', description: '毒杀的手法', unlockContent: { speaker: '福尔摩斯', text: '死者嘴唇有杏仁味，这是氰化物中毒的特征。凶手用毒药丸杀人，自己也服了一颗，但他选了无毒的那颗。', confidence: 10 } },
    { id: 'kw-sis-005', keyword: '雪茄', aliases: ['烟灰', '印度雪茄'], category: '线索', unlockType: 'confidence', description: '雪茄烟灰', unlockContent: { speaker: '福尔摩斯', text: '现场的印度雪茄烟灰属于凶手，这说明凶手有一定经济实力，且抽特定品牌的雪茄。', confidence: 5 } },
    { id: 'kw-sis-006', keyword: '复仇', aliases: ['报仇', '报复'], category: '推理', unlockType: 'dialog', description: '复仇的动机', unlockContent: { speaker: '福尔摩斯', text: '这是一场跨越多年的复仇。凶手追踪受害者从美国到伦敦，只为了给死去的爱人报仇。', confidence: 10 } }
  ];

  // ========== 证人颜色映射 ==========
  const witnessColors = {
    lestrade: "#3b82f6",
    watson: "#22c55e",
    passerby: "#8b5cf6",
    messenger: "#eab308"
  };

  return {
    meta: {
      id: 'study-in-scarlet',
      name: '血字的研究',
      flowType: 'investigation-trial',
      firstScene: 'crime-scene',
      trialScene: 'dining-car',
      trialSceneName: '审判室',
      trialRequirement: { minEvidence: 3, minWitnesses: 2 },
      description: '福尔摩斯首秀案件。伦敦空屋中发生离奇谋杀，墙上血字"RACHE"隐藏着复仇的真相。通过戒指、脚印、烟灰等线索，福尔摩斯推理出凶手是一名马车夫。',
      difficulty: '简单',
      author: '阿瑟·柯南·道尔',
      estimatedTime: '15-20分钟',
      tags: ['推理小说', '侦探', '复仇']
    },
    scenes,
    evidence,
    witnesses,
    dialogs,
    contradictions,
    trialOpening: [
      '现在开始审理劳里斯顿花园街谋杀案。受害者伊诺克·德雷伯死于空屋内，墙上留有血字RACHE。',
      '凶手身份成谜，福尔摩斯先生，请开始你的质询。'
    ],
    timeline,
    timelineContradictions,
    objectives,
    endings,
    achievements,
    noteKeywords,
    presetLinks,
    witnessColors,
    getWitnessColor: (id) => witnessColors[id] || "#94a3b8"
  };
})();

window.CaseData_studyInScarlet = CaseData_studyInScarlet;
window.GameData = CaseData_studyInScarlet;
