# S1 执行确认清单（执行前必读）

> 状态：待确认  
> 确认后按步骤执行，不可跳步

---

## 一、执行前确认项

| 项目 | 值 | 确认 |
|---|---|---|
| 飞书 folder_token | `Ir73fLcOVlnD22dZhRIc2267nAh`（fun_detective 文件夹） | ⬜ |
| Base 名称 | 全球案件案例库 | ⬜ |
| 时区 | Asia/Shanghai | ⬜ |
| 主表名称 | 案件库 | ⬜ |
| 子表名称 | 线索链 | ⬜ |
| 执行身份 | --as user（用户身份） | ⬜ |

---

## 二、目录结构说明

### 2.1 飞书云端目录
```
我的空间 / fun_detective /
  └── 全球案件案例库（Base）
        ├── 数据表：案件库（主表）
        └── 数据表：线索链（子表）
```

### 2.2 本地项目目录
```
E:\Work\AIProjects\fun_detective\
├── docs\
│   └── superpowers\
│       └── specs\
│           ├── 2026-08-26-case-library-design.md      （总方案）
│           ├── 2026-08-26-s1-base-setup.md            （S1 搭建手册）
│           ├── 2026-08-26-s2-content-standards.md     （S2 录入规范）
│           └── 2026-08-27-s1-execution-checklist.md   （本文件）
├── data\                    （后续：案件素材、参考资料）
├── scripts\                 （后续：自动化脚本）
└── folder_screenshot.png    （临时：用户提供的文件夹截图，执行后可删）
```

---

## 三、详细执行步骤

### 步骤 1：创建 Base（带初始表）

**命令：**
```bash
lark-cli base +base-create \
  --name "全球案件案例库" \
  --table-name "案件库" \
  --folder-token "Ir73fLcOVlnD22dZhRIc2267nAh" \
  --time-zone "Asia/Shanghai" \
  --as user \
  --json '[
    {"name":"案件名称","type":"text"},
    {"name":"来源类型","type":"select","multiple":false,"options":[{"name":"真实案件"},{"name":"推理小说"},{"name":"影视"},{"name":"游戏"},{"name":"历史谜案"},{"name":"都市传说"}]},
    {"name":"来源作品/事件","type":"text"},
    {"name":"创作者","type":"text"},
    {"name":"地区","type":"select","multiple":false,"options":[{"name":"日本"},{"name":"欧美"},{"name":"中国"},{"name":"其他"}]},
    {"name":"年代","type":"select","multiple":false,"options":[{"name":"古典（1900前）"},{"name":"近现代（1900-1980）"},{"name":"当代（1980后）"}]},
    {"name":"案件状态","type":"select","multiple":false,"options":[{"name":"已破案"},{"name":"悬案"},{"name":"虚构结局"}]},
    {"name":"一句话简介","type":"text"}
  ]'
```

**预期输出：**
- `ok: true`
- 返回 `base_token`（如 `bascnXXXXXX`）
- 返回初始表的 `table_id`（如 `tblXXXXXX`）
- 返回 `app_token`（Base 的唯一标识）

**记录关键 ID：**
- base_token: `__________`（执行后填写）
- 案件库 table_id: `__________`（执行后填写）

**风险点：**
- 如果 `--fields` JSON 格式错误，会创建默认 schema 的表 → 需删除重建或补字段
- 如果 folder_token 无效，会创建在根目录 → 需移动文件夹

---

### 步骤 2：添加主表「故事视图」字段

**命令（批量创建，一个数组）：**
```bash
lark-cli base +field-create \
  --base-token "<base_token>" \
  --table-id "<案件库_table_id>" \
  --as user \
  --json '[
    {"name":"故事摘要","type":"text"},
    {"name":"完整故事","type":"text"},
    {"name":"人物关系","type":"text"},
    {"name":"关键时间线","type":"text"},
    {"name":"结局/真相","type":"text"}
  ]'
```

**注意：** 飞书 Base 的长文本字段类型可能是 `text`（多行文本），需确认。如果 `text` 是单行，长文本可能需要其他类型。执行时先创建一个测试确认。

**预期输出：**
- `ok: true`
- 返回5个字段的 field_id

---

### 步骤 3：添加主表「设计视图」基础字段

