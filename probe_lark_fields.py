import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding='utf-8')

from scripts.config import get_config
from scripts.lark_client import LarkClient
import requests

config = get_config()
lark = LarkClient(config["lark_app_id"], config["lark_app_secret"])

# 获取表字段列表
url = f"{lark.BASE_URL}/bitable/v1/apps/{config['lark_base_token']}/tables/{config['lark_main_table_id']}/fields"
headers = lark._get_headers()
resp = requests.get(url, headers=headers, params={"page_size": 100}, timeout=30)
data = resp.json()

if data.get("code") != 0:
    print(f"获取字段失败: {data.get('msg')}")
    sys.exit(1)

fields = data.get("data", {}).get("items", [])
print(f"飞书Base主表共有 {len(fields)} 个字段：")
print("=" * 60)
for f in fields:
    field_name = f.get("field_name", "")
    field_type = f.get("type", "")
    ui_type = f.get("ui_type", "")
    print(f"  - {field_name} (type={field_type}, ui_type={ui_type})")

# 检查是否有参考链接和推荐视频字段
has_ref = any(f.get("field_name") == "参考链接" for f in fields)
has_video = any(f.get("field_name") == "推荐视频" for f in fields)
print("=" * 60)
print(f"有'参考链接'字段: {has_ref}")
print(f"有'推荐视频'字段: {has_video}")

# 读取前3条记录，看看参考链接字段的实际存储格式
print("\n" + "=" * 60)
print("前3条记录的参考链接字段样例：")
records = lark.get_all_records(config["lark_base_token"], config["lark_main_table_id"], page_size=3)
for i, r in enumerate(records[:3], 1):
    name = r.get("fields", {}).get("案件名称", "未命名")
    ref = r.get("fields", {}).get("参考链接", "")
    print(f"\n  [{i}] {name}")
    print(f"      参考链接类型: {type(ref).__name__}")
    ref_str = str(ref)[:200]
    print(f"      参考链接内容: {ref_str}")
