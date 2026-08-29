"""数据校验模块：校验案件数据是否符合 Schema 和业务规则。"""
import json
import os
from typing import Dict, List, Tuple
import jsonschema


def load_schema(schema_path: str) -> dict:
    """加载 JSON Schema 文件。"""
    with open(schema_path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_case(case_data: Dict, schema: dict = None) -> Tuple[bool, List[str]]:
    """校验案件数据，返回 (is_valid, errors)。"""
    errors = []

    if schema:
        try:
            jsonschema.validate(instance=case_data, schema=schema)
        except jsonschema.ValidationError as e:
            errors.append(f"Schema 校验失败: {e.message} (路径: {'.'.join(str(p) for p in e.path)})")

    basic = case_data.get("基本信息", {})

    if not basic.get("案件名称"):
        errors.append("缺少必填字段：案件名称")
    if not basic.get("来源类型"):
        errors.append("缺少必填字段：来源类型")
    if not basic.get("地区"):
        errors.append("缺少必填字段：地区")
    if not basic.get("一句话简介"):
        errors.append("缺少必填字段：一句话简介")

    valid_source_types = ["推理小说", "真实案件", "影视", "游戏", "历史谜案", "其他"]
    if basic.get("来源类型") and basic["来源类型"] not in valid_source_types:
        errors.append(f"来源类型值非法: {basic['来源类型']}，有效值: {valid_source_types}")

    valid_regions = ["日本", "欧美", "中国", "其他"]
    if basic.get("地区") and basic["地区"] not in valid_regions:
        errors.append(f"地区值非法: {basic['地区']}，有效值: {valid_regions}")

    difficulty = case_data.get("设计视图", {}).get("难度评分", {})
    for key in ["线索密度", "误导数量", "诡计隐蔽度", "综合"]:
        val = difficulty.get(key)
        if val is not None and (val < 1 or val > 5):
            errors.append(f"难度评分-{key} 超出范围(1-5): {val}")

    scores = [difficulty.get(k) for k in ["线索密度", "误导数量", "诡计隐蔽度"] if difficulty.get(k) is not None]
    if scores and "综合" in difficulty:
        expected_avg = round(sum(scores) / len(scores), 1)
        if abs(difficulty["综合"] - expected_avg) > 0.1:
            errors.append(f"难度综合分计算错误: 期望{expected_avg}，实际{difficulty['综合']}")

    if basic.get("来源类型") == "游戏":
        game_design = case_data.get("游戏设计", {})
        if not game_design.get("游戏平台"):
            errors.append("游戏案例必须填写：游戏平台")
        if not game_design.get("玩法类型"):
            errors.append("游戏案例必须填写：玩法类型")

    return (len(errors) == 0, errors)


def validate_all_cases(cases: List[Dict], schema: dict = None) -> Tuple[List[Dict], List[Dict]]:
    """批量校验案件列表，返回 (valid_cases, invalid_cases_with_errors)。"""
    valid = []
    invalid = []

    for case in cases:
        is_valid, errors = validate_case(case, schema)
        if is_valid:
            valid.append(case)
        else:
            invalid.append({
                "case": case,
                "id": case.get("id", "unknown"),
                "name": case.get("基本信息", {}).get("案件名称", "未知"),
                "errors": errors
            })

    return valid, invalid
