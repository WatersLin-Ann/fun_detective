# Fun Detective 全球案件案例库

网罗全球虚拟与真实案件的结构化案例库，服务于推理小说创作和游戏设计。

## 项目架构

- **飞书 Base**：唯一录入入口（案件库 + 线索链）
- **GitHub 仓库**：数据资产（标准化 JSON）
- **同步脚本**：飞书 → Git 自动化同步
- **前端网站**：阶段2启动（Astro 静态站）

## 目录结构

```
cases/          # 案件 JSON（按来源类型/地区分目录）
archive/        # 已删除案件归档
schema/         # JSON Schema 定义
exports/        # 全量导出（JSON/CSV）
scripts/        # 同步与校验脚本
reports/        # 同步报告
errors/         # 校验错误日志
tests/          # 测试
docs/           # 项目文档
```

## 数据格式

每个案件一个 JSON 文件，包含基本信息、故事视图、设计视图、游戏设计、元数据五个部分。详见 `schema/case.schema.json`。

## 同步方式

```bash
# 手动同步
python scripts/sync_from_lark.py

# 自动同步
# GitHub Actions 每日凌晨 03:00 自动执行
```

## 环境变量

```
LARK_APP_ID=your_app_id
LARK_APP_SECRET=your_app_secret
LARK_BASE_TOKEN=NlZabSCWaa4NXbsUf1Wc6inQnjf
LARK_MAIN_TABLE_ID=tbl02kunLvM8fGow
LARK_SUB_TABLE_ID=tblqyVU3YzPiw5IS
GIT_REPO_PATH=E:/Work/AIProjects/fun_detective
```

## 阶段路线

- [x] 阶段0：飞书 Base 搭建
- [ ] 阶段1：数据管道搭建（当前）
- [ ] 阶段2：Astro 网站上线
- [ ] 阶段3：创作工具开发
- [ ] 阶段4：社区与 API 开放
