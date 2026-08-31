/**
 * 东方快车谋杀案 - 游戏数据
 * 包含：场景、证据、证人、对话、矛盾点
 */

const GameData = (function() {
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
      "收集至少3件证据和询问3个证人后，可前往餐车进行审判。"
    ]
  };

  // 矛盾点数据
  const contradictions = [
    { id: "c1", witnessId: "conductor", evidenceId: "watch", description: "怀表时间与列车员证词的矛盾", revealed: false },
    { id: "c2", witnessId: "mrs-hubbard", evidenceId: "handkerchief", description: "手帕与赫伯德夫人的关联", revealed: false },
    { id: "c3", witnessId: "mary", evidenceId: "ash", description: "香烟灰与玛丽证词的矛盾", revealed: false },
    { id: "c4", witnessId: "princess", evidenceId: "handkerchief", description: "手帕与公主的真实关联", revealed: false }
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

  return {
    scenes,
    evidence,
    witnesses,
    dialogs,
    contradictions,
    witnessColors,
    getWitnessColor: (id) => witnessColors[id] || "#94a3b8"
  };
})();

window.GameData = GameData;
