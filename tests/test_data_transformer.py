"""数据转换模块测试。"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.data_transformer import (
    transform_case_record, transform_clue_record,
    get_file_path, group_clues_by_case, _sanitize_filename
)


def test_transform_case_record_basic():
    record = {
        "record_id": "recTEST001",
        "fields": {
            "案件名称": "测试案件",
            "来源类型": [{"text": "虚构推理"}],
            "地区": [{"text": "日本"}],
            "一句话简介": "测试简介",
            "难度-线索密度": 3.5,
            "难度-误导数量": 2.0,
            "难度-诡计隐蔽度": 4.0,
        }
    }
    result = transform_case_record(record, case_number=1)
    assert result["id"] == "case-001"
    assert result["基本信息"]["案件名称"] == "测试案件"
    assert result["基本信息"]["来源类型"] == "虚构推理"
    assert result["设计视图"]["难度评分"]["综合"] == 3.2
    assert result["元数据"]["飞书记录ID"] == "recTEST001"


def test_transform_case_record_with_clues():
    record = {"record_id": "rec001", "fields": {"案件名称": "A"}}
    clues = [{"线索编号": "NO.001", "线索内容": "线索1"}]
    result = transform_case_record(record, clues=clues, case_number=5)
    assert result["id"] == "case-005"
    assert len(result["设计视图"]["线索链"]) == 1
    assert result["设计视图"]["线索链"][0]["线索内容"] == "线索1"


def test_transform_case_record_game_fields():
    record = {
        "record_id": "rec002",
        "fields": {
            "案件名称": "游戏案件",
            "来源类型": [{"text": "游戏案例"}],
            "地区": [{"text": "日本"}],
            "一句话简介": "测试",
            "游戏平台": [{"text": "Switch"}, {"text": "PC"}],
            "玩法类型": [{"text": "文字冒险"}],
        }
    }
    result = transform_case_record(record, case_number=2)
    assert result["游戏设计"]["游戏平台"] == ["Switch", "PC"]
    assert result["游戏设计"]["玩法类型"] == ["文字冒险"]


def test_get_file_path():
    case_data = {
        "基本信息": {
            "来源类型": "虚构推理",
            "地区": "日本",
            "案件名称": "嫌疑人X的献身"
        }
    }
    path = get_file_path(case_data)
    assert path == "虚构推理/日本/嫌疑人X的献身.json"


def test_sanitize_filename():
    assert _sanitize_filename('test:file?name') == 'testfilename'
    assert _sanitize_filename('  normal  ') == 'normal'
    assert _sanitize_filename('') == '未命名'


def test_group_clues_by_case():
    clues = [
        {"record_id": "c1", "fields": {
            "线索内容": "线索1",
            "关联案件": ["recA"]
        }},
        {"record_id": "c2", "fields": {
            "线索内容": "线索2",
            "关联案件": ["recA", "recB"]
        }},
    ]
    grouped = group_clues_by_case(clues)
    assert len(grouped["recA"]) == 2
    assert len(grouped["recB"]) == 1


def test_transform_clue_record():
    record = {
        "record_id": "clue001",
        "fields": {
            "线索编号": "NO.001",
            "线索内容": "关键线索内容",
            "线索类型": [{"text": "关键线索"}],
            "指向结论": "指向真相",
            "出现时机": [{"text": "前期"}],
        }
    }
    result = transform_clue_record(record)
    assert result["线索编号"] == "NO.001"
    assert result["线索内容"] == "关键线索内容"
    assert result["线索类型"] == "关键线索"
    assert result["出现时机"] == "前期"
