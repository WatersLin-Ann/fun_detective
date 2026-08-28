"""配置管理模块：从环境变量和 .env 文件读取配置。"""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv 未安装时跳过，依赖系统环境变量


def get_config() -> dict:
    """获取所有配置项，返回字典。"""
    repo_path = os.getenv("GIT_REPO_PATH", str(Path(__file__).parent.parent))

    return {
        # 飞书凭证
        "lark_app_id": os.getenv("LARK_APP_ID", ""),
        "lark_app_secret": os.getenv("LARK_APP_SECRET", ""),

        # 飞书 Base
        "lark_base_token": os.getenv("LARK_BASE_TOKEN", "NlZabSCWaa4NXbsUf1Wc6inQnjf"),
        "lark_main_table_id": os.getenv("LARK_MAIN_TABLE_ID", "tbl02kunLvM8fGow"),
        "lark_sub_table_id": os.getenv("LARK_SUB_TABLE_ID", "tblqyVU3YzPiw5IS"),

        # Git
        "git_repo_path": repo_path,
        "git_remote": os.getenv("GIT_REMOTE", "origin"),
        "git_branch": os.getenv("GIT_BRANCH", "main"),

        # 同步
        "sync_mode": os.getenv("SYNC_MODE", "incremental"),
        "log_level": os.getenv("LOG_LEVEL", "INFO"),

        # 目录
        "cases_dir": os.path.join(repo_path, "cases"),
        "archive_dir": os.path.join(repo_path, "archive"),
        "schema_dir": os.path.join(repo_path, "schema"),
        "exports_dir": os.path.join(repo_path, "exports"),
        "reports_dir": os.path.join(repo_path, "reports"),
        "errors_dir": os.path.join(repo_path, "errors"),
    }


def validate_config(config: dict) -> list:
    """校验配置完整性，返回错误信息列表（空列表表示通过）。"""
    errors = []
    if not config["lark_app_id"]:
        errors.append("LARK_APP_ID 未设置")
    if not config["lark_app_secret"]:
        errors.append("LARK_APP_SECRET 未设置")
    if not config["lark_base_token"]:
        errors.append("LARK_BASE_TOKEN 未设置")
    if not config["lark_main_table_id"]:
        errors.append("LARK_MAIN_TABLE_ID 未设置")
    if not os.path.isdir(config["git_repo_path"]):
        errors.append(f"GIT_REPO_PATH 不存在: {config['git_repo_path']}")
    return errors
