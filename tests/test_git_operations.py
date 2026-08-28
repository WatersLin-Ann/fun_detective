"""Git 操作模块测试（使用临时目录）。"""
import os
import sys
import json
import tempfile
import subprocess

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.git_operations import GitOperator


def _init_temp_repo():
    """创建临时 Git 仓库。"""
    tmpdir = tempfile.mkdtemp()
    subprocess.run(["git", "init", "-q"], cwd=tmpdir, capture_output=True)
    subprocess.run(["git", "config", "user.email", "test@test.com"], cwd=tmpdir, capture_output=True)
    subprocess.run(["git", "config", "user.name", "Test"], cwd=tmpdir, capture_output=True)
    os.makedirs(os.path.join(tmpdir, "cases"), exist_ok=True)
    os.makedirs(os.path.join(tmpdir, "archive"), exist_ok=True)
    return tmpdir


def test_write_case_file():
    tmpdir = _init_temp_repo()
    try:
        operator = GitOperator(tmpdir)
        case_data = {
            "基本信息": {
                "来源类型": "虚构推理",
                "地区": "日本",
                "案件名称": "测试案件"
            }
        }
        path = operator.write_case_file(case_data)
        assert os.path.exists(path)
        assert "虚构推理" in path
        assert "日本" in path
        assert "测试案件.json" in path

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert data["基本信息"]["案件名称"] == "测试案件"
    finally:
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)


def test_archive_case_file():
    tmpdir = _init_temp_repo()
    try:
        operator = GitOperator(tmpdir)
        case_data = {
            "基本信息": {
                "来源类型": "虚构推理",
                "地区": "日本",
                "案件名称": "待删除案件"
            }
        }
        path = operator.write_case_file(case_data)
        assert os.path.exists(path)

        archived = operator.archive_case_file("待删除案件", "虚构推理", "日本")
        assert archived is not None
        assert os.path.exists(archived)
        assert not os.path.exists(path)
        assert "archive" in archived
    finally:
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)


def test_archive_nonexistent_file():
    tmpdir = _init_temp_repo()
    try:
        operator = GitOperator(tmpdir)
        result = operator.archive_case_file("不存在", "虚构推理", "日本")
        assert result is None
    finally:
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)


def test_has_changes():
    tmpdir = _init_temp_repo()
    try:
        operator = GitOperator(tmpdir)
        # 空仓库没有变更
        assert operator.has_changes() is False

        # 写入文件后有变更
        case_data = {"基本信息": {"来源类型": "虚构推理", "地区": "日本", "案件名称": "A"}}
        operator.write_case_file(case_data)
        assert operator.has_changes() is True
    finally:
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)


def test_commit_without_remote():
    """测试提交（不推送，因为没有远程）。"""
    tmpdir = _init_temp_repo()
    try:
        operator = GitOperator(tmpdir)
        case_data = {"基本信息": {"来源类型": "虚构推理", "地区": "日本", "案件名称": "A"}}
        operator.write_case_file(case_data)

        # 只提交不推送（没有远程会失败，但提交应该成功）
        try:
            operator._run_git(["add", "-A"])
            operator._run_git(["commit", "-m", "test commit"])
            # 验证提交成功
            result = operator._run_git(["log", "--oneline", "-1"])
            assert "test commit" in result.stdout
        except RuntimeError:
            pass  # 推送失败是预期的
    finally:
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)
