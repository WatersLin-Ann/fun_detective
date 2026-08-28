# S1：飞书 Base 搭建执行计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在飞书云空间指定文件夹下创建「全球案件案例库」多维表格，完成两张表（案件库+线索链）的全部字段、关联、公式、视图和筛选器配置。

**Architecture:** 通过 lark-cli 命令行工具调用飞书开放平台 API，分步创建 Base → 配置主表字段 → 创建子表 → 配置双向关联 → 配置公式 → 创建视图 → 验收。所有操作以 `--as user` 身份执行。

**Tech Stack:** lark-cli v1.0.88, 飞书多维表格（Base/Bitable）API

**Spec:** `docs/superpowers/specs/2026-08-26-s1-base-setup.md`

**目标文件夹:** `Ir73fLcOVlnD22dZhRIc2267nAh`（飞书云空间 fun_detective 文件夹）

## Global Constraints

- Base 名称：全球案件案例库
- 主表名称：案件库（27个字段）
- 子表名称：线索链（7个字段）
- 时区：Asia/Shanghai
- 所有命令使用 `--as user` 身份
- 高风险操作（删除等）需 `--yes` 确认，本计划无删除操作
- 字段创建使用 JSON 数组批量创建，每批不超过10个字段
- 视图创建后需依次配置：显示字段顺序 → 排序 → 分组 → 筛选

---

## 目录结构

### 本地项目目录
```
E:\Work\AIProjects\fun_detective\
├── docs\
│   └── superpowers\
│       ├── specs\
│       │   ├── 2026-08-26-case-library-design.md      # 总方案
│       │   ├── 2026-08-26-s1-base-setup.md            # S1 搭建手册
│       │   └── 2026-08-26-s2-content-standards.md     # S2 录入规范
│       └── plans\
│           └── 2026-08-27-s1-base-build.md             # 本执行计划
└── folder_screenshot.png                                 # 临时文件（可删除）
```

### 飞书云端目录结构
```
飞书云空间 / fun_detective /
└── 全球案件案例库（Base）
    ├── 案件库（主表，27字段）
    │   ├── 视图：全部案件
    │   ├── 视图：故事阅读视图
    │   ├── 视图：设计参考视图
    │   ├── 视图：悬案专区
    │   ├── 视图：按难度排序
    │   └── 视图：录入进度看板（看板视图）
    └── 线索链（子表，7字段）
        ├── 视图：全部线索
        └── 视图：按线索类型
```

---

## Task 1: 创建 Base 与主表初始字段

**目标:** 创建 Base，同时创建主表「案件库」和第一批核心字段。

**输出:** base_token, 主表 table_id

- [ ] **Step 1: 创建 Base 并初始化主表前8个字段**

执行命令：
```bash
lark-cli base +base-create --name "全球案件案例库" --folder-token "Ir73fLcOVlnD22dZhRIc2267nAh" --time-zone "Asia/Shanghai" --table-name "案件库" --fields '[{"name":"案件名称","type":"text"},{"name":"来源类型","type":"select","multiple":false,"options":[{"name":"真实案件"},{"name":"推理小说"},{"name":"影视"},{"name":"游戏"},{"name":"历史谜案"},{"name":"都市传说"}]},{"name":"来源作品/事件","type":"text"},{"name":"创作者","type":"text"},{"name":"地区","type":"select","multiple":false,"options":[{"name":"日本"},{"name":"欧美"},{"name":"中国"},{"name":"其他"}]},{"name":"年代","type":"select","multiple":false,"options":[{"name":"古典（1900前）"},{"name":"近现代（1900-1980）"},{"name":"当代（1980后）"}]},{"name":"案件状态","type":"select","multiple":false,"options":[{"name":"已破案"},{"name":"悬案"},{"name":"虚构结局"}]},{"name":"一句话简介","type":"text"}]' --as user
```

预期输出：JSON 包含 `data.app_token`（即 base_token）和 `data.table_id`。

- [ ] **Step 2: 记录 base_token 和主表 table_id**

从返回结果中提取并记录：
- `BASE_TOKEN = data.app_token`
- `MAIN_TABLE_ID = data.table_id`（或 data.table_id_list[0]）

后续所有命令使用这两个变量。

---

## Task 2: 添加主表故事视图字段（5个）

