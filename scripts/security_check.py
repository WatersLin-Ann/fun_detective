#!/usr/bin/env python3
"""
Fun Detective 安全与质量检查脚本
用于 GitHub Actions CI 检查，包含：
1. 禁止提交的文件检查
2. 敏感信息扫描
3. 案件数据 JSON 格式验证
4. 大文件检查
"""
import os
import re
import sys
import json


# ============================================
# 配置
# ============================================

# 禁止提交的文件名模式（相对路径，使用 fnmatch 或正则）
FORBIDDEN_PATTERNS = [
    r"^\.env$",
    r"^\.env\.local$",
    r"^\.env\..*\.local$",
    r"\.log$",
    r"^\.astro/",
    r"^dist/",
    r"^node_modules/",
    r"(^|/)temp_",
]

# 敏感信息正则模式
SENSITIVE_PATTERNS = [
    (r"LARK_APP_SECRET\s*=\s*[A-Za-z0-9]{20,}", "LARK_APP_SECRET"),
    (r"LARK_APP_ID\s*=\s*cli_[A-Za-z0-9]{10,}", "LARK_APP_ID"),
    (r"LARK_BASE_TOKEN\s*=\s*[A-Za-z0-9]{15,}", "LARK_BASE_TOKEN"),
    (r"LARK_MAIN_TABLE_ID\s*=\s*tbl[A-Za-z0-9]{10,}", "LARK_MAIN_TABLE_ID"),
    (r"LARK_SUB_TABLE_ID\s*=\s*tbl[A-Za-z0-9]{10,}", "LARK_SUB_TABLE_ID"),
    (r"NlZab[A-Za-z0-9]{15,}", "飞书 Base Token（硬编码）"),
    (r"AKIA[0-9A-Z]{16}", "AWS Access Key"),
    (r"AIza[0-9A-Za-z\-_]{35}", "Google API Key"),
    (r"BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY", "Private Key"),
]

# 占位符模式（匹配这些的不算敏感信息泄露）
PLACEHOLDER_PATTERNS = [
    r"x{10,}",
    r"your_",
    r"example",
    r"placeholder",
    r"占位",
    r"替换",
    r"xxxxxxxx",
]

# 跳过的目录
SKIP_DIRS = {".git", "node_modules", ".venv", "venv", "env", "__pycache__"}

# 跳过的文件扩展名（二进制文件）
SKIP_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp",
    ".mp4", ".webm", ".mp3", ".wav", ".ogg",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".zip", ".tar", ".gz", ".rar",
    ".pyc", ".pyo",
}

# 大文件阈值（字节）
LARGE_FILE_THRESHOLD = 1024 * 1024  # 1MB

# 媒体文件扩展名（大文件检查时只警告不报错）
MEDIA_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico",
    ".mp4", ".webm", ".mp3", ".wav",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".pdf", ".zip",
}


# ============================================
# 工具函数
# ============================================

def get_all_files(root="."):
    """获取所有 git 跟踪的文件（优先使用 git ls-files，避免扫描 .gitignore 中的本地文件）"""
    files = []

    # 优先使用 git ls-files 获取已跟踪文件
    try:
        import subprocess
        result = subprocess.run(
            ["git", "ls-files"],
            capture_output=True,
            text=True,
            cwd=root,
            timeout=10,
        )
        if result.returncode == 0:
            for line in result.stdout.strip().split("\n"):
                if line:
                    filepath = line.replace("\\", "/")
                    files.append(filepath)
            return files
    except Exception:
        pass

    # 回退：使用 os.walk（跳过指定目录）
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            filepath = filepath.replace("\\", "/")
            if filepath.startswith("./"):
                filepath = filepath[2:]
            files.append(filepath)
    return files


def is_placeholder(value):
    """检查值是否为占位符"""
    for pattern in PLACEHOLDER_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            return True
    return False


def is_text_file(filepath):
    """简单判断是否为文本文件（基于扩展名）"""
    ext = os.path.splitext(filepath)[1].lower()
    if ext in SKIP_EXTENSIONS:
        return False
    # 无扩展名的文件也尝试读取
    return True


# ============================================
# 检查项
# ============================================

