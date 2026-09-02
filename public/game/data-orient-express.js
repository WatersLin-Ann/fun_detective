/**
 * 案件数据：东方快车谋杀案
 * 通用案件数据格式，支持多案件架构
 * 包含：元信息、场景、证据、证人、对话、矛盾点、预设关联
 */

const CaseData_orientExpress = (function() {
  // 场景数据
  const scenes = [
    {
      id: "intro",
      name: "波洛的包厢",
      description: "深夜，东方快车因大雪被困在南斯拉夫的荒野中。你是著名侦探赫尔克里·波洛，被一阵尖叫声惊醒...",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      sceneType: "room",
      interactables: [
        { id: "door", name: "包厢门", description: "通往走廊的门，外面似乎很吵闹。", type: "object", position: { x: 80, y: 50 } }
      ],
      exits: [{ to: "corridor", label: "走出包厢" }]
    },
    {
      id: "corridor",
      name: "列车走廊",
      description: "昏暗的走廊里，列车员正焦急地敲着一间包厢的门。乘客们纷纷探出头查看情况。",
      background: "linear-gradient(135deg, #2d2d44 0%, #1f1f33 50%, #1a1a2e 100%)",
      sceneType: "corridor",
      interactables: [
        { id: "victim-door", name: "受害者包厢", description: "门被锁住了，里面没有回应。", type: "object", position: { x: 30, y: 40 } },
        { id: "conductor", name: "列车员皮埃尔", description: "穿着制服的列车员，神情紧张。", type: "witness", witnessId: "conductor", color: "#3b82f6", position: { x: 50, y: 45 } },
        { id: "mrs-hubbard", name: "赫伯德夫人", description: "一位美国妇人，看起来很激动。", type: "witness", witnessId: "mrs-hubbard", color: "#ec4899", position: { x: 70, y: 35 } }
      ],
      exits: [
        { to: "victim-room", label: "进入受害者包厢" },
        { to: "dining-car", label: "前往餐车" }
      ]
    },
    {
      id: "victim-room",
      name: "受害者包厢",
      description: "包厢内，一个男人倒在床上，身上有多处刀伤。窗户开着，雪飘了进来。",
      background: "linear-gradient(135deg, #3d1a1a 0%, #2d1414 50%, #1a0d0d 100%)",
      sceneType: "room",
      interactables: [
        { id: "body", name: "尸体", description: "受害者雷切特先生，身中12刀。", type: "evidence", evidenceId: "body", position: { x: 50, y: 55 } },
        { id: "window", name: "敞开的窗户", description: "窗户大开，窗台上有雪，但没有脚印。", type: "evidence", evidenceId: "window", position: { x: 80, y: 30 } },
        { id: "handkerchief", name: "手帕", description: "一块精致的手帕，上面绣着字母\"H\"。", type: "evidence", evidenceId: "handkerchief", position: { x: 25, y: 60 } },
        { id: "watch", name: "怀表", description: "一块摔坏的怀表，指针停在1:15。", type: "evidence", evidenceId: "watch", position: { x: 60, y: 70 } },
        { id: "ash", name: "烟灰", description: "烟灰缸里有两种不同的烟灰。", type: "evidence", evidenceId: "ash", position: { x: 35, y: 40 } }
      ],
      exits: [{ to: "corridor", label: "返回走廊" }]
    },
    {
      id: "dining-car",
      name: "餐车",
      description: "所有乘客都聚集在餐车，气氛紧张。你将在这里进行\"审判\"。",
      background: "linear-gradient(135deg, #2a2a3e 0%, #1e1e30 50%, #181828 100%)",
      sceneType: "dining",
      interactables: [
        { id: "mary", name: "玛丽·德本汉", description: "一位冷静的英国女士，家庭教师。", type: "witness", witnessId: "mary", color: "#8b5cf6", position: { x: 20, y: 40 } },
        { id: "colonel", name: "阿巴斯诺特上校", description: "一位英国军官，看起来很严肃。", type: "witness", witnessId: "colonel", color: "#22c55e", position: { x: 40, y: 50 } },
        { id: "princess", name: "德拉戈米罗夫公主", description: "一位年迈的俄国贵族，神情威严。", type: "witness", witnessId: "princess", color: "#eab308", position: { x: 60, y: 35 } },
        { id: "countess", name: "安德烈伯爵夫人", description: "一位年轻的匈牙利女士，看起来很紧张。", type: "witness", witnessId: "countess", color: "#06b6d4", position: { x: 80, y: 45 } }
      ],
      exits: [{ to: "corridor", label: "返回走廊" }]
    },
    {
      id: "ending",
      name: "结局",
      description: "所有真相都已揭开，现在是做出最终选择的时候...",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      sceneType: "room",
      interactables: [],
      exits: []
    }
  ];

  // 证据数据
  const evidence = [
    {
      id: "body",
      name: "尸体",
      description: "受害者雷切特，身中12刀，伤口深浅不一。",
      keyInfo: "12处刀伤，深浅不一，说明可能有多个凶手，且力度不同。",
      scene: "victim-room",
      foundIn: "受害者包厢的床上"
    },
    {
      id: "window",
      name: "敞开的窗户",
      description: "窗户大开，窗外是雪地，但窗台上没有脚印。",
      keyInfo: "如果凶手从窗户逃走，雪地上应该有脚印，但实际上没有。这说明窗户是故意打开的，伪造逃走路线。",
      scene: "victim-room",
      foundIn: "受害者包厢"
    },
    {
      id: "handkerchief",
      name: "手帕",
      description: "一块精致的女士手帕，角落绣着字母\"H\"。",
      keyInfo: "手帕上的\"H\"可能是凶手的名字首字母。乘客中，赫伯德夫人(Hubbard)和德拉戈米罗夫公主的教名都是H开头。",
      scene: "victim-room",
      foundIn: "受害者包厢地板上"
    },
    {
      id: "watch",
      name: "怀表",
      description: "一块金质怀表，表壳凹陷，指针停在1:15。",
      keyInfo: "怀表停在1:15，这可能是案发时间。但怀表可能被故意调过，用来误导调查方向。",
      scene: "victim-room",
      foundIn: "受害者口袋"
    },
    {
      id: "ash",
      name: "烟灰",
      description: "烟灰缸里有两种不同的烟灰，一种是雪茄，一种是香烟。",
      keyInfo: "受害者只抽雪茄，但现场有香烟灰，说明案发时有另一个人在场。",
      scene: "victim-room",
      foundIn: "受害者包厢烟灰缸"
    }
  ];

  // 证人数据
  const witnesses = [
    {
      id: "conductor",
      name: "列车员皮埃尔",
      description: "东方快车的列车员，在铁路公司工作多年。",
      avatar: "🧑‍✈️",
      color: "#3b82f6",
      initialTestimony: "我整晚都在座位上，大约12:37的时候听到雷切特先生按铃，我过去时他用法语说\"没事，我搞错了\"。之后我就没听到什么动静了。",
      followUpTestimony: "呃...实际上，1:15左右我好像听到了什么声音，但我以为是赫伯德夫人在叫我。我过去的时候她说有个男人在她包厢里。",
      contradiction: {
        evidenceId: "watch",
        description: "怀表停在1:15，与列车员听到动静的时间吻合，但他说以为是赫伯德夫人。",
        revealedText: "怀表停在1:15，而你说1:15听到动静。这真的是巧合吗？还是你在隐瞒什么？"
      }
    },
    {
      id: "mrs-hubbard",
      name: "赫伯德夫人",
      description: "一位聒噪的美国妇人，声称自己包厢里有个男人。",
      avatar: "👩",
      color: "#ec4899",
      initialTestimony: "我跟你说，昨晚有个男人在我包厢里！我按铃叫列车员，但他来的时候那人已经走了。我的包厢和雷切特的是通的，他肯定是从那边过来的！",
      followUpTestimony: "对了，我还在我包厢的地板上发现了一颗列车员制服的纽扣。那肯定是那个男人掉的！",
      contradiction: {
        evidenceId: "handkerchief",
        description: "赫伯德夫人的名字首字母是H，与现场手帕上的字母吻合。",
        revealedText: "赫伯德夫人，您的姓氏是Hubbard，首字母正是H。这块手帕...是您的吧？"
      }
    },
    {
      id: "mary",
      name: "玛丽·德本汉",
      description: "冷静沉着的英国家庭教师，曾在阿姆斯特朗家工作。",
      avatar: "👩‍💼",
      color: "#8b5cf6",
      initialTestimony: "我睡得很沉，什么都没听到。早上醒来才知道出了事。",
      followUpTestimony: "我...我确实认识阿姆斯特朗一家。黛西·阿姆斯特朗是我的学生。但这和谋杀案有什么关系？",
      contradiction: {
        evidenceId: "ash",
        description: "玛丽抽香烟，而现场有香烟灰，但她说自己睡得很沉。",
        revealedText: "德本汉小姐，您抽香烟。而现场有香烟灰，受害者只抽雪茄。您说您睡得很沉，那香烟灰是怎么回事？"
      }
    },
    {
      id: "colonel",
      name: "阿巴斯诺特上校",
      description: "英国军官，阿姆斯特朗上校的好友。",
      avatar: "🎖️",
      color: "#22c55e",
      initialTestimony: "我和玛丽·德本汉小姐在聊天，大约1点才回包厢。之后就没出来过。",
      followUpTestimony: "是的，我认识阿姆斯特朗上校。他是我最好的朋友。他女儿被绑架杀害后，他伤心过度去世了。",
      contradiction: null
    },
    {
      id: "princess",
      name: "德拉戈米罗夫公主",
      description: "俄国贵族，阿姆斯特朗夫人的教母。",
      avatar: "👑",
      color: "#eab308",
      initialTestimony: "我年纪大了，睡得早。什么都没听到，什么都不知道。",
      followUpTestimony: "我是索尼娅·阿姆斯特朗的教母。她是个好女孩，她的遭遇太悲惨了。雷切特就是那个绑架犯卡塞蒂，他该死。",
      contradiction: {
        evidenceId: "handkerchief",
        description: "公主的教名是娜塔莉亚(Natalia)，但俄文拼写的首字母看起来像H。",
        revealedText: "公主殿下，您的教名娜塔莉亚，用俄文拼写时首字母看起来就像H。这块手帕，是您的吧？"
      }
    },
    {
      id: "countess",
      name: "安德烈伯爵夫人",
      description: "匈牙利外交官的妻子，护照上的名字似乎被涂改过。",
      avatar: "💃",
      color: "#06b6d4",
      initialTestimony: "我和丈夫一直待在包厢里，吃了安眠药就睡了。",
      followUpTestimony: "我...我是海伦娜·戈登伯格，索尼娅·阿姆斯特朗的妹妹。我护照上的名字被我丈夫改了，他想保护我。",
      contradiction: null
    }
  ];

  // 对话数据
  const dialogs = {
    intro: [
      "深夜，东方快车因大雪被困在南斯拉夫的荒野中。",
      "你是赫尔克里·波洛，世界上最伟大的侦探。",
      "一阵尖叫声将你从睡梦中惊醒...",
      "你走出包厢，看到列车员正在焦急地敲一扇门。",
      "\"波洛先生！\"列车员看到你，如释重负，\"雷切特先生没有回应，门被锁住了！\"",
      "你意识到，这可能不是一起简单的意外..."
    ],
    investigationStart: [
      "你决定亲自调查这起案件。",
      "首先，你需要查看犯罪现场，收集证据。",
      "然后，你需要询问乘客，获取证词。",
      "最后，在餐车进行\"审判\"，找出真相。",
      "点击场景中的物品和人物进行互动。",
      "收集至少3件证据和询问2个证人后，可前往餐车进行审判。"
    ]
  };

  // 矛盾点数据
  const contradictions = [
    { id: "c1", witnessId: "conductor", evidenceId: "watch", description: "怀表时间与列车员证词的矛盾", revealed: false },
    { id: "c2", witnessId: "mrs-hubbard", evidenceId: "handkerchief", description: "手帕与赫伯德夫人的关联", revealed: false },
    { id: "c3", witnessId: "mary", evidenceId: "ash", description: "香烟灰与玛丽证词的矛盾", revealed: false },
    { id: "c4", witnessId: "princess", evidenceId: "handkerchief", description: "手帕与公主的真实关联", revealed: false }
  ];


  // ========== 时间线数据 ==========
  const timeline = [
    { id: 'tl-oe-001', time: '22:00', title: '列车发车', description: '东方快车从贝尔格莱德站发车，开始前往加来的旅程。', source: '场景', sourceId: 'intro', category: '行程' },
    { id: 'tl-oe-002', time: '23:00', title: '列车员开始巡逻', description: '列车员皮埃尔开始夜间巡逻，检查各包厢情况。', source: '证人', sourceId: 'conductor', category: '证词' },
    { id: 'tl-oe-003', time: '00:10', title: '赫伯德夫人按铃', description: '赫伯德夫人按铃呼叫列车员，说有人在她的包厢里。', source: '证人', sourceId: 'mrs-hubbard', category: '证词' },
    { id: 'tl-oe-004', time: '00:20', title: '列车因大雪停车', description: '列车因前方大雪覆盖轨道，被迫停在南斯拉夫荒野中。', source: '场景', sourceId: 'corridor', category: '行程' },
    { id: 'tl-oe-005', time: '01:15', title: '怀表停止', description: '现场发现的怀表停在1:15，推测这是谋杀发生的时间。', source: '证据', sourceId: 'watch', category: '物证' },
    { id: 'tl-oe-006', time: '01:20', title: '公主女仆按铃', description: '公主的女仆按铃要水，说公主睡不着。', source: '证人', sourceId: 'princess', category: '证词' },
    { id: 'tl-oe-007', time: '01:30', title: '上校与玛丽在走廊', description: '上校说他和玛丽在走廊交谈了约10分钟。', source: '证人', sourceId: 'colonel', category: '证词' },
    { id: 'tl-oe-008', time: '02:00', title: '列车员听到声音', description: '列车员说他在2点左右听到赫伯德夫人包厢有声音。', source: '证人', sourceId: 'conductor', category: '证词' }
  ];

  // 时间线矛盾
  const timelineContradictions = [
    { id: 'tc-oe-001', event1: 'tl-oe-003', event2: 'tl-oe-002', description: '赫伯德夫人说00:10有人在她包厢并按铃，但列车员说23:00开始巡逻后00:10在其他车厢，两人说法矛盾。', confidence: 15 },
    { id: 'tc-oe-002', event1: 'tl-oe-007', event2: 'tl-oe-006', description: '上校说01:30和玛丽在走廊交谈，但玛丽说她01:20就已经睡着了，两人证词时间冲突。', confidence: 15 }
  ];

  // 证人颜色映射
  const witnessColors = {
    conductor: "#3b82f6",
    "mrs-hubbard": "#ec4899",
    mary: "#8b5cf6",
    colonel: "#22c55e",
    princess: "#eab308",
    countess: "#06b6d4"
  };

  // 预设证据关联（推理游戏核心）
  const presetLinks = [
    {
      id: 'link-watch-conductor',
      from: 'watch', to: 'conductor',
      fromType: 'evidence', toType: 'witness',
      title: '时间矛盾',
      conclusion: '怀表停在1:15，而列车员说1:15听到动静却以为是赫伯德夫人。时间完全吻合，这不是巧合。',
      confidence: 20
    },
    {
      id: 'link-handkerchief-hubbard',
      from: 'handkerchief', to: 'mrs-hubbard',
      fromType: 'evidence', toType: 'witness',
      title: '手帕的H字母',
      conclusion: '现场手帕绣着字母"H"，而赫伯德夫人(Hubbard)的姓氏首字母正是H。这块手帕可能属于她。',
      confidence: 15
    },
    {
      id: 'link-ash-mary',
      from: 'ash', to: 'mary',
      fromType: 'evidence', toType: 'witness',
      title: '香烟灰的秘密',
      conclusion: '现场有两种烟灰，受害者只抽雪茄。玛丽抽香烟，而她说自己睡得很沉——那香烟灰是怎么来的？',
      confidence: 20
    },
    {
      id: 'link-handkerchief-princess',
      from: 'handkerchief', to: 'princess',
      fromType: 'evidence', toType: 'witness',
      title: '俄文的H',
      conclusion: '手帕上的"H"在俄文中对应"N"，而公主的教名娜塔莉亚(Natalia)首字母正是N。这块手帕的真正主人可能是公主。',
      confidence: 25
    },
    {
      id: 'link-window-body',
      from: 'window', to: 'body',
      fromType: 'evidence', toType: 'evidence',
      title: '伪造的逃走路线',
      conclusion: '窗户大开但雪地上没有脚印，说明凶手没有从窗户逃走。窗户是故意打开的，用来伪造外人作案的假象。',
      confidence: 15
    }
  ];

  return {
    // 案件元信息
    meta: {
      id: 'orient-express',
      name: '东方快车：推理审判',
      description: '阿加莎·克里斯蒂经典作品改编。深夜列车上发生谋杀案，12名乘客各怀秘密，你需要通过收集证据、询问证人、关联线索来揭开真相。',
      difficulty: '中等',
      author: '阿加莎·克里斯蒂',
      estimatedTime: '20-30分钟',
      tags: ['推理小说', '封闭空间', '多人作案']
    },
    scenes,
    evidence,
    witnesses,
    dialogs,
    contradictions,
    timeline,
    timelineContradictions,
    presetLinks,
    witnessColors,
    getWitnessColor: (id) => witnessColors[id] || "#94a3b8"
  };
})();

window.CaseData_orientExpress = CaseData_orientExpress;
// 兼容旧代码
window.GameData = CaseData_orientExpress;
