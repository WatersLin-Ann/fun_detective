import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding='utf-8')

from scripts.config import get_config
from scripts.lark_client import LarkClient

config = get_config()
print(f"BASE_TOKEN: {config['lark_base_token'][:10]}...")
print(f"MAIN_TABLE_ID: {config['lark_main_table_id']}")
print(f"SUB_TABLE_ID: {config['lark_sub_table_id']}")

lark = LarkClient(config["lark_app_id"], config["lark_app_secret"])

try:
    records = lark.get_all_records(config["lark_base_token"], config["lark_main_table_id"], page_size=5)
    print(f"\n成功读取 {len(records)} 条记录")
    for r in records[:3]:
        name = r.get("fields", {}).get("案件名称", "未命名")
        rid = r.get("record_id", "")
        print(f"  - {name} (record_id: {rid})")
except Exception as e:
    print(f"\n读取失败: {e}")
