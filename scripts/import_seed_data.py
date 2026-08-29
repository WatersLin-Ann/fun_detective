"""将种子数据转换为 lark-cli batch-create 格式并导入。"""
import json
import os
import subprocess
import sys
from datetime import datetime

SEED_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "seed_cases.json")
BASE_TOKEN = "NlZabSCWaa4NXbsUf1Wc6inQnjf"
TABLE_ID = "tbl02kunLvM8fGow"

def main():
    with open(SEED_FILE, "r", encoding="utf-8") as f:
        cases = json.load(f)

    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    create_records = []

    # 多选字段列表（这些字段需要飞书 Base 中已有选项，先留空，后续补充）
    multi_select_fields = ["诡计类型", "可复用机制", "游戏平台", "玩法类型", "核心玩法机制", "可复用游戏模板"]

    # 年代字段映射（飞书 Base 中的选项）
    era_mapping = {
        "1880s": "古典（1900前）",
        "1930s": "近现代（1900-1980）",
        "2000s": "当代（1980后）",
    }

    # 案件状态映射
    status_mapping = {
        "未破案": "悬案",
    }

    # 来源类型映射
    source_mapping = {
        "虚构推理": "推理小说",
        "游戏案例": "游戏",
        "影视综艺": "影视",
    }

    for case in cases:
        record = dict(case)
        record["录入日期"] = now
        record["最后更新"] = now
        # 年代字段映射
        if record.get("年代") in era_mapping:
            record["年代"] = era_mapping[record["年代"]]
        # 案件状态映射
        if record.get("案件状态") in status_mapping:
            record["案件状态"] = status_mapping[record["案件状态"]]
        # 来源类型映射
        if record.get("来源类型") in source_mapping:
            record["来源类型"] = source_mapping[record["来源类型"]]
        # 多选字段先设为空，避免选项不存在导致导入失败
        for field in multi_select_fields:
            if field in record:
                record[field] = []
        create_records.append(record)

    payload = {"create_records": create_records}
    payload_file = os.path.join(os.path.dirname(__file__), "..", "data", "batch_import.json")

    with open(payload_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"准备导入 {len(create_records)} 条记录...")

    cmd = [
        "lark-cli", "base", "+record-batch-create",
        "--base-token", BASE_TOKEN,
        "--table-id", TABLE_ID,
        "--json", "@./data/batch_import.json",
        "--as", "user"
    ]

    repo_root = os.path.join(os.path.dirname(__file__), "..")
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", cwd=repo_root)
    print("STDOUT:", result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)

    try:
        resp = json.loads(result.stdout)
        if resp.get("ok"):
            record_ids = resp.get("data", {}).get("record_id_list", [])
            print(f"\n✅ 成功导入 {len(record_ids)} 条记录")
            for i, rid in enumerate(record_ids, 1):
                print(f"  {i}. {rid} - {cases[i-1]['案件名称']}")
        else:
            print(f"\n❌ 导入失败: {resp.get('error', {}).get('message', '未知错误')}")
    except:
        print("\n❌ 无法解析响应")

if __name__ == "__main__":
    main()