**目标:** 为主表添加故事视图相关的5个多行文本字段。

- [ ] **Step 1: 批量添加故事视图字段**

```bash
lark-cli base +field-create --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --json '[{"name":"故事摘要","type":"text"},{"name":"完整故事","type":"text"},{"name":"人物关系","type":"text"},{"name":"关键时间线","type":"text"},{"name":"结局/真相","type":"text"}]' --as user
```

预期输出：`ok: true`，返回5个字段的 ID。

---

## Task 3: 添加主表设计视图字段（第一批，6个）

**目标:** 添加设计视图的核心字段：核心诡计简述、诡计类型、可复用机制、信息差分析、红鲱鱼/误导。

- [ ] **Step 1: 批量添加设计视图字段**

```bash
lark-cli base +field-create --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --json '[{"name":"核心诡计简述","type":"text"},{"name":"诡计类型","type":"select","multiple":true,"options":[{"name":"密室"},{"name":"不在场证明"},{"name":"叙述性诡计"},{"name":"身份诡计"},{"name":"心理操控"},{"name":"时刻表"},{"name":"物理机关"},{"name":"毒杀"},{"name":"其他"}]},{"name":"可复用机制","type":"select","multiple":true,"options":[{"name":"封闭空间"},{"name":"限时破案"},{"name":"多视角叙事"},{"name":"连环案件"},{"name":"叙述者不可靠"},{"name":"死亡信息"},{"name":"其他"}]},{"name":"信息差分析","type":"text"},{"name":"红鲱鱼/误导","type":"text"}]' --as user
```

预期输出：`ok: true`，返回5个字段的 ID。

---

## Task 4: 添加主表设计视图难度字段（3个数字字段）

**目标:** 添加三个难度评分数字字段。

- [ ] **Step 1: 批量添加难度数字字段**

```bash
lark-cli base +field-create --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --json '[{"name":"难度-线索密度","type":"number"},{"name":"难度-误导数量","type":"number"},{"name":"难度-诡计隐蔽度","type":"number"}]' --as user
```

预期输出：`ok: true`，返回3个字段的 ID。

---

## Task 5: 添加主表管理字段（4个）

**目标:** 添加录入状态、录入日期、最后更新、备注字段。

- [ ] **Step 1: 批量添加管理字段**

```bash
lark-cli base +field-create --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --json '[{"name":"录入状态","type":"select","multiple":false,"options":[{"name":"待录入"},{"name":"故事完成"},{"name":"设计完成"},{"name":"完整"}]},{"name":"录入日期","type":"date"},{"name":"最后更新","type":"date"},{"name":"备注","type":"text"}]' --as user
```

预期输出：`ok: true`，返回4个字段的 ID。

---

## Task 6: 创建子表「线索链」

**目标:** 创建第二张表「线索链」，包含全部7个字段。

**输出:** 子表 table_id（SUB_TABLE_ID）

- [ ] **Step 1: 创建子表及全部字段**

```bash
lark-cli base +table-create --base-token "$BASE_TOKEN" --name "线索链" --fields '[{"name":"线索编号","type":"auto_number"},{"name":"关联案件","type":"text"},{"name":"线索内容","type":"text"},{"name":"线索类型","type":"select","multiple":false,"options":[{"name":"关键线索"},{"name":"误导线索"},{"name":"背景信息"}]},{"name":"指向结论","type":"text"},{"name":"出现时机","type":"select","multiple":false,"options":[{"name":"开篇"},{"name":"前期"},{"name":"中期"},{"name":"后期"},{"name":"终局"}]},{"name":"备注","type":"text"}]' --as user
```

预期输出：`ok: true`，返回子表 `table_id`。

- [ ] **Step 2: 记录子表 table_id**

`SUB_TABLE_ID = data.table_id`

---

## Task 7: 配置双向关联

**目标:** 在主表添加「关联线索」字段，关联到子表；子表的「关联案件」将由双向关联自动生成，需删除之前创建的占位文本字段。

- [ ] **Step 1: 在主表添加关联字段「关联线索」**

```bash
lark-cli base +field-create --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --json '{"name":"关联线索","type":"link","table_id":"'"$SUB_TABLE_ID"'","multiple":true}' --as user
```

