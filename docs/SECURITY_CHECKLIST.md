# 敏感信息清理与安全检查清单

> 本文档用于记录公开仓库敏感信息清理的执行情况。请逐项检查并在「执行结果」列填入状态。

## 一、已完成的清理动作

| 序号 | 清理项 | 执行方式 | 状态 |
|---|---|---|---|
| 1 | README.md 中的飞书 Base Token / Table ID | 替换为占位符 `your_base_token_here` / `tblxxxxxxxxxxxx` | ✅ 已完成 |
| 2 | README.md 中的本地绝对路径 `E:/Work/AIProjects/fun_detective` | 替换为 `./` | ✅ 已完成 |
| 3 | .gitignore 补充 `temp_*` 规则 | 防止临时文件再次提交 | ✅ 已完成 |
| 4 | 从 git 索引移除临时文件（temp_batch2.json 等） | `git rm --cached` | ✅ 已完成 |
| 5 | 从 git 索引移除 .astro/ 构建产物 | `git rm --cached -r .astro/` | ✅ 已完成 |
| 6 | 从 git 索引移除 errors/*.log | `git rm --cached errors/*.log`，并移除 .gitignore 中的例外规则 | ✅ 已完成 |

## 二、需要你在飞书后台执行的检查

> 以下操作无法通过代码完成，需要你登录飞书开放平台手动确认。

### 2.1 飞书应用权限检查

| 检查项 | 操作路径 | 预期结果 | 执行结果 |
|---|---|---|---|
| 应用权限范围是否最小化 | 飞书开放平台 → 你的应用 → 权限管理 | 仅开通 `bitable:app` 等必要权限，不开通多余权限 | ☐ 已确认 / ☐ 需调整 |
| 应用是否已发布上线 | 飞书开放平台 → 你的应用 → 版本管理与发布 | 已发布且可用 | ☐ 已确认 / ☐ 需发布 |
| 可用范围是否限制为指定人员/部门 | 飞书开放平台 → 你的应用 → 应用发布 → 可用范围 | 仅项目相关人员可用，非"全员可用" | ☐ 已确认 / ☐ 需调整 |

### 2.2 飞书 Base 访问权限检查

| 检查项 | 操作路径 | 预期结果 | 执行结果 |
|---|---|---|---|
| Base 文档是否开启了"互联网获取链接" | 打开 Base → 右上角「分享」→ 链接分享 | **不应**开启"互联网上获得链接的人可阅读"，应设为"仅指定人可访问" | ☐ 已确认 / ☐ 需关闭 |
| Base 协作者是否仅为必要人员 | 打开 Base → 右上角「分享」→ 协作者列表 | 仅项目相关人员，无陌生人/离职人员 | ☐ 已确认 / ☐ 需清理 |
| 高级权限中是否有不必要的公开视图 | 打开 Base → 左侧表名 → 高级权限 | 无公开可访问的视图/表单 | ☐ 已确认 / ☐ 需调整 |

### 2.3 凭证轮换（建议但非必须）

> 由于 Base Token 和 Table ID 曾在公开 README 中暴露过，虽然它们不是 App Secret，但建议评估是否需要轮换。

| 检查项 | 说明 | 执行结果 |
|---|---|---|
| 是否需要重新创建飞书应用以轮换 App ID / App Secret | 如果担心 App Secret 也可能通过其他渠道泄露，建议重建应用。重建后需更新 GitHub Secrets 和本地 .env | ☐ 不需要 / ☐ 已轮换 |
| 是否需要新建 Base 以轮换 Base Token | Base Token 是文档的唯一标识，无法直接修改，只能新建 Base 并迁移数据。如果数据敏感度不高，可不必轮换 | ☐ 不需要 / ☐ 已迁移 |
| GitHub Secrets 是否已确认使用最新值 | GitHub 仓库 → Settings → Secrets and variables → Actions，确认 LARK_APP_ID / LARK_APP_SECRET / LARK_BASE_TOKEN 等值正确 | ☐ 已确认 |

## 三、GitHub 仓库安全检查

| 检查项 | 操作路径 | 预期结果 | 执行结果 |
|---|---|---|---|
| Secret Scanning 是否启用 | GitHub 仓库 → Settings → Code security and analysis → Secret scanning | 公共仓库默认启用，状态为 Enabled | ☐ 已确认 |
| Push Protection 是否启用 | 同上 → Push protection | 启用，防止密钥被推送 | ☐ 已确认 / ☐ 需启用 |
| Dependabot Alerts 是否启用 | 同上 → Dependabot alerts | 启用 | ☐ 已确认 / ☐ 需启用 |
| 分支保护规则 | GitHub 仓库 → Settings → Branches → Branch protection rules | main 分支建议启用保护，要求 PR 审查或状态检查通过后才能合并 | ☐ 已配置 / ☐ 需配置 |
| GitHub Actions 中是否有硬编码密钥 | 检查 `.github/workflows/*.yml` | 所有密钥通过 `${{ secrets.XXX }}` 引用，无硬编码 | ☐ 已确认 |

## 四、后续维护

- [ ] 每次新增环境变量时，先确认 `.env.example` 中使用的是占位符
- [ ] 每次提交前确认 `git status` 中没有 `.env`、`temp_*`、`*.log` 等文件
- [ ] 每月检查一次飞书应用权限和 Base 协作者列表
- [ ] 每季度轮换一次飞书 App Secret（安全最佳实践）

---

**最后更新**：2026-08-30
**执行人**：___________
