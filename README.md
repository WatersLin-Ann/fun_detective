# Fun Detective 全球案件案例库

网罗全球虚拟与真实案件的结构化案例库，服务于推理小说创作和游戏设计。

## 项目架构

- **飞书 Base**：唯一录入入口（案件库 + 线索链）
- **GitHub 仓库**：数据资产（标准化 JSON）
- **同步脚本**：飞书 → Git 自动化同步
- **前端网站**：Astro 静态站，部署于 GitHub Pages

## 目录结构

```
cases/          # 案件 JSON（按来源类型/地区分目录）
archive/        # 已删除案件归档
schema/         # JSON Schema 定义
exports/        # 全量导出（JSON/CSV）
scripts/        # 同步与校验脚本
reports/        # 同步报告
tests/          # 测试
docs/           # 项目文档
src/            # Astro 前端源码
public/         # 静态资源（含全量 case-data.json）
.github/        # GitHub Actions 工作流
.githooks/      # Git 提交前审查钩子
```

## 数据格式

每个案件一个 JSON 文件，包含基本信息、故事视图、设计视图、游戏设计、元数据五个部分。详见 `schema/case.schema.json`。

## 同步方式

```bash
# 手动同步
python scripts/sync_from_lark.py

# 自动同步
# GitHub Actions 每日北京时间 03:00 自动执行
```

## 环境变量

复制 `.env.example` 为 `.env`，填入你的飞书应用凭证。**切勿将 `.env` 提交到版本控制。**

```
LARK_APP_ID=cli_xxxxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
LARK_BASE_TOKEN=your_base_token_here
LARK_MAIN_TABLE_ID=tblxxxxxxxxxxxx
LARK_SUB_TABLE_ID=tblxxxxxxxxxxxx
GIT_REPO_PATH=./
SYNC_MODE=incremental
LOG_LEVEL=INFO
```

> 安全提示：飞书 Base Token、Table ID 属于内部标识符，不应在公开文档中暴露真实值。如需协作，请通过私有渠道共享。

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建静态站点
npm run build

# 本地预览构建产物
npm run preview
```

## 提交规范

本项目启用了 Git 提交前审查钩子（pre-commit hook），首次克隆后需执行：

```bash
git config core.hooksPath .githooks
```

提交前将自动检查：敏感信息泄露、临时文件、构建产物、日志文件、大文件等。未通过审查的提交将被阻止。详见 `docs/DEPLOYMENT.md`。

## 许可证

代码部分采用 MIT License，案件数据（cases/ 目录）采用 CC BY-SA 4.0。详见 `LICENSE` 和 `cases/README.md`。

## 阶段路线

- [x] 阶段0：飞书 Base 搭建
- [x] 阶段1：数据管道搭建
- [x] 阶段2：Astro 网站上线
- [ ] 阶段3：创作工具开发
- [ ] 阶段4：社区与 API 开放