**命令：**
```bash
lark-cli base +field-create \
  --base-token "<base_token>" \
  --table-id "<案件库_table_id>" \
  --as user \
  --json '[
    {"name":"核心诡计简述","type":"text"},
    {"name":"诡计类型","type":"select","multiple":true,"options":[{"name":"密室"},{"name":"不在场证明"},{"name":"叙述性诡计"},{"name":"身份诡计"},{"name":"心理操控"},{"name":"时刻表"},{"name":"物理机关"},{"name":"毒杀"},{"name":"其他"}]},
    {"name":"可复用机制","type":"select","multiple":true,"options":[{"name":"封闭空间"},{"name":"限时破案"},{"name":"多视角叙事"},{"name":"连环案件"},{"name":"叙述者不可靠"},{"name":"死亡信息"},{"name":"其他"}]},
    {"name":"信息差分析","type":"text"},
    {"name":"红鲱鱼/误导","type":"text"},
    {"name":"难度-线索密度","type":"number"},
    {"name":"难度-误导数量","type":"number"},
    {"name":"难度-诡计隐蔽度","type":"number"}
  ]'
```

**预期输出：**
- `ok: true`
- 返回8个字段的 field_id

---

### 步骤 4：添加主表「管理字段」

**命令：**
```bash
lark-cli base +field-create \
  --base-token "<base_token>" \
  --table-id "<案件库_table_id>" \
  --as user \
  --json '[
    {"name":"录入状态","type":"select","multiple":false,"options":[{"name":"待录入"},{"name":"故事完成"},{"name":"设计完成"},{"name":"完整"}]},
    {"name":"录入日期","type":"date"},
    {"name":"最后更新","type":"date"},
    {"name":"备注","type":"text"}
  ]'
```

**注意：**
- 「录入日期」和「最后更新」的自动填充属性（创建时自动填入、修改时自动更新）可能需要在字段创建后通过 UI 设置，或通过 field-update 配置。执行时确认 API 是否支持。
- 「录入状态」默认值设为「待录入」可能需要额外配置。

---

### 步骤 5：创建子表「线索链」

**命令：**
```bash
lark-cli base +table-create \
  --base-token "<base_token>" \
  --name "线索链" \
  --as user
```

**预期输出：**
- 返回子表的 `table_id`

**记录：**
- 线索链 table_id: `__________`

---

### 步骤 6：配置子表字段

**命令：**
```bash
lark-cli base +field-create \
  --base-token "<base_token>" \
  --table-id "<线索链_table_id>" \
  --as user \
  --json '[
    {"name":"线索编号","type":"text"},
    {"name":"线索内容","type":"text"},
    {"name":"线索类型","type":"select","multiple":false,"options":[{"name":"关键线索"},{"name":"误导线索"},{"name":"背景信息"}]},
    {"name":"指向结论","type":"text"},
    {"name":"出现时机","type":"select","multiple":false,"options":[{"name":"开篇"},{"name":"前期"},{"name":"中期"},{"name":"后期"},{"name":"终局"}]},
    {"name":"备注","type":"text"}
  ]'
```

**注意：**
- 「线索编号」的自动编号属性可能需要 UI 设置或特殊字段类型。飞书 Base 有「自动编号」字段类型，需确认 type 名称。
- 「关联案件」字段不在此处创建，在步骤7统一配置双向关联。

---

### 步骤 7：配置双向关联

**在主表创建「关联线索」字段：**
```bash
lark-cli base +field-create \
  --base-token "<base_token>" \
  --table-id "<案件库_table_id>" \
  --as user \
  --json '{
    "name":"关联线索",
    "type":"link",
    "table_id":"<线索链_table_id>",
    "multiple":true
  }'
```

**预期：** 创建关联字段时，如果开启双向关联，会自动在子表创建「关联案件」反向字段。需确认 API 是否支持 `multiple` 和双向关联参数。

**如果 API 不支持自动双向关联：**
- 手动在子表创建「关联案件」字段，关联回主表，`multiple:false`

---

### 步骤 8：配置公式字段「难度综合」

**命令：**
```bash
lark-cli base +field-create \
  --base-token "<base_token>" \
  --table-id "<案件库_table_id>" \
  --as user \
  --json '{
    "name":"难度综合",
    "type":"formula",
    "formula":"ROUND(([难度-线索密度] + [难度-误导数量] + [难度-诡计隐蔽度]) / 3, 1)"
  }'
```

**注意：**
- 公式字段的 JSON 格式需确认（可能是 `formula` 或 `expression` 或其他属性名）
- 字段引用语法需确认（方括号？直接字段名？）
- 执行前先用 `--dry-run` 预览，或先读 formula-field-guide.md

**如果公式创建失败：**
- 降级方案：先创建数字字段，后续手动在 UI 中设置公式
- 或用 `+field-update` 修改字段属性

---

### 步骤 9：创建主表视图

飞书 Base 的视图创建可能需要逐个通过 API 创建，或部分配置只能在 UI 完成。

**创建表格视图（命令格式待确认）：**
```bash
lark-cli base +view-create \
  --base-token "<base_token>" \
  --table-id "<案件库_table_id>" \
  --name "全部案件" \
  --type "grid" \
  --as user
```

