"""配置管理模块测试。"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.config import get_config, validate_config


def test_get_config_returns_dict():
    config = get_config()
    assert isinstance(config, dict)
    assert "lark_app_id" in config
    assert "lark_base_token" in config
    assert "cases_dir" in config


def test_get_config_default_values():
    # 测试前清除飞书相关环境变量，确保测试的是默认值
    for key in ["LARK_APP_ID", "LARK_APP_SECRET", "LARK_BASE_TOKEN",
                "LARK_MAIN_TABLE_ID", "LARK_SUB_TABLE_ID"]:
        os.environ.pop(key, None)

    config = get_config()

    # 敏感凭证不应该有硬编码默认值，必须通过环境变量配置
    assert config["lark_base_token"] == ""
    assert config["lark_main_table_id"] == ""
    assert config["lark_sub_table_id"] == ""

    # 非敏感配置可以有默认值
    assert config["git_remote"] == "origin"
    assert config["git_branch"] == "main"
    assert config["sync_mode"] == "incremental"


def test_get_config_directory_paths():
    config = get_config()
    assert config["cases_dir"].endswith("cases")
    assert config["archive_dir"].endswith("archive")
    assert config["schema_dir"].endswith("schema")
    assert config["exports_dir"].endswith("exports")


def test_validate_config_returns_list():
    config = get_config()
    errors = validate_config(config)
    assert isinstance(errors, list)
    # 在没有设置 LARK_APP_ID 的测试环境中，应该返回错误
    # 但 git_repo_path 应该存在
    if not config["lark_app_id"]:
        assert any("LARK_APP_ID" in e for e in errors)