预期输出：`ok: true`，返回关联字段 ID。飞书会自动在子表创建反向关联字段。

- [ ] **Step 2: 验证子表反向关联字段已创建**

```bash
lark-cli base +field-list --base-token "$BASE_TOKEN" --table-id "$SUB_TABLE_ID" --as user
```

检查返回中是否存在名为「关联案件」的 link 类型字段。如果自动创建了，删除 Task 6 中创建的「关联案件」文本占位字段。

- [ ] **Step 3: 删除子表中的「关联案件」文本占位字段（如存在）**

先获取该字段的 field_id：
```bash
lark-cli base +field-list --base-token "$BASE_TOKEN" --table-id "$SUB_TABLE_ID" --as user --jq '.data.items[] | select(.field_name=="关联案件" and .type!=18) | .field_id'
```

然后删除：
```bash
lark-cli base +field-delete --base-token "$BASE_TOKEN" --table-id "$SUB_TABLE_ID" --field-id "<占位字段ID>" --as user --yes
```

---

## Task 8: 配置难度综合公式字段

**目标:** 在主表添加「难度综合」公式字段，自动计算三项难度平均分。

- [ ] **Step 1: 添加公式字段**

```bash
lark-cli base +field-create --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --json '{"name":"难度综合","type":"formula","formula":"ROUND(([难度-线索密度]+[难度-误导数量]+[难度-诡计隐蔽度])/3,1)"}' --as user
```

预期输出：`ok: true`。如果公式语法报错，根据错误信息调整字段引用格式（可能需要用字段 ID 而非字段名）。

- [ ] **Step 2: 验证公式字段**

```bash
lark-cli base +field-get --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --field-id "<公式字段ID>" --as user
```

确认字段类型为 formula，公式表达式正确。

---

## Task 9: 创建主表视图（6个）

### 视图1：全部案件（默认表格视图）

- [ ] **Step 1: 创建视图**
```bash
lark-cli base +view-create --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --json '{"name":"全部案件","type":"grid"}' --as user
```

- [ ] **Step 2: 设置显示字段顺序**
```bash
lark-cli base +view-set-visible-fields --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "全部案件" --json '{"visible_fields":["案件名称","来源类型","来源作品/事件","地区","年代","诡计类型","难度综合","录入状态"]}' --as user
```

- [ ] **Step 3: 设置排序（录入日期倒序）**
```bash
lark-cli base +view-set-sort --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "全部案件" --json '{"sort_infos":[{"field_name":"录入日期","desc":true}]}' --as user
```

### 视图2：故事阅读视图

- [ ] **Step 4: 创建视图**
```bash
lark-cli base +view-create --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --json '{"name":"故事阅读视图","type":"grid"}' --as user
```

- [ ] **Step 5: 设置显示字段**
```bash
lark-cli base +view-set-visible-fields --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "故事阅读视图" --json '{"visible_fields":["案件名称","来源类型","来源作品/事件","故事摘要","完整故事","人物关系","关键时间线","结局/真相"]}' --as user
```

- [ ] **Step 6: 设置分组（按来源类型）**
```bash
lark-cli base +view-set-group --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "故事阅读视图" --json '{"group_infos":[{"field_name":"来源类型","desc":false}]}' --as user
```

- [ ] **Step 7: 设置筛选（录入状态=完整）**
```bash
lark-cli base +view-set-filter --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "故事阅读视图" --json '{"conjunction":"and","conditions":[{"field_name":"录入状态","operator":"is","value":["完整"]}]}' --as user
```

### 视图3：设计参考视图

- [ ] **Step 8: 创建视图**
```bash
lark-cli base +view-create --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --json '{"name":"设计参考视图","type":"grid"}' --as user
```

- [ ] **Step 9: 设置显示字段**
```bash
lark-cli base +view-set-visible-fields --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "设计参考视图" --json '{"visible_fields":["案件名称","来源类型","诡计类型","核心诡计简述","可复用机制","信息差分析","难度-线索密度","难度-误导数量","难度-诡计隐蔽度","难度综合","关联线索"]}' --as user
```

- [ ] **Step 10: 设置排序（难度综合倒序）**
```bash
lark-cli base +view-set-sort --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "设计参考视图" --json '{"sort_infos":[{"field_name":"难度综合","desc":true}]}' --as user
```

