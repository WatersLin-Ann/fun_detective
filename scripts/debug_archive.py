"""调试删除归档逻辑。"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.config import get_config
from scripts.git_operations import GitOperator

config = get_config()
git_ops = GitOperator(config["git_repo_path"], config["git_remote"], config["git_branch"])

print("=== get_tracked_case_files() 返回值 ===")
tracked = git_ops.get_tracked_case_files()
for f in tracked:
    print(f"  '{f}'")
print(f"总数: {len(tracked)}")

print("\n=== 模拟删除逻辑 ===")
written_files = set()  # 飞书中没有记录，所以 written_files 为空
deleted_files = set(tracked) - written_files
print(f"deleted_files: {deleted_files}")

print("\n=== 路径解析 ===")
for rel_path in deleted_files:
    print(f"原始路径: '{rel_path}'")
    parts = rel_path.replace("cases/", "").split("/")
    print(f"  parts: {parts}")
    print(f"  len(parts): {len(parts)}")
    if len(parts) >= 3:
        source_type, region, filename = parts[0], parts[1], parts[2]
        case_name = filename.replace(".json", "")
        print(f"  source_type: {source_type}")
        print(f"  region: {region}")
        print(f"  case_name: {case_name}")

        # 检查源文件是否存在
        src = os.path.join(config["cases_dir"], source_type, region, f"{case_name}.json")
        print(f"  源文件存在: {os.path.exists(src)} -> {src}")
