"""数据校验模块测试。"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.data_validator import validate_case


def _make_valid_case():
    return {
        "id": "case-001",
        "基本信息": {
            "案件名称": "测试案件",
            "来源类型": "虚构推理",
            "地区": "日本",
            "一句话简介": "测试"
        },
        "故事视图": {},
        "设计视图": {
            "难度评分": {"线索密度": 3.0, "误导数量": 3.0, "诡计隐蔽度": 3.0, "综合": 3.0}
        },
        "游戏设计": {},
        "元数据": {"录入状态": "完整", "录入日期": "2026-08-28", "最后更新": "2026-08-28"}
    }


def test_valid_case_passes():
    case = _make_valid_case()
    is_valid, errors = validate_case(case)
    assert is_valid is True
    assert errors == []


def test_missing_required_field():
    case = _make_valid_case()
    case["基本信息"]["案件名称"] = ""
    is_valid, errors = validate_case(case)
    assert is_valid is False
    assert any("案件名称" in e for e in errors)


def test_invalid_enum():
    case = _make_valid_case()
    case["基本信息"]["来源类型"] = "非法类型"
    is_valid, errors = validate_case(case)
    assert is_valid is False
    assert any("来源类型" in e for e in errors)


def test_difficulty_out_of_range():
    case = _make_valid_case()
    case["设计视图"]["难度评分"]["线索密度"] = 9.0
    is_valid, errors = validate_case(case)
    assert is_valid is False
    assert any("线索密度" in e for e in errors)


def test_difficulty_avg_mismatch():
    case = _make_valid_case()
    case["设计视图"]["难度评分"] = {"线索密度": 5.0, "误导数量": 1.0, "诡计隐蔽度": 3.0, "综合": 5.0}
    is_valid, errors = validate_case(case)
    assert is_valid is False
    assert any("综合分计算错误" in e for e in errors)


def test_game_case_requires_platform():
    case = _make_valid_case()
    case["基本信息"]["来源类型"] = "游戏案例"
    is_valid, errors = validate_case(case)
    assert is_valid is False
    assert any("游戏平台" in e for e in errors)


def test_valid_game_case():
    case = _make_valid_case()
    case["基本信息"]["来源类型"] = "游戏案例"
    case["游戏设计"]["游戏平台"] = ["Switch"]
    case["游戏设计"]["玩法类型"] = ["文字冒险"]
    is_valid, errors = validate_case(case)
    assert is_valid is True
