# Fun Detective 阶段1：数据管道搭建 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建飞书 Base → GitHub 仓库的自动化数据管道，完成仓库初始化、JSON Schema 定义、同步脚本开发、GitHub Actions 配置，并完成首次同步验证。

**Architecture:** 飞书 Base 作为唯一录入入口，Python 同步脚本通过飞书开放 API 读取数据，转换为标准化 JSON，校验后提交到 GitHub 仓库。GitHub Actions 每日定时自动同步。

**Tech Stack:** Python 3.10+, lark-cli（飞书命令行工具）, Git, GitHub Actions, JSON Schema

**Spec:** `docs/superpowers/specs/2026-08-28-fun-detective-architecture-design.md`

**已完成前置工作:**
- 飞书 Base 已搭建完成（BASE_TOKEN: `NlZabSCWaa4NXbsUf1Wc6inQnjf`）
- 主表「案件库」: `tbl02kunLvM8fGow`（27字段）
- 子表「线索链」: `tblqyVU3YzPiw5IS`（7字段）
- GitHub 仓库已创建: https://github.com/WatersLin-Ann/fun_detective

## Global Constraints

- 飞书 Base 是唯一录入入口，Git 是只读数据镜像，同步方向永远是 Base → Git
- 每个案件一个 JSON 文件，按 `来源类型/地区/案件名称.json` 路径存储
- JSON 字段名与飞书 Base 字段名完全一致（中文）
- 难度评分为 1-5 分，综合分 = ROUND((线索密度+误导数量+诡计隐蔽度)/3, 1)
- 删除记录不直接删除文件，移入 `archive/` 目录
- 所有脚本必须有错误处理和日志输出
- Git 提交信息格式：`sync: 自动同步 YYYY-MM-DD HH:mm（新增X，更新Y）`

---

## 文件结构映射

```
fun_detective/
├── .github/
│   └── workflows/
│       └── daily-sync.yml          # GitHub Actions 每日同步配置
├── cases/                          # 案件 JSON 数据（同步脚本生成）
│   ├── 虚构推理/
│   ├── 真实案件/
│   ├── 游戏案例/
│   └── 影视综艺/
├── archive/                        # 已删除案件归档
├── schema/
│   └── case.schema.json            # 案件 JSON Schema 定义
├── exports/                        # 全量导出（同步脚本生成）
│   ├── all_cases.json
│   └── all_cases.csv
├── scripts/
│   ├── __init__.py
│   ├── config.py                   # 配置管理（环境变量、常量）
│   ├── lark_client.py              # 飞书 API 客户端
│   ├── data_transformer.py         # 飞书数据 → JSON 转换
│   ├── data_validator.py           # 数据校验
│   ├── git_operations.py           # Git 操作封装
│   ├── sync_from_lark.py           # 主同步程序
│   └── build_exports.py            # 全量导出生成
├── reports/                        # 同步报告（同步脚本生成）
├── errors/                         # 错误日志（同步脚本生成）
├── tests/
│   ├── __init__.py
│   ├── test_data_transformer.py
│   ├── test_data_validator.py
│   └── test_git_operations.py
├── docs/
│   └── superpowers/
│       ├── specs/
│       └── plans/
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Task 1: 飞书 Base 新增7个游戏专用字段

**Files:**
- 操作对象：飞书 Base 主表 `tbl02kunLvM8fGow`
- 临时文件：`E:\Work\AIProjects\fun_detective\new_game_fields.json`（执行后删除）

**Interfaces:**
- Consumes: 飞书 Base 现有结构（BASE_TOKEN, TABLE_ID）
- Produces: 主表新增7个字段，字段名与 spec 第6.1节一致

**背景：** 当前主表有27个字段，需要新增7个游戏专用字段，使主表达到34个字段。这些字段对非游戏案例可为空。

- [ ] **Step 1: 创建字段定义 JSON 文件**

在 `E:\Work\AIProjects\fun_detective\new_game_fields.json` 写入以下内容：

```json
[
  {"name": "游戏平台", "type": "select", "multiple": true, "options": [
    {"name": "PC"}, {"name": "PlayStation"}, {"name": "Xbox"},
    {"name": "Switch"}, {"name": "手机"}, {"name": "VR"}, {"name": "其他"}
  ]},
  {"name": "玩法类型", "type": "select", "multiple": true, "options": [
    {"name": "文字冒险"}, {"name": "推理解谜"}, {"name": "动作推理"},
    {"name": "开放世界推理"}, {"name": "桌游改编"}, {"name": "互动电影"}, {"name": "其他"}
  ]},
  {"name": "核心玩法机制", "type": "select", "multiple": true, "options": [
    {"name": "证据收集"}, {"name": "矛盾指证"}, {"name": "时间回溯"},
    {"name": "多视角切换"}, {"name": "心理量表"}, {"name": "环境探查"},
    {"name": "对话选择"}, {"name": "线索拼接"}, {"name": "其他"}
  ]},
  {"name": "关卡结构", "type": "text"},
  {"name": "玩家引导方式", "type": "text"},
  {"name": "推理系统设计", "type": "text"},
  {"name": "可复用游戏模板", "type": "select", "multiple": true, "options": [
    {"name": "线索板"}, {"name": "推理拼图"}, {"name": "对话分支"},
    {"name": "时间线重构"}, {"name": "嫌疑人档案"}, {"name": "法庭对决"},
    {"name": "搜查推理"}, {"name": "其他"}
  ]}
]
```

- [ ] **Step 2: 执行字段创建命令**

运行：
```powershell
Set-Location "E:\Work\AIProjects\fun_detective"
lark-cli base +field-create --base-token "NlZabSCWaa4NXbsUf1Wc6inQnjf" --table-id "tbl02kunLvM8fGow" --json "@./new_game_fields.json" --as user
```

预期输出：`"ok": true`，返回7个新建字段的 id 和 name。

- [ ] **Step 3: 验证字段创建成功**

运行：
```powershell
lark-cli base +field-list --base-token "NlZabSCWaa4NXbsUf1Wc6inQnjf" --table-id "tbl02kunLvM8fGow" --as user --jq '.data.fields | length'
```

预期输出：`34`（原27 + 新增7）

再运行验证字段名：
```powershell
lark-cli base +field-list --base-token "NlZabSCWaa4NXbsUf1Wc6inQnjf" --table-id "tbl02kunLvM8fGow" --as user --jq '.data.fields[].name' | Select-String "游戏平台|玩法类型|核心玩法机制|关卡结构|玩家引导方式|推理系统设计|可复用游戏模板"
```

预期输出：7个字段名全部出现。

- [ ] **Step 4: 清理临时文件**

```powershell
Remove-Item "E:\Work\AIProjects\fun_detective\new_game_fields.json" -Force
```

- [ ] **Step 5: 记录完成**

在项目笔记中记录：主表字段已扩展至34个，游戏专用字段已就绪。

---

## Task 2: GitHub 仓库初始化

**Files:**
- Create: `.gitignore`, `README.md`, `requirements.txt`
- Create: 目录结构（cases/, archive/, schema/, exports/, scripts/, reports/, errors/, tests/, .github/workflows/）
- Modify: Git 仓库配置

**Interfaces:**
- Consumes: GitHub 仓库地址 `https://github.com/WatersLin-Ann/fun_detective.git`
- Produces: 初始化完成的本地 Git 仓库，可推送到远程

**前置条件：** Git 已安装，GitHub 账号已配置 SSH 或 HTTPS 凭证。

- [ ] **Step 1: 进入项目目录并初始化 Git**

```powershell
Set-Location "E:\Work\AIProjects\fun_detective"
git init
git branch -M main
```

- [ ] **Step 2: 创建目录结构**

```powershell
$dirs = @("cases\虚构推理\日本","cases\虚构推理\欧美","cases\虚构推理\中国",
          "cases\真实案件\日本","cases\真实案件\欧美","cases\真实案件\中国",
          "cases\游戏案例\日本","cases\游戏案例\欧美","cases\游戏案例\中国",
          "cases\影视综艺\日本","cases\影视综艺\欧美","cases\影视综艺\中国",
          "archive","schema","exports","scripts","reports","errors",
          "tests","docs\superpowers\specs","docs\superpowers\plans",
          ".github\workflows")
foreach ($d in $dirs) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
```

- [ ] **Step 3: 在每个 cases 子目录创建 .gitkeep（保留空目录）**

```powershell
Get-ChildItem -Path "cases" -Recurse -Directory | ForEach-Object {
    New-Item -ItemType File -Path (Join-Path $_.FullName ".gitkeep") -Force | Out-Null
}
```

- [ ] **Step 4: 创建 .gitignore**

在 `E:\Work\AIProjects\fun_detective\.gitignore` 写入：

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv/

