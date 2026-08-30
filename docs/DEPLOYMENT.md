# Fun Detective 部署要求与提交规范

> 本文档定义了 Fun Detective 项目的部署架构、提交规范、安全要求和日常维护流程。所有代码和数据的提交、同步、发布都必须遵循本文档。

## 一、部署架构

```
┌─────────────┐     每日 03:00      ┌──────────────┐
│  飞书 Base   │ ───────────────────→ │  GitHub 仓库  │
│  (唯一录入)  │   GitHub Actions     │  (数据资产)   │
└─────────────┘   daily-sync.yml     └──────┬───────┘
                                              │ push to main
                                              ▼
                                     ┌──────────────┐
                                     │ GitHub Actions│
                                     │  deploy.yml  │
                                     └──────┬───────┘
                                            │
                                            ▼
                                     ┌──────────────┐
                                     │ GitHub Pages │
                                     │ (静态网站)   │
                                     └──────────────┘
```

- **飞书 Base**：唯一数据录入入口，通过同步脚本导出为标准化 JSON
- **GitHub 仓库**：代码和数据的唯一版本控制源，公开仓库
- **GitHub Pages**：静态网站托管，自动部署
- **本地开发**：Astro dev server + Node.js 静态文件服务器

## 二、首次部署配置

### 2.1 克隆仓库并配置钩子

```bash
git clone https://github.com/WatersLin-Ann/fun_detective.git
cd fun_detective

# 配置提交前审查钩子（必须执行）
git config core.hooksPath .githooks

# 安装依赖
npm install
pip install -r requirements.txt
```

### 2.2 配置环境变量

复制 `.env.example` 为 `.env`，填入真实的飞书应用凭证：

```bash
cp .env.example .env
```

**`.env` 文件绝对不能提交到版本控制。** `.gitignore` 已包含此规则。

### 2.3 配置 GitHub Secrets

在 GitHub 仓库 → Settings → Secrets and variables → Actions 中配置以下 Secrets：

| Secret 名称 | 说明 |
|---|---|
| `LARK_APP_ID` | 飞书应用 App ID |
| `LARK_APP_SECRET` | 飞书应用 App Secret |
| `LARK_BASE_TOKEN` | 飞书 Base Token |
| `LARK_MAIN_TABLE_ID` | 主表 Table ID |
| `LARK_SUB_TABLE_ID` | 子表 Table ID |

## 三、提交前审查流程（强制执行）

> **核心原则：每次同步到 git 或其他线上环境前，必须经过审查，确认无敏感信息泄露、无禁止文件、数据格式正确后才能提交。**

### 3.1 第一层：本地 pre-commit 钩子

提交时自动触发，检查以下内容：

| 检查项 | 说明 | 未通过处理 |
|---|---|---|
| 禁止提交的文件 | `.env`、`temp_*`、`*.log`、`.astro/`、`dist/`、`node_modules/` 等 | 阻止提交 |
| 敏感信息扫描 | 飞书 App Secret、Base Token、API Key、私钥、AWS 密钥等 | 阻止提交 |
| 大文件检查 | 非媒体文件 > 1MB | 阻止提交（媒体文件仅警告） |
| JSON 格式验证 | `cases/` 目录下的案件数据 JSON | 阻止提交 |

**钩子位置**：`.githooks/pre-commit`
**启用方式**：`git config core.hooksPath .githooks`（已配置）

如遇特殊情况需跳过检查（不推荐）：`git commit --no-verify`，但必须在 commit message 中说明原因。

### 3.2 第二层：GitHub Actions CI 检查

push 到 main 或创建 PR 时自动触发，工作流文件：`.github/workflows/security-check.yml`

检查内容与本地钩子一致，作为远程最后一道防线。CI 未通过的 PR 不可合并。

### 3.3 第三层：人工审查清单

对于涉及以下内容的提交，除自动检查外，还需人工确认：

- [ ] 新增或修改了环境变量相关代码 → 确认无硬编码密钥
- [ ] 新增了第三方依赖 → 确认许可证兼容、无已知漏洞
- [ ] 修改了案件数据 → 确认无大段原文引用、无版权问题
- [ ] 修改了部署配置 → 确认不会导致服务中断
- [ ] 包含图片/视频等媒体文件 → 确认有版权授权或为自制

## 四、禁止提交的文件清单

以下文件**绝对不能**出现在 git 版本控制中：

| 类别 | 模式 | 说明 |
|---|---|---|
| 环境变量 | `.env`, `.env.local`, `.env.*.local` | 包含真实凭证 |
| 临时文件 | `temp_*`, `*.tmp`, `*.bak` | 调试和中间产物 |
| 日志文件 | `*.log` | 运行时日志，可能包含敏感信息 |
| 构建产物 | `dist/`, `.astro/` | 由 CI 自动构建，不应提交 |
| 依赖目录 | `node_modules/`, `venv/`, `env/` | 由包管理器安装 |
| IDE 配置 | `.vscode/`, `.idea/` | 个人编辑器配置 |
| 系统文件 | `.DS_Store`, `Thumbs.db` | 操作系统生成 |
| 本地工作区 | `.superpowers/`, `.lark-cli/` | 本地工具产生的临时数据 |

