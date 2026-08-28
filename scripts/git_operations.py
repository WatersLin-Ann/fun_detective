"""Git 操作封装：使用 subprocess 调用 git 命令。"""
import os
import json
import shutil
import subprocess
from datetime import datetime
from typing import Dict, List, Optional


class GitOperator:
    """Git 仓库操作封装（基于 subprocess 调用 git CLI）。"""

    def __init__(self, repo_path: str, remote: str = "origin", branch: str = "main"):
        self.repo_path = repo_path
        self.remote = remote
        self.branch = branch

    def _run_git(self, args: List[str], check: bool = True) -> subprocess.CompletedProcess:
        """运行 git 命令。"""
        cmd = ["git"] + args
        result = subprocess.run(
            cmd, cwd=self.repo_path, capture_output=True, text=True, encoding="utf-8"
        )
        if check and result.returncode != 0:
            raise RuntimeError(f"git {' '.join(args)} 失败: {result.stderr.strip()}")
        return result

    def write_case_file(self, case_data: Dict) -> str:
        """写入案件 JSON 文件，返回绝对路径。"""
        from scripts.data_transformer import get_file_path

        rel_path = get_file_path(case_data)
        abs_path = os.path.join(self.repo_path, "cases", rel_path)

        os.makedirs(os.path.dirname(abs_path), exist_ok=True)

        with open(abs_path, "w", encoding="utf-8") as f:
            json.dump(case_data, f, ensure_ascii=False, indent=2)

        return abs_path

    def archive_case_file(self, case_name: str, source_type: str, region: str) -> Optional[str]:
        """将案件文件移入 archive 目录（不直接删除）。"""
        from scripts.data_transformer import _sanitize_filename

        safe_name = _sanitize_filename(case_name)
        src = os.path.join(self.repo_path, "cases", source_type, region, f"{safe_name}.json")
        if not os.path.exists(src):
            return None

        archive_dir = os.path.join(self.repo_path, "archive", source_type, region)
        os.makedirs(archive_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        dst = os.path.join(archive_dir, f"{safe_name}_{timestamp}.json")
        shutil.move(src, dst)
        return dst

    def get_tracked_case_files(self) -> List[str]:
        """获取 Git 已跟踪的所有案件文件相对路径。"""
        result = self._run_git(["ls-files", "cases/"], check=False)
        if result.returncode != 0:
            return []
        files = result.stdout.strip().split("\n")
        return [f for f in files if f.endswith(".json")]

    def has_changes(self) -> bool:
        """检查工作区是否有未提交的变更。"""
        result = self._run_git(["status", "--porcelain"], check=False)
        return bool(result.stdout.strip())

    def commit_and_push(self, message: str) -> bool:
        """提交所有变更并推送到远程。"""
        try:
            self._run_git(["add", "-A"])

            # 检查是否有暂存的变更
            diff_result = self._run_git(["diff", "--cached", "--quiet"], check=False)
            if diff_result.returncode == 0:
                print("没有需要提交的变更")
                return False

            self._run_git(["commit", "-m", message])
            self._run_git(["push", self.remote, self.branch])

            print(f"提交并推送成功: {message}")
            return True

        except RuntimeError as e:
            print(f"Git 操作失败: {e}")
            return False

    def pull_latest(self) -> bool:
        """拉取远程最新代码（rebase 模式）。"""
        try:
            self._run_git(["pull", "--rebase", self.remote, self.branch])
            return True
        except RuntimeError as e:
            print(f"Git pull 失败: {e}")
            return False