# 环境变量
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# 临时文件
*.tmp
*.bak
*.log
!errors/*.log
!reports/*.md

# lark-cli 临时配置
.lark-cli/
```

- [ ] **Step 5: 创建 requirements.txt**

在 `E:\Work\AIProjects\fun_detective\requirements.txt` 写入：

```
requests>=2.31.0
jsonschema>=4.19.0
python-dateutil>=2.8.2
GitPython>=3.1.40
pytest>=7.4.0
pytest-cov>=4.1.0
```

- [ ] **Step 6: 创建 README.md**

在 `E:\Work\AIProjects\fun_detective\README.md` 写入：

```markdown
# Fun Detective 全球案件案例库

网罗全球虚拟与真实案件的结构化案例库，服务于推理小说创作和游戏设计。

## 项目架构

- **飞书 Base**：唯一录入入口（案件库 + 线索链）
- **GitHub 仓库**：数据资产（标准化 JSON）
- **同步脚本**：飞书 → Git 自动化同步
- **前端网站**：阶段2启动（Astro 静态站）

## 目录结构

\`\`\`
cases/          # 案件 JSON（按来源类型/地区分目录）
archive/        # 已删除案件归档
schema/         # JSON Schema 定义
exports/        # 全量导出（JSON/CSV）
scripts/        # 同步与校验脚本
reports/        # 同步报告
errors/         # 校验错误日志
tests/          # 测试
docs/           # 项目文档
\`\`\`

## 数据格式

每个案件一个 JSON 文件，包含基本信息、故事视图、设计视图、游戏设计、元数据五个部分。详见 `schema/case.schema.json`。

## 同步方式

\`\`\`bash
# 手动同步
python scripts/sync_from_lark.py

# 自动同步
# GitHub Actions 每日凌晨 03:00 自动执行
\`\`\`

## 环境变量

\`\`\`
LARK_APP_ID=your_app_id
LARK_APP_SECRET=your_app_secret
LARK_BASE_TOKEN=NlZabSCWaa4NXbsUf1Wc6inQnjf
LARK_MAIN_TABLE_ID=tbl02kunLvM8fGow
LARK_SUB_TABLE_ID=tblqyVU3YzPiw5IS
GIT_REPO_PATH=E:/Work/AIProjects/fun_detective
\`\`\`

## 阶段路线

- [ ] 阶段1：数据管道搭建（当前）
- [ ] 阶段2：Astro 网站上线
- [ ] 阶段3：创作工具开发
- [ ] 阶段4：社区与 API 开放
```

- [ ] **Step 7: 创建 scripts/__init__.py 和 tests/__init__.py**

```powershell
New-Item -ItemType File -Path "scripts\__init__.py" -Force | Out-Null
New-Item -ItemType File -Path "tests\__init__.py" -Force | Out-Null
```

- [ ] **Step 8: 初始提交**

```powershell
git add .
git commit -m "chore: 初始化仓库结构、配置文件和文档"
```

- [ ] **Step 9: 关联远程仓库并推送**

```powershell
git remote add origin https://github.com/WatersLin-Ann/fun_detective.git
git push -u origin main
```

预期：推送成功，GitHub 仓库页面可见初始化文件。

---

## Task 3: JSON Schema 定义

**Files:**
- Create: `schema/case.schema.json`

**Interfaces:**
- Consumes: spec 第3.2节的 JSON 结构定义
- Produces: 可被 `jsonschema` 库校验的标准 JSON Schema 文件

- [ ] **Step 1: 创建 case.schema.json**

在 `E:\Work\AIProjects\fun_detective\schema\case.schema.json` 写入：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Fun Detective Case",
  "description": "案件数据结构定义",
  "type": "object",
  "required": ["id", "基本信息", "故事视图", "设计视图", "元数据"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^case-\\d{3}$"
    },
    "基本信息": {
      "type": "object",
      "required": ["案件名称", "来源类型", "地区", "一句话简介"],
      "properties": {
        "案件名称": {"type": "string", "minLength": 1},
        "来源类型": {"type": "string", "enum": ["虚构推理", "真实案件", "游戏案例", "影视综艺"]},
        "来源作品/事件": {"type": "string"},
        "作者/创作者": {"type": "string"},
        "地区": {"type": "string", "enum": ["日本", "欧美", "中国", "其他"]},
        "年代": {"type": "string"},
        "案件状态": {"type": "string", "enum": ["已破案", "悬案", "部分破解"]},
        "一句话简介": {"type": "string", "minLength": 1, "maxLength": 200}
      }
    },
    "故事视图": {
      "type": "object",
      "properties": {
        "故事摘要": {"type": "string"},
        "完整故事": {"type": "string"},
        "人物关系": {"type": "string"},
        "关键时间线": {"type": "string"},
        "结局/真相": {"type": "string"}
      }
    },
    "设计视图": {
      "type": "object",
      "properties": {
        "核心诡计简述": {"type": "string"},
        "诡计类型": {
          "type": "array",
          "items": {"type": "string", "enum": ["密室", "不在场证明", "叙述性诡计", "身份诡计", "心理操控", "时刻表", "物理机关", "毒杀", "其他"]}
        },
        "可复用机制": {
          "type": "array",
          "items": {"type": "string", "enum": ["封闭空间", "限时破案", "多视角叙事", "连环案件", "叙述者不可靠", "死亡信息", "其他"]}
        },
        "信息差分析": {"type": "string"},
        "红鲱鱼/误导": {"type": "string"},
        "难度评分": {
          "type": "object",
          "properties": {
            "线索密度": {"type": "number", "minimum": 1, "maximum": 5},
            "误导数量": {"type": "number", "minimum": 1, "maximum": 5},
            "诡计隐蔽度": {"type": "number", "minimum": 1, "maximum": 5},
            "综合": {"type": "number", "minimum": 1, "maximum": 5}
          }
        },
        "线索链": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "线索编号": {"type": "string"},
              "线索内容": {"type": "string"},
              "线索类型": {"type": "string", "enum": ["关键线索", "误导线索", "背景信息"]},
              "指向结论": {"type": "string"},
              "出现时机": {"type": "string", "enum": ["开篇", "前期", "中期", "后期", "终局"]}
            }
          }
        }
      }
    },
    "游戏设计": {
      "type": "object",
      "properties": {
        "游戏平台": {"type": "array", "items": {"type": "string"}},
        "玩法类型": {"type": "array", "items": {"type": "string"}},
        "核心玩法机制": {"type": "array", "items": {"type": "string"}},
        "关卡结构": {"type": "string"},
        "玩家引导方式": {"type": "string"},
        "推理系统设计": {"type": "string"},
        "可复用游戏模板": {"type": "array", "items": {"type": "string"}}
      }
    },
    "元数据": {
      "type": "object",
      "required": ["录入状态", "录入日期", "最后更新"],
      "properties": {
        "录入状态": {"type": "string", "enum": ["待录入", "故事完成", "设计完成", "完整"]},
        "录入日期": {"type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$"},
        "最后更新": {"type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$"},
        "飞书记录ID": {"type": "string"},
        "版本": {"type": "integer", "minimum": 1}
      }
    }
  }
}
```

- [ ] **Step 2: 验证 Schema 格式合法性**

创建临时验证脚本 `tests\test_schema_valid.py`：

```python
import json
import jsonschema

def test_case_schema_is_valid():
    with open("schema/case.schema.json", "r", encoding="utf-8") as f:
        schema = json.load(f)
    # jsonschema.Draft7Validator.check_schema 会抛出异常如果 schema 不合法
    jsonschema.Draft7Validator.check_schema(schema)
    assert schema["title"] == "Fun Detective Case"
```

运行：
```powershell
python -m pytest tests/test_schema_valid.py -v
```

预期：PASS。

- [ ] **Step 3: 用示例数据验证 Schema**

创建 `tests\test_sample_case.py`：

```python
import json
import jsonschema

def test_sample_case_passes_schema():
    with open("schema/case.schema.json", "r", encoding="utf-8") as f:
        schema = json.load(f)

    sample = {
        "id": "case-001",
        "基本信息": {
            "案件名称": "测试案件",
            "来源类型": "虚构推理",
            "来源作品/事件": "测试作品",
            "作者/创作者": "测试作者",
            "地区": "日本",
            "年代": "2020s",
            "案件状态": "已破案",
            "一句话简介": "这是一个测试案件"
        },
        "故事视图": {
            "故事摘要": "摘要",
            "完整故事": "完整故事",
            "人物关系": "人物关系",
            "关键时间线": "时间线",
            "结局/真相": "真相"
        },
        "设计视图": {
            "核心诡计简述": "诡计",
            "诡计类型": ["密室"],
            "可复用机制": ["封闭空间"],
            "信息差分析": "分析",
            "红鲱鱼/误导": "误导",
            "难度评分": {
                "线索密度": 3.0,
                "误导数量": 2.0,
                "诡计隐蔽度": 4.0,
                "综合": 3.0
            },
            "线索链": [
                {
                    "线索编号": "NO.001",
                    "线索内容": "线索内容",
                    "线索类型": "关键线索",
                    "指向结论": "结论",
                    "出现时机": "前期"
                }
            ]
        },
        "游戏设计": {
            "游戏平台": [],
            "玩法类型": [],
            "核心玩法机制": [],
            "关卡结构": "",
            "玩家引导方式": "",
            "推理系统设计": "",
            "可复用游戏模板": []
        },
        "元数据": {
            "录入状态": "完整",
            "录入日期": "2026-08-28",
            "最后更新": "2026-08-28",
            "飞书记录ID": "recTEST001",
            "版本": 1
        }
    }

    jsonschema.validate(instance=sample, schema=schema)
```

运行：
```powershell
python -m pytest tests/test_sample_case.py -v
```

预期：PASS。

- [ ] **Step 4: 提交 Schema 文件**

```powershell
git add schema/case.schema.json tests/test_schema_valid.py tests/test_sample_case.py
git commit -m "feat: 添加案件 JSON Schema 定义和验证测试"
git push
```

---

## Task 4: 同步脚本开发

本任务分为5个子任务，按依赖顺序执行。

### Task 4.1: 配置管理模块

**Files:**
- Create: `scripts/config.py`
- Create: `.env.example`

**Interfaces:**
- Produces: `get_config()` 函数，返回包含所有配置项的字典

- [ ] **Step 1: 创建 .env.example**

在 `E:\Work\AIProjects\fun_detective\.env.example` 写入：

```
# 飞书应用凭证（从飞书开放平台获取）
LARK_APP_ID=cli_xxxxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# 飞书 Base 配置
LARK_BASE_TOKEN=NlZabSCWaa4NXbsUf1Wc6inQnjf
LARK_MAIN_TABLE_ID=tbl02kunLvM8fGow
LARK_SUB_TABLE_ID=tblqyVU3YzPiw5IS

# Git 仓库本地路径
GIT_REPO_PATH=E:/Work/AIProjects/fun_detective

# 同步配置
SYNC_MODE=incremental  # incremental 或 full
LOG_LEVEL=INFO
```

- [ ] **Step 2: 创建 scripts/config.py**

```python
"""配置管理模块：从环境变量和 .env 文件读取配置。"""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv 未安装时跳过，依赖系统环境变量


def get_config() -> dict:
    """获取所有配置项，返回字典。"""
    repo_path = os.getenv("GIT_REPO_PATH", str(Path(__file__).parent.parent))

    return {
        # 飞书凭证
        "lark_app_id": os.getenv("LARK_APP_ID", ""),
        "lark_app_secret": os.getenv("LARK_APP_SECRET", ""),

        # 飞书 Base
        "lark_base_token": os.getenv("LARK_BASE_TOKEN", "NlZabSCWaa4NXbsUf1Wc6inQnjf"),
        "lark_main_table_id": os.getenv("LARK_MAIN_TABLE_ID", "tbl02kunLvM8fGow"),
        "lark_sub_table_id": os.getenv("LARK_SUB_TABLE_ID", "tblqyVU3YzPiw5IS"),

        # Git
        "git_repo_path": repo_path,
        "git_remote": os.getenv("GIT_REMOTE", "origin"),
        "git_branch": os.getenv("GIT_BRANCH", "main"),

        # 同步
        "sync_mode": os.getenv("SYNC_MODE", "incremental"),
        "log_level": os.getenv("LOG_LEVEL", "INFO"),

        # 目录
        "cases_dir": os.path.join(repo_path, "cases"),
        "archive_dir": os.path.join(repo_path, "archive"),
        "schema_dir": os.path.join(repo_path, "schema"),
        "exports_dir": os.path.join(repo_path, "exports"),
        "reports_dir": os.path.join(repo_path, "reports"),
        "errors_dir": os.path.join(repo_path, "errors"),
    }


def validate_config(config: dict) -> list:
    """校验配置完整性，返回错误信息列表（空列表表示通过）。"""
    errors = []
    if not config["lark_app_id"]:
        errors.append("LARK_APP_ID 未设置")
    if not config["lark_app_secret"]:
        errors.append("LARK_APP_SECRET 未设置")
    if not config["lark_base_token"]:
        errors.append("LARK_BASE_TOKEN 未设置")
    if not config["lark_main_table_id"]:
        errors.append("LARK_MAIN_TABLE_ID 未设置")
    if not os.path.isdir(config["git_repo_path"]):
        errors.append(f"GIT_REPO_PATH 不存在: {config['git_repo_path']}")
    return errors
```

- [ ] **Step 3: 添加 python-dotenv 到 requirements.txt**

在 `requirements.txt` 末尾追加：
```
python-dotenv>=1.0.0
```

- [ ] **Step 4: 提交**

```powershell
git add scripts/config.py .env.example requirements.txt
git commit -m "feat: 添加配置管理模块"
git push
```

---

### Task 4.2: 飞书 API 客户端模块

**Files:**
- Create: `scripts/lark_client.py`
- Test: `tests/test_lark_client.py`

**Interfaces:**
- Consumes: `config.py` 的配置
- Produces: `LarkClient` 类，提供 `get_all_records(table_id)` 方法

- [ ] **Step 1: 创建 scripts/lark_client.py**

```python
"""飞书 API 客户端：通过飞书开放 API 读取 Base 记录。"""
import time
import requests
from typing import List, Dict, Optional


class LarkClient:
    """飞书多维表格 API 客户端。"""

    BASE_URL = "https://open.feishu.cn/open-apis"

    def __init__(self, app_id: str, app_secret: str):
        self.app_id = app_id
        self.app_secret = app_secret
        self._tenant_access_token: Optional[str] = None
        self._token_expire_time: float = 0

    def _get_tenant_access_token(self) -> str:
        """获取 tenant_access_token，带缓存。"""
        if self._tenant_access_token and time.time() < self._token_expire_time:
            return self._tenant_access_token

        url = f"{self.BASE_URL}/auth/v3/tenant_access_token/internal"
        payload = {
            "app_id": self.app_id,
            "app_secret": self.app_secret,
        }
        resp = requests.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if data.get("code") != 0:
            raise RuntimeError(f"获取 tenant_access_token 失败: {data.get('msg')}")

        self._tenant_access_token = data["tenant_access_token"]
        self._token_expire_time = time.time() + data.get("expire", 7200) - 60
        return self._tenant_access_token

    def _get_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._get_tenant_access_token()}",
            "Content-Type": "application/json",
        }

    def get_all_records(self, base_token: str, table_id: str,
                        page_size: int = 100, max_retries: int = 3) -> List[Dict]:
        """
        读取指定数据表的全部记录，自动处理分页。

        Args:
            base_token: 多维表格的 app_token
            table_id: 数据表 ID
            page_size: 每页记录数（最大500）
            max_retries: 失败最大重试次数

        Returns:
            记录列表，每条记录包含 record_id 和 fields
        """
        all_records = []
        page_token = None
        retry_count = 0

        while True:
            url = f"{self.BASE_URL}/bitable/v1/apps/{base_token}/tables/{table_id}/records"
            params = {"page_size": page_size}
            if page_token:
                params["page_token"] = page_token

            try:
                resp = requests.get(url, headers=self._get_headers(),
                                    params=params, timeout=30)
                resp.raise_for_status()
                data = resp.json()

                if data.get("code") != 0:
                    raise RuntimeError(f"读取记录失败: {data.get('msg')}")

                items = data.get("data", {}).get("items", [])
                all_records.extend(items)

                has_more = data.get("data", {}).get("has_more", False)
                page_token = data.get("data", {}).get("page_token")

                if not has_more or not page_token:
                    break
                retry_count = 0  # 重置重试计数

            except Exception as e:
                retry_count += 1
                if retry_count >= max_retries:
                    raise RuntimeError(f"读取记录失败（重试{max_retries}次后）: {e}")
                time.sleep(10 * retry_count)  # 退避重试

        return all_records

    def get_record(self, base_token: str, table_id: str,
                   record_id: str) -> Optional[Dict]:
        """读取单条记录。"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{base_token}/tables/{table_id}/records/{record_id}"
        resp = requests.get(url, headers=self._get_headers(), timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if data.get("code") != 0:
            return None
        return data.get("data", {}).get("record")
```

- [ ] **Step 2: 创建测试 tests/test_lark_client.py**

```python
"""飞书客户端单元测试（使用 mock，不调用真实 API）。"""
import pytest
from unittest.mock import patch, MagicMock
from scripts.lark_client import LarkClient


@pytest.fixture
def client():
    return LarkClient("test_app_id", "test_app_secret")


def test_get_tenant_access_token_success(client):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "code": 0,
        "tenant_access_token": "test_token_123",
        "expire": 7200
    }
    mock_response.raise_for_status = MagicMock()

    with patch("scripts.lark_client.requests.post", return_value=mock_response):
        token = client._get_tenant_access_token()
        assert token == "test_token_123"


def test_get_tenant_access_token_failure(client):
    mock_response = MagicMock()
    mock_response.json.return_value = {"code": 9999, "msg": "invalid app"}
    mock_response.raise_for_status = MagicMock()

    with patch("scripts.lark_client.requests.post", return_value=mock_response):
        with pytest.raises(RuntimeError, match="获取 tenant_access_token 失败"):
            client._get_tenant_access_token()


def test_get_all_records_pagination(client):
    """测试分页读取：模拟两页数据。"""
    client._tenant_access_token = "fake_token"
    client._token_expire_time = 9999999999

    # 第一页
    page1 = MagicMock()
    page1.json.return_value = {
        "code": 0,
        "data": {
            "items": [{"record_id": "rec1", "fields": {"name": "A"}}],
            "has_more": True,
            "page_token": "token_next"
        }
    }
    page1.raise_for_status = MagicMock()

    # 第二页
    page2 = MagicMock()
    page2.json.return_value = {
        "code": 0,
        "data": {
            "items": [{"record_id": "rec2", "fields": {"name": "B"}}],
            "has_more": False,
            "page_token": None
        }
    }
    page2.raise_for_status = MagicMock()

    with patch("scripts.lark_client.requests.get", side_effect=[page1, page2]):
        records = client.get_all_records("base_token", "table_id")
        assert len(records) == 2
        assert records[0]["record_id"] == "rec1"
        assert records[1]["record_id"] == "rec2"
```

- [ ] **Step 3: 运行测试**

```powershell
python -m pytest tests/test_lark_client.py -v
```

预期：3个测试全部 PASS。

- [ ] **Step 4: 提交**

```powershell
git add scripts/lark_client.py tests/test_lark_client.py
git commit -m "feat: 添加飞书 API 客户端模块"
git push
```

---

### Task 4.3: 数据转换模块

**Files:**
- Create: `scripts/data_transformer.py`
- Test: `tests/test_data_transformer.py`

**Interfaces:**
- Consumes: 飞书 API 返回的原始记录格式
- Produces: `transform_case_record(record, clues)` 函数，返回标准化 JSON dict；`get_file_path(case_data)` 函数，返回文件相对路径

- [ ] **Step 1: 创建 scripts/data_transformer.py**

```python
"""数据转换模块：将飞书记录转换为标准化 JSON 格式。"""
import re
from typing import Dict, List, Optional
from datetime import datetime


# 飞书多选字段的 value 提取
def _extract_select_value(field_value) -> Optional[str]:
    """提取单选字段的值。"""
    if field_value is None:
        return None
    if isinstance(field_value, str):
        return field_value
    if isinstance(field_value, list) and len(field_value) > 0:
        return field_value[0].get("text", "") if isinstance(field_value[0], dict) else str(field_value[0])
    return str(field_value)


def _extract_multi_select_values(field_value) -> List[str]:
    """提取多选字段的值列表。"""
    if field_value is None:
        return []
    if isinstance(field_value, list):
        result = []
        for item in field_value:
            if isinstance(item, dict):
                result.append(item.get("text", ""))
            else:
                result.append(str(item))
        return [v for v in result if v]
    if isinstance(field_value, str):
        return [field_value] if field_value else []
    return []


def _extract_text(field_value) -> str:
    """提取文本字段（飞书富文本可能是列表）。"""
    if field_value is None:
        return ""
    if isinstance(field_value, str):
        return field_value
    if isinstance(field_value, list):
        parts = []
        for item in field_value:
            if isinstance(item, dict):
                parts.append(item.get("text", ""))
            else:
                parts.append(str(item))
        return "".join(parts)
    return str(field_value)


def _extract_number(field_value) -> Optional[float]:
    """提取数字字段。"""
    if field_value is None:
        return None
    if isinstance(field_value, (int, float)):
        return float(field_value)
    try:
        return float(field_value)
    except (ValueError, TypeError):
        return None


def _extract_date(field_value) -> Optional[str]:
    """提取日期字段，转为 YYYY-MM-DD 格式。"""
    if field_value is None:
        return None
    if isinstance(field_value, (int, float)):
        # 飞书日期是毫秒时间戳
        dt = datetime.fromtimestamp(field_value / 1000)
        return dt.strftime("%Y-%m-%d")
    if isinstance(field_value, str):
        # 尝试解析常见格式
        for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S"]:
            try:
                return datetime.strptime(field_value[:10], "%Y-%m-%d").strftime("%Y-%m-%d")
            except ValueError:
                continue
    return None


def _sanitize_filename(name: str) -> str:
    """清理文件名中的非法字符。"""
    # 移除 Windows 文件名非法字符
    sanitized = re.sub(r'[<>:"/\\|?*]', '', name)
    # 移除首尾空格和点
    sanitized = sanitized.strip(' .')
    return sanitized if sanitized else "未命名"


def transform_clue_record(record: Dict) -> Dict:
    """
    将飞书线索记录转换为标准化线索格式。

    Args:
        record: 飞书 API 返回的单条线索记录

    Returns:
        标准化线索 dict
    """
    fields = record.get("fields", {})
    return {
        "线索编号": _extract_text(fields.get("线索编号")),
        "线索内容": _extract_text(fields.get("线索内容")),
        "线索类型": _extract_select_value(fields.get("线索类型")),
        "指向结论": _extract_text(fields.get("指向结论")),
        "出现时机": _extract_select_value(fields.get("出现时机")),
    }


def transform_case_record(record: Dict, clues: List[Dict] = None,
                          case_number: int = 1) -> Dict:
    """
    将飞书案件记录转换为标准化 JSON 格式。

    Args:
        record: 飞书 API 返回的单条案件记录
        clues: 关联的线索列表（已转换为标准格式）
        case_number: 案件序号，用于生成 case-XXX ID

    Returns:
        标准化案件 dict
    """
    fields = record.get("fields", {})
    record_id = record.get("record_id", "")

    # 提取难度评分
    clue_density = _extract_number(fields.get("难度-线索密度"))
    mislead_count = _extract_number(fields.get("难度-误导数量"))
    trick_hidden = _extract_number(fields.get("难度-诡计隐蔽度"))

    difficulty = {}
    if clue_density is not None:
        difficulty["线索密度"] = clue_density
    if mislead_count is not None:
        difficulty["误导数量"] = mislead_count
    if trick_hidden is not None:
        difficulty["诡计隐蔽度"] = trick_hidden

    # 计算综合分
    scores = [v for v in [clue_density, mislead_count, trick_hidden] if v is not None]
    if scores:
        difficulty["综合"] = round(sum(scores) / len(scores), 1)

    return {
        "id": f"case-{case_number:03d}",
        "基本信息": {
            "案件名称": _extract_text(fields.get("案件名称")),
            "来源类型": _extract_select_value(fields.get("来源类型")),
            "来源作品/事件": _extract_text(fields.get("来源作品/事件")),
            "作者/创作者": _extract_text(fields.get("作者/创作者")),
            "地区": _extract_select_value(fields.get("地区")),
            "年代": _extract_text(fields.get("年代")),
            "案件状态": _extract_select_value(fields.get("案件状态")),
            "一句话简介": _extract_text(fields.get("一句话简介")),
        },
        "故事视图": {
            "故事摘要": _extract_text(fields.get("故事摘要")),
            "完整故事": _extract_text(fields.get("完整故事")),
            "人物关系": _extract_text(fields.get("人物关系")),
            "关键时间线": _extract_text(fields.get("关键时间线")),
            "结局/真相": _extract_text(fields.get("结局/真相")),
        },
        "设计视图": {
            "核心诡计简述": _extract_text(fields.get("核心诡计简述")),
            "诡计类型": _extract_multi_select_values(fields.get("诡计类型")),
            "可复用机制": _extract_multi_select_values(fields.get("可复用机制")),
            "信息差分析": _extract_text(fields.get("信息差分析")),
            "红鲱鱼/误导": _extract_text(fields.get("红鲱鱼/误导")),
            "难度评分": difficulty,
            "线索链": clues or [],
        },
        "游戏设计": {
            "游戏平台": _extract_multi_select_values(fields.get("游戏平台")),
            "玩法类型": _extract_multi_select_values(fields.get("玩法类型")),
            "核心玩法机制": _extract_multi_select_values(fields.get("核心玩法机制")),
            "关卡结构": _extract_text(fields.get("关卡结构")),
            "玩家引导方式": _extract_text(fields.get("玩家引导方式")),
            "推理系统设计": _extract_text(fields.get("推理系统设计")),
            "可复用游戏模板": _extract_multi_select_values(fields.get("可复用游戏模板")),
        },
        "元数据": {
            "录入状态": _extract_select_value(fields.get("录入状态")) or "待录入",
            "录入日期": _extract_date(fields.get("录入日期")) or datetime.now().strftime("%Y-%m-%d"),
            "最后更新": _extract_date(fields.get("最后更新")) or datetime.now().strftime("%Y-%m-%d"),
            "飞书记录ID": record_id,
            "版本": 1,
        },
    }


def get_file_path(case_data: Dict) -> str:
    """
    根据案件数据生成相对文件路径。

    Returns:
        相对路径，如 "虚构推理/日本/嫌疑人X的献身.json"
    """
    source_type = case_data["基本信息"].get("来源类型", "未分类")
    region = case_data["基本信息"].get("地区", "未分类")
    name = _sanitize_filename(case_data["基本信息"].get("案件名称", "未命名"))
    return f"{source_type}/{region}/{name}.json"


def group_clues_by_case(clue_records: List[Dict]) -> Dict[str, List[Dict]]:
    """
    将线索记录按关联案件分组。

    Args:
        clue_records: 飞书线索记录列表

    Returns:
        {案件记录ID: [线索dict, ...]}
    """
    grouped = {}
    for record in clue_records:
        fields = record.get("fields", {})
        # 关联案件是 link 字段，值是记录 ID 列表
        linked_cases = fields.get("关联案件", [])
        if isinstance(linked_cases, list):
            for case_link in linked_cases:
                case_id = case_link if isinstance(case_link, str) else case_link.get("record_id", "")
                if case_id:
                    if case_id not in grouped:
                        grouped[case_id] = []
                    grouped[case_id].append(transform_clue_record(record))
    return grouped
```

- [ ] **Step 2: 创建测试 tests/test_data_transformer.py**

```python
"""数据转换模块测试。"""
import pytest
from scripts.data_transformer import (
    transform_case_record, transform_clue_record,
    get_file_path, group_clues_by_case, _sanitize_filename
)


def test_transform_case_record_basic():
    record = {
        "record_id": "recTEST001",
        "fields": {
            "案件名称": "测试案件",
            "来源类型": [{"text": "虚构推理"}],
            "地区": [{"text": "日本"}],
            "一句话简介": "测试简介",
            "难度-线索密度": 3.5,
            "难度-误导数量": 2.0,
            "难度-诡计隐蔽度": 4.0,
        }
    }
    result = transform_case_record(record, case_number=1)
    assert result["id"] == "case-001"
    assert result["基本信息"]["案件名称"] == "测试案件"
    assert result["基本信息"]["来源类型"] == "虚构推理"
    assert result["设计视图"]["难度评分"]["综合"] == 3.2
    assert result["元数据"]["飞书记录ID"] == "recTEST001"


def test_transform_case_record_with_clues():
    record = {"record_id": "rec001", "fields": {"案件名称": "A"}}
    clues = [{"线索编号": "NO.001", "线索内容": "线索1"}]
    result = transform_case_record(record, clues=clues, case_number=5)
    assert result["id"] == "case-005"
    assert len(result["设计视图"]["线索链"]) == 1
    assert result["设计视图"]["线索链"][0]["线索内容"] == "线索1"


def test_get_file_path():
    case_data = {
        "基本信息": {
            "来源类型": "虚构推理",
            "地区": "日本",
            "案件名称": "嫌疑人X的献身"
        }
    }
    path = get_file_path(case_data)
    assert path == "虚构推理/日本/嫌疑人X的献身.json"


def test_sanitize_filename():
    assert _sanitize_filename('test:file?name') == 'testfilename'
    assert _sanitize_filename('  normal  ') == 'normal'
    assert _sanitize_filename('') == '未命名'


def test_group_clues_by_case():
    clues = [
        {"record_id": "c1", "fields": {
            "线索内容": "线索1",
            "关联案件": ["recA"]
        }},
        {"record_id": "c2", "fields": {
            "线索内容": "线索2",
            "关联案件": ["recA", "recB"]
        }},
    ]
    grouped = group_clues_by_case(clues)
    assert len(grouped["recA"]) == 2
    assert len(grouped["recB"]) == 1
```

- [ ] **Step 3: 运行测试**

```powershell
python -m pytest tests/test_data_transformer.py -v
```

预期：5个测试全部 PASS。

- [ ] **Step 4: 提交**

```powershell
git add scripts/data_transformer.py tests/test_data_transformer.py
git commit -m "feat: 添加数据转换模块"
git push
```

---

### Task 4.4: 数据校验模块

**Files:**
- Create: `scripts/data_validator.py`
- Test: `tests/test_data_validator.py`

**Interfaces:**
- Consumes: `data_transformer.py` 输出的标准化案件 dict
- Produces: `validate_case(case_data, schema)` 函数，返回 (is_valid: bool, errors: list)

- [ ] **Step 1: 创建 scripts/data_validator.py**

```python
"""数据校验模块：校验案件数据是否符合 Schema 和业务规则。"""
import json
import os
from typing import Dict, List, Tuple
import jsonschema


def load_schema(schema_path: str) -> dict:
    """加载 JSON Schema 文件。"""
    with open(schema_path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_case(case_data: Dict, schema: dict = None) -> Tuple[bool, List[str]]:
    """
    校验案件数据。

    Args:
        case_data: 标准化案件 dict
        schema: JSON Schema 对象，为 None 时只做业务规则校验

    Returns:
        (is_valid, errors) 元组
    """
    errors = []

    # 1. Schema 校验
    if schema:
        try:
            jsonschema.validate(instance=case_data, schema=schema)
        except jsonschema.ValidationError as e:
            errors.append(f"Schema 校验失败: {e.message} (路径: {'.'.join(str(p) for p in e.path)})")

    # 2. 业务规则校验
    basic = case_data.get("基本信息", {})

    # 必填字段
    if not basic.get("案件名称"):
        errors.append("缺少必填字段：案件名称")
    if not basic.get("来源类型"):
        errors.append("缺少必填字段：来源类型")
    if not basic.get("地区"):
        errors.append("缺少必填字段：地区")
    if not basic.get("一句话简介"):
        errors.append("缺少必填字段：一句话简介")

    # 枚举值校验
    valid_source_types = ["虚构推理", "真实案件", "游戏案例", "影视综艺"]
    if basic.get("来源类型") and basic["来源类型"] not in valid_source_types:
        errors.append(f"来源类型值非法: {basic['来源类型']}，有效值: {valid_source_types}")

    valid_regions = ["日本", "欧美", "中国", "其他"]
    if basic.get("地区") and basic["地区"] not in valid_regions:
        errors.append(f"地区值非法: {basic['地区']}，有效值: {valid_regions}")

    # 难度评分范围
    difficulty = case_data.get("设计视图", {}).get("难度评分", {})
    for key in ["线索密度", "误导数量", "诡计隐蔽度", "综合"]:
        val = difficulty.get(key)
        if val is not None and (val < 1 or val > 5):
            errors.append(f"难度评分-{key} 超出范围(1-5): {val}")

    # 综合分校验
    scores = [difficulty.get(k) for k in ["线索密度", "误导数量", "诡计隐蔽度"] if difficulty.get(k) is not None]
    if scores and "综合" in difficulty:
        expected_avg = round(sum(scores) / len(scores), 1)
        if abs(difficulty["综合"] - expected_avg) > 0.1:
            errors.append(f"难度综合分计算错误: 期望{expected_avg}，实际{difficulty['综合']}")

    # 游戏案例条件必填
    if basic.get("来源类型") == "游戏案例":
        game_design = case_data.get("游戏设计", {})
        if not game_design.get("游戏平台"):
            errors.append("游戏案例必须填写：游戏平台")
        if not game_design.get("玩法类型"):
            errors.append("游戏案例必须填写：玩法类型")

    return (len(errors) == 0, errors)


def validate_all_cases(cases: List[Dict], schema: dict = None) -> Tuple[List[Dict], List[Dict]]:
    """
    批量校验案件列表。

    Returns:
        (valid_cases, invalid_cases_with_errors)
    """
    valid = []
    invalid = []

    for case in cases:
        is_valid, errors = validate_case(case, schema)
        if is_valid:
            valid.append(case)
        else:
            invalid.append({
                "case": case,
                "id": case.get("id", "unknown"),
                "name": case.get("基本信息", {}).get("案件名称", "未知"),
                "errors": errors
            })

    return valid, invalid
```

- [ ] **Step 2: 创建测试 tests/test_data_validator.py**

```python
"""数据校验模块测试。"""
import pytest
from scripts.data_validator import validate_case


def _make_valid_case():
    return {
        "id": "case-001",
        "基本信息": {
            "案件名称": "测试案件",
            "来源类型": "虚构推理",
            "地区": "日本",
            "一句话简介": "测试"
        },
        "故事视图": {},
        "设计视图": {
            "难度评分": {"线索密度": 3.0, "误导数量": 3.0, "诡计隐蔽度": 3.0, "综合": 3.0}
        },
        "游戏设计": {},
        "元数据": {"录入状态": "完整", "录入日期": "2026-08-28", "最后更新": "2026-08-28"}
    }


def test_valid_case_passes():
    case = _make_valid_case()
    is_valid, errors = validate_case(case)
    assert is_valid is True
    assert errors == []


def test_missing_required_field():
    case = _make_valid_case()
    case["基本信息"]["案件名称"] = ""
    is_valid, errors = validate_case(case)
    assert is_valid is False
    assert any("案件名称" in e for e in errors)


def test_invalid_enum():
    case = _make_valid_case()
    case["基本信息"]["来源类型"] = "非法类型"
    is_valid, errors = validate_case(case)
    assert is_valid is False
    assert any("来源类型" in e for e in errors)


def test_difficulty_out_of_range():
    case = _make_valid_case()
    case["设计视图"]["难度评分"]["线索密度"] = 9.0
    is_valid, errors = validate_case(case)
    assert is_valid is False
    assert any("线索密度" in e for e in errors)


def test_difficulty_avg_mismatch():
    case = _make_valid_case()
    case["设计视图"]["难度评分"] = {"线索密度": 5.0, "误导数量": 1.0, "诡计隐蔽度": 3.0, "综合": 5.0}
    is_valid, errors = validate_case(case)
    assert is_valid is False
    assert any("综合分计算错误" in e for e in errors)


def test_game_case_requires_platform():
    case = _make_valid_case()
    case["基本信息"]["来源类型"] = "游戏案例"
    is_valid, errors = validate_case(case)
    assert is_valid is False
    assert any("游戏平台" in e for e in errors)
```

- [ ] **Step 3: 运行测试**

```powershell
python -m pytest tests/test_data_validator.py -v
```

预期：6个测试全部 PASS。

- [ ] **Step 4: 提交**

```powershell
git add scripts/data_validator.py tests/test_data_validator.py
git commit -m "feat: 添加数据校验模块"
git push
```

---

### Task 4.5: Git 操作模块

**Files:**
- Create: `scripts/git_operations.py`
- Test: `tests/test_git_operations.py`

**Interfaces:**
- Consumes: 配置中的 git_repo_path
- Produces: `GitOperator` 类，提供 `write_case_file()`, `archive_case_file()`, `commit_and_push()` 方法

- [ ] **Step 1: 创建 scripts/git_operations.py**

```python
"""Git 操作封装：文件写入、归档、提交、推送。"""
import os
import json
import shutil
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

try:
    from git import Repo, GitCommandError
except ImportError:
    Repo = None
    GitCommandError = Exception


class GitOperator:
    """Git 仓库操作封装。"""

    def __init__(self, repo_path: str, remote: str = "origin", branch: str = "main"):
        self.repo_path = repo_path
        self.remote = remote
        self.branch = branch
        self._repo = None

    @property
    def repo(self):
        if self._repo is None:
            if Repo is None:
                raise ImportError("GitPython 未安装，请运行 pip install GitPython")
            self._repo = Repo(self.repo_path)
        return self._repo

    def write_case_file(self, case_data: Dict) -> str:
        """
        写入案件 JSON 文件。

        Args:
            case_data: 标准化案件数据

        Returns:
            写入的文件绝对路径
        """
        from scripts.data_transformer import get_file_path

        rel_path = get_file_path(case_data)
        abs_path = os.path.join(self.repo_path, "cases", rel_path)

        # 确保目录存在
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)

        with open(abs_path, "w", encoding="utf-8") as f:
            json.dump(case_data, f, ensure_ascii=False, indent=2)

        return abs_path

    def archive_case_file(self, case_name: str, source_type: str, region: str) -> Optional[str]:
        """
        将案件文件移入 archive 目录（不直接删除）。

        Returns:
            归档后的路径，文件不存在时返回 None
        """
        from scripts.data_transformer import _sanitize_filename

        safe_name = _sanitize_filename(case_name)
        src = os.path.join(self.repo_path, "cases", source_type, region, f"{safe_name}.json")
        if not os.path.exists(src):
            return None

        archive_dir = os.path.join(self.repo_path, "archive", source_type, region)
        os.makedirs(archive_dir, exist_ok=True)

        # 加时间戳避免覆盖
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        dst = os.path.join(archive_dir, f"{safe_name}_{timestamp}.json")
        shutil.move(src, dst)
        return dst

    def get_tracked_case_files(self) -> List[str]:
        """获取 Git 已跟踪的所有案件文件相对路径。"""
        try:
            files = self.repo.git.ls_files("cases/").split("\n")
            return [f for f in files if f.endswith(".json")]
        except GitCommandError:
            return []

    def has_changes(self) -> bool:
        """检查工作区是否有未提交的变更。"""
        return bool(self.repo.is_dirty(untracked_files=True))

    def commit_and_push(self, message: str) -> bool:
        """
        提交所有变更并推送到远程。

        Args:
            message: 提交信息

        Returns:
            是否成功
        """
        try:
            # 添加所有变更
            self.repo.git.add(A=True)

            if not self.repo.is_dirty(staged=True):
                print("没有需要提交的变更")
                return False

            # 提交
            self.repo.index.commit(message)

            # 推送
            origin = self.repo.remote(name=self.remote)
            origin.push(self.branch)

            print(f"提交并推送成功: {message}")
            return True

        except GitCommandError as e:
            print(f"Git 操作失败: {e}")
            return False

    def pull_latest(self) -> bool:
        """拉取远程最新代码（rebase 模式）。"""
        try:
            origin = self.repo.remote(name=self.remote)
            origin.pull(self.branch, rebase=True)
            return True
        except GitCommandError as e:
            print(f"Git pull 失败: {e}")
            return False
```

- [ ] **Step 2: 创建测试 tests/test_git_operations.py**

```python
"""Git 操作模块测试（使用临时目录，不影响真实仓库）。"""
import os
import json
import pytest
import tempfile
from scripts.git_operations import GitOperator


@pytest.fixture
def temp_repo():
    """创建临时 Git 仓库。"""
    with tempfile.TemporaryDirectory() as tmpdir:
        # 初始化 git 仓库
        os.system(f'cd "{tmpdir}" && git init -q && git config user.email "test@test.com" && git config user.name "Test"')
        # 创建必要目录
        os.makedirs(os.path.join(tmpdir, "cases"))
        os.makedirs(os.path.join(tmpdir, "archive"))
        yield tmpdir


def test_write_case_file(temp_repo):
    operator = GitOperator(temp_repo)
    case_data = {
        "基本信息": {
            "来源类型": "虚构推理",
            "地区": "日本",
            "案件名称": "测试案件"
        }
    }
    path = operator.write_case_file(case_data)
    assert os.path.exists(path)
    assert "虚构推理/日本/测试案件.json" in path.replace("\\", "/")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["基本信息"]["案件名称"] == "测试案件"


def test_archive_case_file(temp_repo):
    operator = GitOperator(temp_repo)
    case_data = {
        "基本信息": {
            "来源类型": "虚构推理",
            "地区": "日本",
            "案件名称": "待删除案件"
        }
    }
    path = operator.write_case_file(case_data)
    assert os.path.exists(path)

    archived = operator.archive_case_file("待删除案件", "虚构推理", "日本")
    assert archived is not None
    assert os.path.exists(archived)
    assert not os.path.exists(path)


def test_archive_nonexistent_file(temp_repo):
    operator = GitOperator(temp_repo)
    result = operator.archive_case_file("不存在", "虚构推理", "日本")
    assert result is None


def test_has_changes(temp_repo):
    operator = GitOperator(temp_repo)
    # 初始状态（空仓库）可能有或没有变更，取决于 git 版本
    # 写入一个文件后应该有变更
    case_data = {"基本信息": {"来源类型": "虚构推理", "地区": "日本", "案件名称": "A"}}
    operator.write_case_file(case_data)
    assert operator.has_changes() is True
```

- [ ] **Step 3: 运行测试**

```powershell
python -m pytest tests/test_git_operations.py -v
```

预期：4个测试全部 PASS。

- [ ] **Step 4: 提交**

```powershell
git add scripts/git_operations.py tests/test_git_operations.py
git commit -m "feat: 添加 Git 操作模块"
git push
```

---

### Task 4.6: 主同步程序整合

**Files:**
- Create: `scripts/sync_from_lark.py`
- Create: `scripts/build_exports.py`

**Interfaces:**
- Consumes: config.py, lark_client.py, data_transformer.py, data_validator.py, git_operations.py
- Produces: 可执行的同步入口 `python scripts/sync_from_lark.py`

- [ ] **Step 1: 创建 scripts/sync_from_lark.py**

```python
#!/usr/bin/env python3
"""
飞书 Base → GitHub 同步主程序。

用法：
    python scripts/sync_from_lark.py [--full] [--dry-run]

选项：
    --full      全量同步（默认增量）
    --dry-run   试运行，不写入文件和提交
"""
import os
import sys
import json
import argparse
from datetime import datetime
from typing import Dict, List

# 确保项目根目录在 path 中
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.config import get_config, validate_config
from scripts.lark_client import LarkClient
from scripts.data_transformer import transform_case_record, group_clues_by_case
from scripts.data_validator import load_schema, validate_all_cases
from scripts.git_operations import GitOperator


def setup_logging(log_level: str = "INFO"):
    """配置日志输出。"""
    import logging
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    return logging.getLogger(__name__)


def generate_report(stats: Dict, errors: List[Dict], report_path: str):
    """生成同步报告 Markdown 文件。"""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    lines = [
        f"# 同步报告 {now}",
        "",
        "## 概览",
        f"- 同步时间：{now}",
        f"- 飞书记录总数：{stats.get('total', 0)}",
        f"- 新增：{stats.get('created', 0)}",
        f"- 更新：{stats.get('updated', 0)}",
        f"- 删除（归档）：{stats.get('archived', 0)}",
        f"- 校验失败：{stats.get('invalid', 0)}",
        "",
    ]

    if stats.get("created_list"):
        lines.append("## 新增")
        for item in stats["created_list"]:
            lines.append(f"- {item}")
        lines.append("")

    if stats.get("updated_list"):
        lines.append("## 更新")
        for item in stats["updated_list"]:
            lines.append(f"- {item}")
        lines.append("")

    if errors:
        lines.append("## 校验失败")
        for err in errors:
            lines.append(f"- **{err['name']}**（{err['id']}）：")
            for e in err["errors"]:
                lines.append(f"  - {e}")
        lines.append("")

    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main():
    parser = argparse.ArgumentParser(description="飞书 Base → GitHub 同步")
    parser.add_argument("--full", action="store_true", help="全量同步")
    parser.add_argument("--dry-run", action="store_true", help="试运行，不写入")
    args = parser.parse_args()

    config = get_config()
    logger = setup_logging(config["log_level"])

    # 校验配置
    config_errors = validate_config(config)
    if config_errors:
        logger.error("配置校验失败：")
        for e in config_errors:
            logger.error(f"  - {e}")
        sys.exit(1)

    logger.info("=" * 50)
    logger.info("开始同步" + ("（全量模式）" if args.full else "（增量模式）") + ("（试运行）" if args.dry_run else ""))
    logger.info("=" * 50)

    # 初始化客户端
    lark = LarkClient(config["lark_app_id"], config["lark_app_secret"])
    git_ops = GitOperator(config["git_repo_path"], config["git_remote"], config["git_branch"])
    schema = load_schema(os.path.join(config["schema_dir"], "case.schema.json"))

    # 1. 拉取远程最新
    if not args.dry_run:
        logger.info("拉取远程最新代码...")
        git_ops.pull_latest()

    # 2. 读取飞书数据
    logger.info("读取案件记录...")
    case_records = lark.get_all_records(config["lark_base_token"], config["lark_main_table_id"])
    logger.info(f"读取到 {len(case_records)} 条案件记录")

    logger.info("读取线索记录...")
    clue_records = lark.get_all_records(config["lark_base_token"], config["lark_sub_table_id"])
    logger.info(f"读取到 {len(clue_records)} 条线索记录")

    # 3. 线索按案件分组
    clues_by_case = group_clues_by_case(clue_records)

    # 4. 转换数据
    logger.info("转换数据格式...")
    cases = []
    for i, record in enumerate(case_records, 1):
        record_id = record.get("record_id", "")
        clues = clues_by_case.get(record_id, [])
        case_data = transform_case_record(record, clues=clues, case_number=i)
        cases.append(case_data)

    # 5. 数据校验
    logger.info("校验数据...")
    valid_cases, invalid_cases = validate_all_cases(cases, schema)
    logger.info(f"校验通过：{len(valid_cases)}，失败：{len(invalid_cases)}")

    if invalid_cases:
        error_log_path = os.path.join(config["errors_dir"], f"{datetime.now().strftime('%Y-%m-%d')}.log")
        os.makedirs(os.path.dirname(error_log_path), exist_ok=True)
        with open(error_log_path, "a", encoding="utf-8") as f:
            for item in invalid_cases:
                f.write(f"[{datetime.now().isoformat()}] {item['id']} {item['name']}: {'; '.join(item['errors'])}\n")

    # 6. 写入文件
    stats = {
        "total": len(case_records),
        "created": 0,
        "updated": 0,
        "archived": 0,
        "invalid": len(invalid_cases),
        "created_list": [],
        "updated_list": [],
    }

    if not args.dry_run:
        logger.info("写入案件文件...")
        # 获取现有文件列表（用于检测删除）
        existing_files = set(git_ops.get_tracked_case_files())
        written_files = set()

        for case in valid_cases:
            from scripts.data_transformer import get_file_path
            rel_path = get_file_path(case)
            abs_path = os.path.join(config["cases_dir"], rel_path)

            if os.path.exists(abs_path):
                stats["updated"] += 1
                stats["updated_list"].append(f"{case['id']} {case['基本信息']['案件名称']}")
            else:
                stats["created"] += 1
                stats["created_list"].append(f"{case['id']} {case['基本信息']['案件名称']}")

            git_ops.write_case_file(case)
            written_files.add(rel_path.replace("\\", "/"))

        # 检测删除（飞书中已不存在但 Git 中还在的文件）
        deleted_files = existing_files - written_files
        for rel_path in deleted_files:
            # 从路径解析来源类型、地区、案件名
            parts = rel_path.replace("cases/", "").split("/")
            if len(parts) >= 3:
                source_type, region, filename = parts[0], parts[1], parts[2]
                case_name = filename.replace(".json", "")
                git_ops.archive_case_file(case_name, source_type, region)
                stats["archived"] += 1
                logger.info(f"归档删除案件: {case_name}")

    # 7. 生成全量导出
    if not args.dry_run and valid_cases:
        logger.info("生成全量导出...")
        exports_path = os.path.join(config["exports_dir"], "all_cases.json")
        os.makedirs(os.path.dirname(exports_path), exist_ok=True)
        with open(exports_path, "w", encoding="utf-8") as f:
            json.dump(valid_cases, f, ensure_ascii=False, indent=2)

    # 8. 生成报告
    report_path = os.path.join(config["reports_dir"], f"{datetime.now().strftime('%Y-%m-%d-%H%M')}.md")
    generate_report(stats, invalid_cases, report_path)
    logger.info(f"同步报告已生成: {report_path}")

    # 9. 提交并推送
    if not args.dry_run and git_ops.has_changes():
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        message = f"sync: 自动同步 {now}（新增{stats['created']}，更新{stats['updated']}）"
        success = git_ops.commit_and_push(message)
        if success:
            logger.info("同步完成并已推送到远程")
        else:
            logger.warning("提交或推送失败，请检查")
    else:
        if args.dry_run:
            logger.info("试运行模式，未提交变更")
        else:
            logger.info("没有变更需要提交")

    logger.info("=" * 50)
    logger.info(f"同步完成：新增{stats['created']}，更新{stats['updated']}，归档{stats['archived']}，失败{stats['invalid']}")
    logger.info("=" * 50)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: 创建 scripts/build_exports.py**

```python
#!/usr/bin/env python3
"""从 cases/ 目录生成全量导出文件。"""
import os
import sys
import json
import csv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def load_all_cases(cases_dir: str) -> list:
    """加载 cases/ 下所有 JSON 文件。"""
    cases = []
    for root, dirs, files in os.walk(cases_dir):
        for filename in files:
            if filename.endswith(".json"):
                filepath = os.path.join(root, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    cases.append(json.load(f))
    return cases


def export_json(cases: list, output_path: str):
    """导出为 JSON。"""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(cases, f, ensure_ascii=False, indent=2)
    print(f"JSON 导出: {output_path}（{len(cases)} 条）")


def export_csv(cases: list, output_path: str):
    """导出为 CSV（扁平化基本信息）。"""
    if not cases:
        return

    # 提取基本信息字段
    fieldnames = ["id", "案件名称", "来源类型", "来源作品/事件", "作者/创作者",
                  "地区", "年代", "案件状态", "一句话简介", "录入状态", "难度综合"]

    with open(output_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for case in cases:
            basic = case.get("基本信息", {})
            meta = case.get("元数据", {})
            diff = case.get("设计视图", {}).get("难度评分", {})
            writer.writerow({
                "id": case.get("id", ""),
                "案件名称": basic.get("案件名称", ""),
                "来源类型": basic.get("来源类型", ""),
                "来源作品/事件": basic.get("来源作品/事件", ""),
                "作者/创作者": basic.get("作者/创作者", ""),
                "地区": basic.get("地区", ""),
                "年代": basic.get("年代", ""),
                "案件状态": basic.get("案件状态", ""),
                "一句话简介": basic.get("一句话简介", ""),
                "录入状态": meta.get("录入状态", ""),
                "难度综合": diff.get("综合", ""),
            })
    print(f"CSV 导出: {output_path}（{len(cases)} 条）")


def main():
    repo_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cases_dir = os.path.join(repo_path, "cases")
    exports_dir = os.path.join(repo_path, "exports")
    os.makedirs(exports_dir, exist_ok=True)

    cases = load_all_cases(cases_dir)
    print(f"加载 {len(cases)} 个案件")

    export_json(cases, os.path.join(exports_dir, "all_cases.json"))
    export_csv(cases, os.path.join(exports_dir, "all_cases.csv"))


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: 运行全部测试确保无回归**

```powershell
python -m pytest tests/ -v
```

预期：所有测试 PASS。

- [ ] **Step 4: 试运行同步脚本（dry-run）**

先确保环境变量已配置（.env 文件），然后运行：

```powershell
python scripts/sync_from_lark.py --dry-run
```

预期：输出读取记录数、校验结果、同步报告路径，但不写入文件。

注意：如果飞书 Base 中还没有案件记录，会显示读取到 0 条，这是正常的。

- [ ] **Step 5: 提交**

```powershell
git add scripts/sync_from_lark.py scripts/build_exports.py
git commit -m "feat: 完成同步主程序和导出脚本"
git push
```

---

## Task 5: GitHub Actions 配置

**Files:**
- Create: `.github/workflows/daily-sync.yml`

**Interfaces:**
- Consumes: GitHub Secrets 中配置的飞书凭证
- Produces: 每日自动同步的 CI/CD 工作流

- [ ] **Step 1: 创建工作流配置文件**

在 `E:\Work\AIProjects\fun_detective\.github\workflows\daily-sync.yml` 写入：

```yaml
name: Daily Sync from Lark Base

on:
  schedule:
    # 每天北京时间 03:00 自动同步（UTC 19:00）
    - cron: '0 19 * * *'
  workflow_dispatch:  # 允许手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Configure Git
        run: |
          git config --global user.name "fun-detective-bot"
          git config --global user.email "bot@fun-detective.local"
          git remote set-url origin https://x-access-token:${{ secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}.git

      - name: Run sync script
        env:
          LARK_APP_ID: ${{ secrets.LARK_APP_ID }}
          LARK_APP_SECRET: ${{ secrets.LARK_APP_SECRET }}
          LARK_BASE_TOKEN: ${{ secrets.LARK_BASE_TOKEN }}
          LARK_MAIN_TABLE_ID: ${{ secrets.LARK_MAIN_TABLE_ID }}
          LARK_SUB_TABLE_ID: ${{ secrets.LARK_SUB_TABLE_ID }}
          GIT_REPO_PATH: ${{ github.workspace }}
          SYNC_MODE: incremental
          LOG_LEVEL: INFO
        run: python scripts/sync_from_lark.py

      - name: Check for changes
        id: git-check
        run: |
          if git diff --quiet && git diff --cached --quiet; then
            echo "changes=false" >> $GITHUB_OUTPUT
            echo "No changes detected"
          else
            echo "changes=true" >> $GITHUB_OUTPUT
            echo "Changes detected"
          fi

      - name: Commit and push
        if: steps.git-check.outputs.changes == 'true'
        run: |
          git add -A
          git commit -m "sync: 自动同步 $(date '+%Y-%m-%d %H:%M') [skip ci]"
          git push origin main
```

- [ ] **Step 2: 提交工作流配置**

```powershell
git add .github/workflows/daily-sync.yml
git commit -m "ci: 添加每日自动同步 GitHub Actions 工作流"
git push
```

- [ ] **Step 3: 配置 GitHub Secrets**

在 GitHub 仓库页面操作：
1. 打开 https://github.com/WatersLin-Ann/fun_detective/settings/secrets/actions
2. 点击 "New repository secret"
3. 依次添加以下 Secrets：

| Secret 名称 | 值 |
|---|---|
| `LARK_APP_ID` | 飞书应用的 App ID |
| `LARK_APP_SECRET` | 飞书应用的 App Secret |
| `LARK_BASE_TOKEN` | `NlZabSCWaa4NXbsUf1Wc6inQnjf` |
| `LARK_MAIN_TABLE_ID` | `tbl02kunLvM8fGow` |
| `LARK_SUB_TABLE_ID` | `tblqyVU3YzPiw5IS` |

**飞书应用获取方式：**
1. 访问 https://open.feishu.cn/app
2. 创建企业自建应用
3. 开通「多维表格」权限（`bitable:app:readonly`）
4. 将应用添加为飞书 Base 的协作者（编辑权限）
5. 获取 App ID 和 App Secret

- [ ] **Step 4: 手动触发工作流测试**

1. 打开 https://github.com/WatersLin-Ann/fun_detective/actions
2. 选择 "Daily Sync from Lark Base"
3. 点击 "Run workflow" → 选择 main 分支 → "Run workflow"
4. 等待运行完成，查看日志

预期：工作流运行成功，如果飞书 Base 中有数据，会自动提交并推送。

---

## Task 6: 首次完整同步验证

**Files:**
- 验证对象：整个数据管道

**Interfaces:**
- Consumes: 飞书 Base 中的测试数据
- Produces: GitHub 仓库中的案件 JSON 文件、同步报告

**前置条件：** Task 1-5 全部完成，飞书 Base 中至少有1条测试案件记录。

- [ ] **Step 1: 在飞书 Base 中创建一条测试记录**

在飞书 Base 案件库主表中新建一条记录：
- 案件名称：`测试案件-同步验证`
- 来源类型：`虚构推理`
- 地区：`日本`
- 一句话简介：`用于验证同步管道的测试案件`
- 录入状态：`待录入`
- 录入日期：今天
- 最后更新：今天

保存记录。

- [ ] **Step 2: 本地手动运行同步脚本**

```powershell
Set-Location "E:\Work\AIProjects\fun_detective"
python scripts/sync_from_lark.py
```

预期输出：
- 读取到至少1条案件记录
- 校验通过
- 写入文件 `cases/虚构推理/日本/测试案件-同步验证.json`
- 生成同步报告
- Git 提交并推送成功

- [ ] **Step 3: 验证生成的 JSON 文件**

```powershell
Get-Content "cases\虚构推理\日本\测试案件-同步验证.json" -Encoding UTF8
```

验证：
- JSON 格式合法
- 包含 id、基本信息、故事视图、设计视图、游戏设计、元数据
- 案件名称正确
- 飞书记录ID 存在

- [ ] **Step 4: 验证 GitHub 远程仓库**

访问 https://github.com/WatersLin-Ann/fun_detective
验证：
- `cases/虚构推理/日本/测试案件-同步验证.json` 存在
- `reports/` 目录下有同步报告
- `exports/all_cases.json` 存在
- 最新 commit 信息以 `sync:` 开头

- [ ] **Step 5: 验证增量同步（更新记录）**

1. 在飞书 Base 中修改测试案件的「一句话简介」为「已更新的测试简介」
2. 再次运行同步脚本：
```powershell
python scripts/sync_from_lark.py
```
3. 验证 JSON 文件中的一句话简介已更新
4. 验证 Git 提交信息中「更新」计数为1

- [ ] **Step 6: 验证删除归档**

1. 在飞书 Base 中删除测试案件记录
2. 运行同步脚本
3. 验证 `cases/` 下该文件已不存在
4. 验证 `archive/虚构推理/日本/` 下有带时间戳的归档文件

- [ ] **Step 7: 清理测试数据**

在飞书 Base 中确认测试记录已删除，归档文件保留（作为删除机制的验证记录）。

- [ ] **Step 8: 最终验证：运行全部测试**

```powershell
python -m pytest tests/ -v --cov=scripts
```

预期：所有测试 PASS，覆盖率报告显示各模块覆盖率。

---

## Self-Review

### 1. Spec 覆盖检查

| Spec 要求 | 对应任务 | 状态 |
|---|---|---|
| 飞书 Base 新增7个游戏字段 | Task 1 | ✅ |
| GitHub 仓库初始化 | Task 2 | ✅ |
| 目录结构（cases/archive/schema/exports/scripts...） | Task 2 Step 2 | ✅ |
| JSON Schema 定义 | Task 3 | ✅ |
| 同步脚本（飞书 API → JSON → Git） | Task 4.1-4.6 | ✅ |
| 数据校验 | Task 4.4 | ✅ |
| 增量同步策略 | Task 4.6 main() | ✅ |
| 删除归档（不直接删除） | Task 4.5 archive_case_file | ✅ |
| Git 提交策略 | Task 4.5 + Task 4.6 | ✅ |
| 错误处理和日志 | Task 4.2 重试 + Task 4.6 日志 | ✅ |
| 同步报告 | Task 4.6 generate_report | ✅ |
| 全量导出（JSON/CSV） | Task 4.6 build_exports.py | ✅ |
| GitHub Actions 每日自动同步 | Task 5 | ✅ |
| 首次同步验证 | Task 6 | ✅ |

### 2. 占位符扫描

- 无 TBD/TODO
- 所有代码步骤都有完整代码块
- 所有命令都有明确的预期输出
- 无"类似 Task N"的引用

### 3. 类型一致性检查

- `LarkClient.get_all_records()` 返回 `List[Dict]`，在 Task 4.6 中按此使用 ✅
- `transform_case_record(record, clues, case_number)` 参数顺序在定义和调用中一致 ✅
- `validate_case(case_data, schema)` 返回 `Tuple[bool, List[str]]`，在 `validate_all_cases` 中按此使用 ✅
- `GitOperator` 方法名在定义和调用中一致 ✅
- 配置字段名在 config.py 和 .env.example、GitHub Actions 中一致 ✅

---

## 执行顺序总结

```
Task 1（飞书字段）→ Task 2（仓库初始化）→ Task 3（Schema）
     → Task 4.1（config）→ Task 4.2（lark_client）→ Task 4.3（transformer）
     → Task 4.4（validator）→ Task 4.5（git_ops）→ Task 4.6（main）
     → Task 5（GitHub Actions）→ Task 6（首次同步验证）
```

**预计总工作量：** 6-8 小时（含测试和调试）

**关键依赖：**
- Task 4.2-4.6 依赖飞书应用凭证（App ID / App Secret），需提前在飞书开放平台创建应用
- Task 5 依赖 GitHub Secrets 配置
- Task 6 依赖飞书 Base 中有测试数据
