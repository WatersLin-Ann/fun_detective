#!/usr/bin/env python3
"""
验证 cases/ 目录下所有案件 JSON 文件的格式是否正确。
用于 GitHub Actions CI 检查。
"""
import json
import os
import sys


def main():
    errors = []
    count = 0

    for root, dirs, files in os.walk("cases"):
        for f in files:
            if f.endswith(".json"):
                count += 1
                path = os.path.join(root, f)
                try:
                    with open(path, "r", encoding="utf-8") as fp:
                        json.load(fp)
                except Exception as e:
                    errors.append(f"{path}: {e}")

    print(f"共检查 {count} 个案件 JSON 文件")

    if errors:
        print(f"::error::发现 {len(errors)} 个 JSON 格式错误:")
        for e in errors:
            print(f"  {e}")
        sys.exit(1)
    else:
        print("✓ 所有案件数据 JSON 格式正确")


if __name__ == "__main__":
    main()
