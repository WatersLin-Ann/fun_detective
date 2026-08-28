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