def check_forbidden_files(files):
    """检查禁止提交的文件"""
    print("=== 检查禁止提交的文件 ===")
    forbidden = []
    for filepath in files:
        for pattern in FORBIDDEN_PATTERNS:
            if re.search(pattern, filepath):
                # .env.example 是允许的
                if filepath == ".env.example":
                    continue
                forbidden.append(filepath)
                break

    if forbidden:
        print(f"::error::发现 {len(forbidden)} 个禁止提交的文件:")
        for f in forbidden:
            print(f"  {f}")
        return False
    else:
        print("✓ 无禁止提交的文件")
        return True


def scan_sensitive_information(files):
    """扫描敏感信息"""
    print("\n=== 扫描敏感信息 ===")
    findings = []

    for filepath in files:
        # 跳过 .env.example（占位符示例）
        if filepath.endswith(".example"):
            continue

        # 只检查文本文件
        if not is_text_file(filepath):
            continue

        # 读取文件内容
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except Exception:
            continue

        # 检查每个敏感模式
        for pattern, name in SENSITIVE_PATTERNS:
            matches = re.findall(pattern, content)
            for match in matches:
                # 检查是否为占位符
                if is_placeholder(match):
                    continue
                # 检查所在行是否包含占位符关键词
                for line in content.split("\n"):
                    if match in line and is_placeholder(line):
                        break
                else:
                    findings.append(f"{filepath} ({name})")
                    break  # 每个文件每个模式只报告一次

    if findings:
        print(f"::error::发现 {len(findings)} 处可能的敏感信息:")
        for f in findings:
            print(f"  {f}")
        return False
    else:
        print("✓ 未发现敏感信息")
        return True


def validate_case_json():
    """验证案件数据 JSON 格式"""
    print("\n=== 验证案件数据 JSON 格式 ===")
    errors = []
    count = 0

    if not os.path.isdir("cases"):
        print("✓ cases 目录不存在，跳过 JSON 验证")
        return True

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
        return False
    else:
        print("✓ 所有案件数据 JSON 格式正确")
        return True


def check_large_files(files):
    """检查大文件"""
    print("\n=== 检查大文件 ===")
    large_files = []
    warnings = []

    for filepath in files:
        try:
            size = os.path.getsize(filepath)
        except OSError:
            continue

        if size > LARGE_FILE_THRESHOLD:
            ext = os.path.splitext(filepath)[1].lower()
            size_mb = size / (1024 * 1024)
            if ext in MEDIA_EXTENSIONS:
                warnings.append(f"{filepath} ({size_mb:.2f}MB, 媒体文件)")
            else:
                large_files.append(f"{filepath} ({size_mb:.2f}MB)")

    if warnings:
        print(f"::warning::发现 {len(warnings)} 个大媒体文件:")
        for w in warnings:
            print(f"  {w}")

    if large_files:
        print(f"::error::发现 {len(large_files)} 个超过 1MB 的非媒体文件:")
        for f in large_files:
            print(f"  {f}")
        return False
    else:
        print("✓ 无超过 1MB 的非媒体文件")
        return True


# ============================================
# 主函数
# ============================================

def main():
    print("=" * 50)
    print("  Fun Detective 安全与质量检查")
    print("=" * 50)
    print()

    # 获取所有文件
    files = get_all_files(".")
    print(f"共扫描 {len(files)} 个文件")
    print()

    # 执行各项检查
    results = []
    results.append(("禁止文件检查", check_forbidden_files(files)))
    results.append(("敏感信息扫描", scan_sensitive_information(files)))
    results.append(("JSON 格式验证", validate_case_json()))
    results.append(("大文件检查", check_large_files(files)))

    # 总结
    print("\n" + "=" * 50)
    print("  检查结果总结")
    print("=" * 50)

    all_passed = True
    for name, passed in results:
        status = "✓ 通过" if passed else "✗ 失败"
        print(f"  {name}: {status}")
        if not passed:
            all_passed = False

    print("=" * 50)

    if all_passed:
        print("\n✓ 所有检查通过")
        sys.exit(0)
    else:
        print("\n✗ 存在未通过的检查，请修复后重新提交")
        sys.exit(1)


if __name__ == "__main__":
    main()
