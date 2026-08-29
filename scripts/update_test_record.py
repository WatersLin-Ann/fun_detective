"""更新飞书 Base 中的测试记录，用于验证增量同步。"""
import os
import sys
import json
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.config import get_config
from scripts.lark_client import LarkClient

config = get_config()
client = LarkClient(config["lark_app_id"], config["lark_app_secret"])
token = client._get_tenant_access_token()

record_id = "recvtE50RdimM9"
url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{config['lark_base_token']}/tables/{config['lark_main_table_id']}/records/{record_id}"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

payload = {
    "fields": {
        "一句话简介": "已更新的测试简介-用于验证增量同步",
        "故事摘要": "这是更新后的故事摘要。"
    }
}

resp = requests.put(url, headers=headers, json=payload)
print(f"状态码: {resp.status_code}")
print(f"响应: {json.dumps(resp.json(), ensure_ascii=False, indent=2)}")