`.gitignore` 已包含以上规则。如发现上述文件被意外提交，立即使用 `git rm --cached <file>` 移除并轮换可能泄露的凭证。

## 五、敏感信息管理规范

### 5.1 凭证分级

| 级别 | 示例 | 管理方式 |
|---|---|---|
| 🔴 高敏感 | 飞书 App Secret、数据库密码、API Key | 仅存于 `.env` 和 GitHub Secrets，绝不写入代码或文档 |
| 🟡 中敏感 | 飞书 Base Token、Table ID、内部 URL | 不在公开文档中暴露真实值，使用占位符 |
| 🟢 低敏感 | 项目名称、公开 API 端点、技术栈 | 可在文档中说明 |

### 5.2 文档中的凭证处理

- README、部署文档等公开文档中，所有凭证必须使用占位符（如 `your_app_secret`、`cli_xxxxxxxxxxxx`）
- 真实凭证仅通过私有渠道（飞书消息、加密邮件）共享
- 如发现凭证已在公开文档中暴露，立即替换并考虑轮换

### 5.3 凭证轮换

- 飞书 App Secret 建议每季度轮换一次
- 如怀疑凭证泄露，立即轮换并更新 GitHub Secrets 和本地 `.env`
- 轮换后在 `docs/SECURITY_CHECKLIST.md` 中记录

## 六、数据版权规范

### 6.1 案件数据内容要求

`cases/` 目录下的所有案件数据必须遵循：

- ✅ **允许**：剧情梗概、诡计分析、线索链设计、游戏化改编建议、结构化拆解
- ✅ **允许**：真实案件的事实性时间线整理（事实不受版权保护）
- ❌ **禁止**：大段原文引用（小说原文、影视台词、游戏对话）
- ❌ **禁止**：逐句复述剧情（应概括为自己的语言）
- ❌ **禁止**：未授权的媒体文件（图片、视频、音频）

### 6.2 故事字段长度参考

| 字段 | 建议长度 | 说明 |
|---|---|---|
| 故事摘要 | 100-200 字符 | 一句话概括 |
| 完整故事 | 300-1000 字符 | 概括性剧情描述，非原文 |
| 人物关系 | < 100 字符 | 结构化关系 |
| 关键时间线 | < 200 字符 | 结构化时间节点 |
| 结局/真相 | < 100 字符 | 简短揭示 |

如单个字段超过 1000 字符，需人工确认是否包含原文引用。

### 6.3 数据许可证

案件数据采用 **CC BY-SA 4.0** 许可证，详见 `cases/README.md`。代码采用 **MIT License**，详见 `LICENSE`。

## 七、发布流程

### 7.1 日常数据同步

数据同步由 GitHub Actions 自动执行（每日北京时间 03:00），无需人工干预。

手动触发同步：
1. 确认飞书 Base 中的数据已保存
2. GitHub 仓库 → Actions → Daily Sync from Lark Base → Run workflow
3. 等待同步完成，检查生成的 commit

### 7.2 代码发布

1. 本地开发完成后，`git add` 暂存修改
2. `git commit` 触发 pre-commit 审查
3. 审查通过后 `git push origin main`
4. GitHub Actions 自动执行：
   - `security-check.yml`：安全与质量检查
   - `deploy.yml`：构建并部署到 GitHub Pages
5. 确认网站正常访问：https://waterslin-ann.github.io/fun_detective/

### 7.3 紧急回滚

如部署后发现问题：

```bash
# 查看最近的提交
git log --oneline -10

# 回滚到上一个稳定版本
git revert <commit_hash>
git push origin main
```

GitHub Pages 会在几分钟内自动重新部署回滚后的版本。

## 八、日常维护检查清单

### 每日（自动）

- [x] GitHub Actions 自动同步飞书 Base 数据
- [x] GitHub Actions 自动部署网站

### 每周（人工）

- [ ] 检查 GitHub Actions 运行状态，确认无失败
- [ ] 检查 `errors/` 目录（本地），确认无持续的校验错误
- [ ] 检查网站可访问性

### 每月（人工）

- [ ] 检查飞书应用权限和可用范围
- [ ] 检查飞书 Base 协作者列表，移除不必要的人员
- [ ] 检查 GitHub Secrets 是否需要更新
- [ ] 审查新增案件数据的版权合规性
- [ ] 运行 `npm audit` 检查依赖漏洞

### 每季度（人工）

- [ ] 轮换飞书 App Secret
- [ ] 全面审查仓库安全状态（参考 `docs/SECURITY_CHECKLIST.md`）
- [ ] 更新依赖到最新稳定版本

## 九、违规处理

如发现以下情况，立即处理：

| 违规类型 | 处理方式 |
|---|---|
| 敏感信息提交到公开仓库 | 1. 立即 `git rm --cached` 移除；2. 轮换相关凭证；3. 清理 git 历史（如必要） |
| 禁止文件被提交 | `git rm --cached` 移除，更新 `.gitignore` |
| 案件数据包含原文引用 | 删除或改写相关内容，重新提交 |
| 绕过 pre-commit 钩子提交 | 回滚提交，重新走审查流程 |

---

**文档版本**：v1.0
**最后更新**：2026-08-30
**维护者**：WatersLin-Ann
