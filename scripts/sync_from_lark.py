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
import logging
from datetime import datetime
from typing import Dict, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.config import get_config, validate_config
from scripts.lark_client import LarkClient
from scripts.data_transformer import transform_case_record, group_clues_by_case
from scripts.data_validator import load_schema, validate_all_cases
from scripts.git_operations import GitOperator


def setup_logging(log_level: str = "INFO"):
    """配置日志输出。"""
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
        f"- 校验失败（保留待完善）：{stats.get('invalid', 0)}",
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
        lines.append("## 校验失败（已保留并标记为待完善）")
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

    config_errors = validate_config(config)
    if config_errors:
        logger.error("配置校验失败：")
        for e in config_errors:
            logger.error(f"  - {e}")
        sys.exit(1)

    logger.info("=" * 50)
    logger.info("开始同步" + ("（全量模式）" if args.full else "（增量模式）") + ("（试运行）" if args.dry_run else ""))
    logger.info("=" * 50)

    lark = LarkClient(config["lark_app_id"], config["lark_app_secret"])
    git_ops = GitOperator(config["git_repo_path"], config["git_remote"], config["git_branch"])
    schema = load_schema(os.path.join(config["schema_dir"], "case.schema.json"))

    if not args.dry_run:
        logger.info("拉取远程最新代码...")
        git_ops.pull_latest()

    logger.info("读取案件记录...")
    case_records = lark.get_all_records(config["lark_base_token"], config["lark_main_table_id"])
    logger.info(f"读取到 {len(case_records)} 条案件记录")

    logger.info("读取线索记录...")
    clue_records = lark.get_all_records(config["lark_base_token"], config["lark_sub_table_id"])
    logger.info(f"读取到 {len(clue_records)} 条线索记录")

    clues_by_case = group_clues_by_case(clue_records)

    logger.info("转换数据格式...")
    cases = []
    for i, record in enumerate(case_records, 1):
        record_id = record.get("record_id", "")
        clues = clues_by_case.get(record_id, [])
        case_data = transform_case_record(record, clues=clues, case_number=i)
        cases.append(case_data)

    logger.info("校验数据...")
    valid_cases, invalid_cases = validate_all_cases(cases, schema)
    logger.info(f"校验通过：{len(valid_cases)}，失败：{len(invalid_cases)}（失败案例将保留并标记为待完善）")

    if invalid_cases:
        error_log_path = os.path.join(config["errors_dir"], f"{datetime.now().strftime('%Y-%m-%d')}.log")
        os.makedirs(os.path.dirname(error_log_path), exist_ok=True)
        with open(error_log_path, "a", encoding="utf-8") as f:
            for item in invalid_cases:
                f.write(f"[{datetime.now().isoformat()}] {item['id']} {item['name']}: {'; '.join(item['errors'])}\n")

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
        from scripts.data_transformer import get_file_path

        existing_files = set(git_ops.get_tracked_case_files())
        written_files = set()

        # 写入校验通过的案例
        for case in valid_cases:
            rel_path = get_file_path(case)
            abs_path = os.path.join(config["cases_dir"], rel_path)

            if os.path.exists(abs_path):
                stats["updated"] += 1
                stats["updated_list"].append(f"{case['id']} {case['基本信息']['案件名称']}")
            else:
                stats["created"] += 1
                stats["created_list"].append(f"{case['id']} {case['基本信息']['案件名称']}")

            git_ops.write_case_file(case)
            written_files.add(f"cases/{rel_path.replace('\\', '/')}")

        # 写入校验失败的案例（标记为待完善，保留在cases目录，避免误归档）
        for item in invalid_cases:
            case = item["case"]
            if "元数据" not in case:
                case["元数据"] = {}
            case["元数据"]["录入状态"] = "待完善"
            case["元数据"]["校验错误"] = item["errors"]

            rel_path = get_file_path(case)
            abs_path = os.path.join(config["cases_dir"], rel_path)

            if os.path.exists(abs_path):
                stats["updated"] += 1
            else:
                stats["created"] += 1

            git_ops.write_case_file(case)
            written_files.add(f"cases/{rel_path.replace('\\', '/')}")
            logger.info(f"保留待完善案件: {item['name']}（{len(item['errors'])}个错误）")

        # 只有飞书Base中明确不存在的记录才归档
        deleted_files = existing_files - written_files
        for rel_path in deleted_files:
            parts = rel_path.replace("cases/", "").split("/")
            if len(parts) >= 3:
                source_type, region, filename = parts[0], parts[1], parts[2]
                case_name = filename.replace(".json", "")
                git_ops.archive_case_file(case_name, source_type, region)
                stats["archived"] += 1
                logger.info(f"归档删除案件（飞书中已不存在）: {case_name}")

        # 生成全量导出（包括待完善案例）
        all_cases = valid_cases + [item["case"] for item in invalid_cases]
        if all_cases:
            logger.info("生成全量导出...")
            exports_path = os.path.join(config["exports_dir"], "all_cases.json")
            os.makedirs(os.path.dirname(exports_path), exist_ok=True)
            with open(exports_path, "w", encoding="utf-8") as f:
                json.dump(all_cases, f, ensure_ascii=False, indent=2)

    report_path = os.path.join(config["reports_dir"], f"{datetime.now().strftime('%Y-%m-%d-%H%M')}.md")
    generate_report(stats, invalid_cases, report_path)
    logger.info(f"同步报告已生成: {report_path}")

    if not args.dry_run and git_ops.has_changes():
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        message = f"sync: 自动同步 {now}（新增{stats['created']}，更新{stats['updated']}，待完善{stats['invalid']}）"
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
    logger.info(f"同步完成：新增{stats['created']}，更新{stats['updated']}，归档{stats['archived']}，待完善{stats['invalid']}")
    logger.info("=" * 50)


if __name__ == "__main__":
    main()
