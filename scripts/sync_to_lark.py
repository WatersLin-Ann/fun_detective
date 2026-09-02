import sys
import os
import json
import time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding='utf-8')

from scripts.config import get_config
from scripts.lark_client import LarkClient
import requests

config = get_config()
lark = LarkClient(config["lark_app_id"], config["lark_app_secret"])
BASE_URL = lark.BASE_URL
headers = lark._get_headers()

base_token = config["lark_base_token"]
table_id = config["lark_main_table_id"]
cases_dir = config["cases_dir"]

# ============================================================
# 步骤1：确保"推荐视频"字段存在
# ============================================================
print("=" * 60)
print("步骤1：检查并创建'推荐视频'字段")
print("=" * 60)

fields_url = f"{BASE_URL}/bitable/v1/apps/{base_token}/tables/{table_id}/fields"
resp = requests.get(fields_url, headers=headers, params={"page_size": 100}, timeout=30)
fields_data = resp.json()
existing_fields = [f["field_name"] for f in fields_data.get("data", {}).get("items", [])]

if "推荐视频" in existing_fields:
    print("  ✓ '推荐视频'字段已存在")
else:
    print("  创建'推荐视频'字段...")
    create_url = f"{BASE_URL}/bitable/v1/apps/{base_token}/tables/{table_id}/fields"
    create_body = {
        "field_name": "推荐视频",
        "type": 1,  # Text
        "ui_type": "Text"
    }
    resp = requests.post(create_url, headers=headers, json=create_body, timeout=30)
    result = resp.json()
    if result.get("code") == 0:
        print("  ✓ '推荐视频'字段创建成功")
    else:
        print(f"  ✗ 创建失败: {result.get('msg')}")
        sys.exit(1)

# ============================================================
# 步骤2：读取飞书所有记录
# ============================================================
print("\n" + "=" * 60)
print("步骤2：读取飞书Base记录")
print("=" * 60)

lark_records = lark.get_all_records(base_token, table_id, page_size=100)
print(f"  读取到 {len(lark_records)} 条飞书记录")

# 建立案件名称 -> record_id 映射
name_to_record = {}
for r in lark_records:
    name = r.get("fields", {}).get("案件名称", "")
    if name:
        name_to_record[name.strip()] = r.get("record_id", "")

print(f"  有效案件名称映射: {len(name_to_record)} 条")

# ============================================================
# 步骤3：读取本地所有案件
# ============================================================
print("\n" + "=" * 60)
print("步骤3：读取本地案件JSON")
print("=" * 60)

local_cases = {}
for root, dirs, files in os.walk(cases_dir):
    for fname in files:
        if not fname.endswith('.json'):
            continue
        fpath = os.path.join(root, fname)
        try:
            with open(fpath, encoding='utf-8') as f:
                d = json.load(f)
            name = d.get("基本信息", {}).get("案件名称", "").strip()
            if name:
                local_cases[name] = d
        except Exception as e:
            print(f"  读取失败: {fname} - {e}")

print(f"  读取到 {len(local_cases)} 个本地案件")

# ============================================================
# 步骤4：匹配并准备更新数据
# ============================================================
print("\n" + "=" * 60)
print("步骤4：匹配案件并准备更新")
print("=" * 60)

matched = []
unmatched_lark = []
unmatched_local = []

for lark_name, record_id in name_to_record.items():
    if lark_name in local_cases:
        matched.append((lark_name, record_id, local_cases[lark_name]))
    else:
        # 尝试模糊匹配（去除空格、标点）
        found = False
        for local_name in local_cases:
            if local_name.replace(" ", "").replace("　", "") == lark_name.replace(" ", "").replace("　", ""):
                matched.append((lark_name, record_id, local_cases[local_name]))
                found = True
                break
        if not found:
            unmatched_lark.append(lark_name)

matched_names = set(m[0] for m in matched)
for local_name in local_cases:
    if local_name not in matched_names:
        unmatched_local.append(local_name)

print(f"  匹配成功: {len(matched)} 条")
print(f"  飞书有但本地无: {len(unmatched_lark)} 条")
if unmatched_lark:
    for n in unmatched_lark[:10]:
        print(f"    - {n}")
print(f"  本地有但飞书无: {len(unmatched_local)} 条（不同步，仅更新飞书已有记录）")

# ============================================================
# 步骤5：批量更新飞书记录
# ============================================================
print("\n" + "=" * 60)
print("步骤5：批量更新飞书记录")
print("=" * 60)

update_url = f"{BASE_URL}/bitable/v1/apps/{base_token}/tables/{table_id}/records/batch_update"
success_count = 0
fail_count = 0
fail_details = []

# 分批更新，每批最多50条
batch_size = 50
for i in range(0, len(matched), batch_size):
    batch = matched[i:i+batch_size]
    records_batch = []
    
    for lark_name, record_id, case_data in batch:
        ref_links = case_data.get("基本信息", {}).get("参考链接", [])
        videos = case_data.get("基本信息", {}).get("推荐视频", [])
        
        fields = {}
        if ref_links:
            fields["参考链接"] = json.dumps(ref_links, ensure_ascii=False)
        if videos:
            fields["推荐视频"] = json.dumps(videos, ensure_ascii=False)
        
        if fields:
            records_batch.append({
                "record_id": record_id,
                "fields": fields
            })
    
    if not records_batch:
        continue
    
    body = {"records": records_batch}
    try:
        resp = requests.post(update_url, headers=headers, json=body, timeout=60)
        result = resp.json()
        if result.get("code") == 0:
            success_count += len(records_batch)
            print(f"  批次 {i//batch_size + 1}: ✓ 更新 {len(records_batch)} 条")
        else:
            fail_count += len(records_batch)
            fail_details.append(f"批次 {i//batch_size + 1}: {result.get('msg')}")
            print(f"  批次 {i//batch_size + 1}: ✗ 失败 - {result.get('msg')}")
    except Exception as e:
        fail_count += len(records_batch)
        fail_details.append(f"批次 {i//batch_size + 1}: {str(e)}")
        print(f"  批次 {i//batch_size + 1}: ✗ 异常 - {e}")
    
    # 避免触发限流
    time.sleep(1)

# ============================================================
# 步骤6：输出同步报告
# ============================================================
print("\n" + "=" * 60)
print("同步完成")
print("=" * 60)
print(f"  飞书记录总数: {len(lark_records)}")
print(f"  匹配成功: {len(matched)}")
print(f"  更新成功: {success_count}")
print(f"  更新失败: {fail_count}")
if fail_details:
    print("  失败详情:")
    for d in fail_details:
        print(f"    - {d}")

# 保存报告
report = {
    "sync_time": time.strftime("%Y-%m-%d %H:%M:%S"),
    "lark_total": len(lark_records),
    "matched": len(matched),
    "success": success_count,
    "failed": fail_count,
    "fail_details": fail_details,
    "unmatched_lark": unmatched_lark,
    "unmatched_local_count": len(unmatched_local),
    "updated_fields": ["参考链接", "推荐视频"]
}

report_path = os.path.join(config["reports_dir"], f"lark_sync_back_{time.strftime('%Y%m%d_%H%M%S')}.json")
os.makedirs(os.path.dirname(report_path), exist_ok=True)
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print(f"\n  报告已保存: {report_path}")