**需要创建的6个视图：**
| 视图名 | 类型 | 排序 | 分组 | 筛选 |
|---|---|---|---|---|
| 全部案件 | grid | 录入日期降序 | 无 | 无 |
| 故事阅读视图 | grid | 来源类型升序 | 来源类型 | 录入状态=完整 |
| 设计参考视图 | grid | 难度综合降序 | 诡计类型 | 录入状态=完整 |
| 悬案专区 | grid | 年代升序 | 地区 | 案件状态=悬案 |
| 按难度排序 | grid | 难度综合降序 | 无 | 录入状态=完整 |
| 录入进度看板 | kanban | 录入日期降序 | 录入状态 | 无 |

**注意：**
- 视图的可见字段、排序、分组、筛选配置可能需要通过 `+view-update` 或专门的命令设置
- 看板视图（kanban）的分组字段设置需确认 API 支持
- 如果 API 不支持完整视图配置，降级方案：创建空视图，字段排序筛选在 UI 中手动配置（S1 手册中有详细参数，照着配即可）

---

### 步骤 10：创建子表视图

| 视图名 | 排序 | 分组 |
|---|---|---|
| 全部线索 | 关联案件升序 → 出现时机升序 | 关联案件 |
| 按线索类型 | 关联案件升序 | 线索类型 |

---

### 步骤 11：配置筛选器预设

筛选器预设可能只能在 UI 中配置，API 支持度待确认。

**需要的6个筛选器：**
| 筛选器名 | 条件 |
|---|---|
| 密室类 | 诡计类型 包含 密室 |
| 不在场证明 | 诡计类型 包含 不在场证明 |
| 真实案件 | 来源类型 = 真实案件 |
| 推理小说 | 来源类型 = 推理小说 |
| 高难度（≥4分） | 难度综合 ≥ 4 |
| 待完成 | 录入状态 ≠ 完整 |

**降级方案：** API 不支持则在 UI 中手动配置。

---

## 四、待确认的技术细节（执行时验证）

| 问题 | 影响 | 降级方案 |
|---|---|---|
| 长文本字段的 type 是 `text` 还是其他？ | 故事字段可能被创建为单行文本 | 先创建1个测试，确认后批量创建 |
| 自动编号字段的 type 名称？ | 线索编号无法自动生成 | 先创建文本字段，后续 UI 改类型 |
| 日期字段的自动填充属性 API 是否支持？ | 录入日期/最后更新不会自动填 | 创建字段后在 UI 设置自动属性 |
| 关联字段的 JSON 格式和双向关联参数？ | 双向关联可能需要手动建两个字段 | 分别在两表创建关联字段 |
| 公式字段的 JSON 格式和引用语法？ | 难度综合公式可能创建失败 | 先创建数字字段，UI 中设公式 |
| 视图创建 API 是否支持排序/分组/筛选配置？ | 视图可能只有空壳 | 创建空视图后 UI 配置 |
| 看板视图 API 是否支持？ | 录入进度看板可能无法创建 | 先用表格视图替代，UI 中改建看板 |

---

## 五、执行原则

1. **每步执行后检查返回值**：`ok: true` 才继续，失败则停下来分析
2. **关键 ID 即时记录**：base_token、table_id、field_id 记录在本文件或单独的 ID 清单
3. **不确定的先 dry-run**：`--dry-run` 预览请求，确认格式无误再实际执行
4. **批量创建优先数组**：同表多字段用一个 JSON 数组批量创建，减少调用次数
5. **失败不硬闯**：任何步骤失败，停下来报告错误和降级方案，等确认后再继续
6. **不删除任何东西**：执行过程中如果字段创建错误，先保留，最后统一清理或告知用户

---

## 六、验收标准（全部通过才算 S1 完成）

- [ ] Base 「全球案件案例库」创建在 fun_detective 文件夹下
- [ ] 主表「案件库」存在，27个字段全部创建（含公式和关联）
- [ ] 子表「线索链」存在，7个字段全部创建
- [ ] 两表双向关联正常（主表「关联线索」↔ 子表「关联案件」）
- [ ] 「难度综合」公式可正常计算（新建测试记录验证）
- [ ] 6个主表视图创建（表格+看板），可见字段配置正确
- [ ] 2个子表视图创建
- [ ] 6个筛选器预设配置完成
- [ ] 「录入状态」默认值为「待录入」
- [ ] 新建一条测试记录，填写三项难度分，验证公式和关联正常后删除测试记录

---

## 七、执行后交付物

1. Base 访问链接（创建后返回的 URL）
2. 关键 ID 清单（base_token、各 table_id）
3. 验收结果报告（哪些通过、哪些用了降级方案、哪些需要用户在 UI 中手动补充）

---

*确认以上所有内容无误后，回复「确认执行」，我按步骤1开始执行。*