- [ ] **Step 11: 设置筛选（录入状态=完整）**
```bash
lark-cli base +view-set-filter --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "设计参考视图" --json '{"conjunction":"and","conditions":[{"field_name":"录入状态","operator":"is","value":["完整"]}]}' --as user
```

### 视图4：悬案专区

- [ ] **Step 12: 创建视图**
```bash
lark-cli base +view-create --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --json '{"name":"悬案专区","type":"grid"}' --as user
```

- [ ] **Step 13: 设置显示字段**
```bash
lark-cli base +view-set-visible-fields --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "悬案专区" --json '{"visible_fields":["案件名称","来源类型","地区","年代","一句话简介","故事摘要","结局/真相","诡计类型"]}' --as user
```

- [ ] **Step 14: 设置分组（按地区）**
```bash
lark-cli base +view-set-group --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "悬案专区" --json '{"group_infos":[{"field_name":"地区","desc":false}]}' --as user
```

- [ ] **Step 15: 设置筛选（案件状态=悬案）**
```bash
lark-cli base +view-set-filter --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "悬案专区" --json '{"conjunction":"and","conditions":[{"field_name":"案件状态","operator":"is","value":["悬案"]}]}' --as user
```

### 视图5：按难度排序

- [ ] **Step 16: 创建视图**
```bash
lark-cli base +view-create --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --json '{"name":"按难度排序","type":"grid"}' --as user
```

- [ ] **Step 17: 设置显示字段**
```bash
lark-cli base +view-set-visible-fields --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "按难度排序" --json '{"visible_fields":["案件名称","来源类型","诡计类型","难度-线索密度","难度-误导数量","难度-诡计隐蔽度","难度综合","核心诡计简述"]}' --as user
```

- [ ] **Step 18: 设置排序（难度综合倒序）**
```bash
lark-cli base +view-set-sort --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "按难度排序" --json '{"sort_infos":[{"field_name":"难度综合","desc":true}]}' --as user
```

- [ ] **Step 19: 设置筛选（录入状态=完整）**
```bash
lark-cli base +view-set-filter --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "按难度排序" --json '{"conjunction":"and","conditions":[{"field_name":"录入状态","operator":"is","value":["完整"]}]}' --as user
```

### 视图6：录入进度看板（看板视图）

- [ ] **Step 20: 创建看板视图**
```bash
lark-cli base +view-create --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --json '{"name":"录入进度看板","type":"kanban"}' --as user
```

- [ ] **Step 21: 设置看板分组（按录入状态）**
```bash
lark-cli base +view-set-group --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "录入进度看板" --json '{"group_infos":[{"field_name":"录入状态","desc":false}]}' --as user
```

- [ ] **Step 22: 设置卡片显示字段**
```bash
lark-cli base +view-set-card --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --view-id "录入进度看板" --json '{"card_fields":["案件名称","来源类型","诡计类型","难度综合"]}' --as user
```

---

## Task 10: 创建子表视图（2个）

### 视图1：全部线索

- [ ] **Step 1: 创建视图**
```bash
lark-cli base +view-create --base-token "$BASE_TOKEN" --table-id "$SUB_TABLE_ID" --json '{"name":"全部线索","type":"grid"}' --as user
```

- [ ] **Step 2: 设置显示字段**
```bash
lark-cli base +view-set-visible-fields --base-token "$BASE_TOKEN" --table-id "$SUB_TABLE_ID" --view-id "全部线索" --json '{"visible_fields":["线索编号","关联案件","线索类型","线索内容","指向结论","出现时机"]}' --as user
```

- [ ] **Step 3: 设置分组（按关联案件）**
```bash
lark-cli base +view-set-group --base-token "$BASE_TOKEN" --table-id "$SUB_TABLE_ID" --view-id "全部线索" --json '{"group_infos":[{"field_name":"关联案件","desc":false}]}' --as user
```

### 视图2：按线索类型

- [ ] **Step 4: 创建视图**
```bash
lark-cli base +view-create --base-token "$BASE_TOKEN" --table-id "$SUB_TABLE_ID" --json '{"name":"按线索类型","type":"grid"}' --as user
```

- [ ] **Step 5: 设置显示字段**
```bash
lark-cli base +view-set-visible-fields --base-token "$BASE_TOKEN" --table-id "$SUB_TABLE_ID" --view-id "按线索类型" --json '{"visible_fields":["线索编号","关联案件","线索类型","线索内容","指向结论","出现时机"]}' --as user
```

- [ ] **Step 6: 设置分组（按线索类型）**
```bash
lark-cli base +view-set-group --base-token "$BASE_TOKEN" --table-id "$SUB_TABLE_ID" --view-id "按线索类型" --json '{"group_infos":[{"field_name":"线索类型","desc":false}]}' --as user
```

---

## Task 11: 搭建验收

**目标:** 对照 S1 搭建手册的验收清单，逐项验证。

- [ ] **Step 1: 验证两张表存在**
```bash
lark-cli base +table-list --base-token "$BASE_TOKEN" --as user
```
确认返回中包含「案件库」和「线索链」两张表。

- [ ] **Step 2: 验证主表字段数量（应为27个）**
```bash
lark-cli base +field-list --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --as user --jq '.data.items | length'
```
预期输出：27（含系统字段可能略有差异，核心字段需全部存在）。

- [ ] **Step 3: 验证子表字段数量（应为7个）**
```bash
lark-cli base +field-list --base-token "$BASE_TOKEN" --table-id "$SUB_TABLE_ID" --as user --jq '.data.items | length'
```

- [ ] **Step 4: 验证双向关联**
检查主表有「关联线索」link 字段，子表有「关联案件」link 字段。

- [ ] **Step 5: 验证公式字段**
创建一条测试记录，填入三项难度分（如3,4,5），验证「难度综合」自动计算为4.0。

- [ ] **Step 6: 验证视图数量**
```bash
lark-cli base +view-list --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --as user --jq '.data.items | length'
```
主表应有至少6个视图（含默认视图可能7个）。

- [ ] **Step 7: 删除测试记录（如有）**
```bash
lark-cli base +record-delete --base-token "$BASE_TOKEN" --table-id "$MAIN_TABLE_ID" --record-id "<测试记录ID>" --as user --yes
```

- [ ] **Step 8: 输出最终 Base 链接**
```
https://jcnj7m36anud.feishu.cn/base/$BASE_TOKEN
```

---

## 风险与应对

| 风险 | 应对 |
|---|---|
| 字段 JSON 格式错误 | 执行前用 `--dry-run` 预览请求；分批创建便于定位错误 |
| 公式字段语法不兼容 | 先用简单公式验证语法，再替换为完整公式；必要时用字段 ID 引用 |
| 关联字段创建失败 | 确认子表 table_id 正确；link 字段的 JSON 属性名可能需调整 |
| 视图筛选/分组 JSON 格式错误 | 先用 `+view-get-filter` 等命令读取现有视图配置，参照格式 |
| 命令超时 | 分批操作，每批字段不超过10个；视图逐个创建 |
| 自动编号字段类型不支持 | 如 `auto_number` 类型报错，改用 `text` 类型手动编号，或查文档确认正确类型名 |

---

## Self-Review

**1. Spec coverage:**
- ✅ 主表27字段：Task 1（8个）+ Task 2（5个）+ Task 3（5个）+ Task 4（3个）+ Task 5（4个）+ Task 7（关联1个）+ Task 8（公式1个）= 27个
- ✅ 子表7字段：Task 6 创建（关联字段由双向关联自动生成，需删除占位文本）
- ✅ 6个主表视图：Task 9 全部覆盖
- ✅ 2个子表视图：Task 10 全部覆盖
- ✅ 双向关联：Task 7
- ✅ 公式字段：Task 8
- ✅ 验收清单：Task 11

**2. Placeholder scan:** 无 TBD/TODO，所有命令包含完整参数。变量 `$BASE_TOKEN`、`$MAIN_TABLE_ID`、`$SUB_TABLE_ID` 在 Task 1 和 Task 6 中明确定义。

**3. Type consistency:** 字段名称在所有任务中保持一致；视图名称与 S1 搭建手册一致。

---

*计划完成后，执行选项：1) Subagent-Driven（每个 Task 派一个子 agent）；2) Inline Execution（在当前会话中按 Task 顺序执行）。推荐 Inline Execution，因为 Task 之间有强依赖（base_token/table_id 需要传递），且命令执行较快。*
