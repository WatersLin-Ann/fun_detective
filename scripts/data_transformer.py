"""数据转换模块：将飞书记录转换为标准化 JSON 格式。"""
import re
from typing import Dict, List, Optional
from datetime import datetime


def _extract_select_value(field_value) -> Optional[str]:
    """提取单选字段的值。"""
    if field_value is None:
        return None
    if isinstance(field_value, str):
        return field_value
    if isinstance(field_value, list) and len(field_value) > 0:
        return field_value[0].get("text", "") if isinstance(field_value[0], dict) else str(field_value[0])
    return str(field_value)


def _extract_multi_select_values(field_value) -> List[str]:
    """提取多选字段的值列表。"""
    if field_value is None:
        return []
    if isinstance(field_value, list):
        result = []
        for item in field_value:
            if isinstance(item, dict):
                result.append(item.get("text", ""))
            else:
                result.append(str(item))
        return [v for v in result if v]
    if isinstance(field_value, str):
        return [field_value] if field_value else []
    return []


def _extract_text(field_value) -> str:
    """提取文本字段（飞书富文本可能是列表）。"""
    if field_value is None:
        return ""
    if isinstance(field_value, str):
        return field_value
    if isinstance(field_value, list):
        parts = []
        for item in field_value:
            if isinstance(item, dict):
                parts.append(item.get("text", ""))
            else:
                parts.append(str(item))
        return "".join(parts)
    return str(field_value)


def _extract_number(field_value) -> Optional[float]:
    """提取数字字段。"""
    if field_value is None:
        return None
    if isinstance(field_value, (int, float)):
        return float(field_value)
    try:
        return float(field_value)
    except (ValueError, TypeError):
        return None


def _extract_date(field_value) -> Optional[str]:
    """提取日期字段，转为 YYYY-MM-DD 格式。"""
    if field_value is None:
        return None
    if isinstance(field_value, (int, float)):
        dt = datetime.fromtimestamp(field_value / 1000)
        return dt.strftime("%Y-%m-%d")
    if isinstance(field_value, str):
        for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S"]:
            try:
                return datetime.strptime(field_value[:10], "%Y-%m-%d").strftime("%Y-%m-%d")
            except ValueError:
                continue
    return None


def _sanitize_filename(name: str) -> str:
    """清理文件名中的非法字符。"""
    sanitized = re.sub(r'[<>:"/\\|?*]', '', name)
    sanitized = sanitized.strip(' .')
    return sanitized if sanitized else "未命名"


def transform_clue_record(record: Dict) -> Dict:
    """将飞书线索记录转换为标准化线索格式。"""
    fields = record.get("fields", {})
    return {
        "线索编号": _extract_text(fields.get("线索编号")),
        "线索内容": _extract_text(fields.get("线索内容")),
        "线索类型": _extract_select_value(fields.get("线索类型")),
        "指向结论": _extract_text(fields.get("指向结论")),
        "出现时机": _extract_select_value(fields.get("出现时机")),
    }


def transform_case_record(record: Dict, clues: List[Dict] = None,
                          case_number: int = 1) -> Dict:
    """将飞书案件记录转换为标准化 JSON 格式。"""
    fields = record.get("fields", {})
    record_id = record.get("record_id", "")

    clue_density = _extract_number(fields.get("难度-线索密度"))
    mislead_count = _extract_number(fields.get("难度-误导数量"))
    trick_hidden = _extract_number(fields.get("难度-诡计隐蔽度"))

    difficulty = {}
    if clue_density is not None:
        difficulty["线索密度"] = clue_density
    if mislead_count is not None:
        difficulty["误导数量"] = mislead_count
    if trick_hidden is not None:
        difficulty["诡计隐蔽度"] = trick_hidden

    scores = [v for v in [clue_density, mislead_count, trick_hidden] if v is not None]
    if scores:
        difficulty["综合"] = round(sum(scores) / len(scores), 1)

    return {
        "id": f"case-{case_number:03d}",
        "基本信息": {
            "案件名称": _extract_text(fields.get("案件名称")),
            "来源类型": _extract_select_value(fields.get("来源类型")),
            "来源作品/事件": _extract_text(fields.get("来源作品/事件")),
            "作者/创作者": _extract_text(fields.get("作者/创作者")),
            "地区": _extract_select_value(fields.get("地区")),
            "年代": _extract_text(fields.get("年代")),
            "案件状态": _extract_select_value(fields.get("案件状态")),
            "一句话简介": _extract_text(fields.get("一句话简介")),
        },
        "故事视图": {
            "故事摘要": _extract_text(fields.get("故事摘要")),
            "完整故事": _extract_text(fields.get("完整故事")),
            "人物关系": _extract_text(fields.get("人物关系")),
            "关键时间线": _extract_text(fields.get("关键时间线")),
            "结局/真相": _extract_text(fields.get("结局/真相")),
        },
        "设计视图": {
            "核心诡计简述": _extract_text(fields.get("核心诡计简述")),
            "诡计类型": _extract_multi_select_values(fields.get("诡计类型")),
            "可复用机制": _extract_multi_select_values(fields.get("可复用机制")),
            "信息差分析": _extract_text(fields.get("信息差分析")),
            "红鲱鱼/误导": _extract_text(fields.get("红鲱鱼/误导")),
            "难度评分": difficulty,
            "线索链": clues or [],
        },
        "游戏设计": {
            "游戏平台": _extract_multi_select_values(fields.get("游戏平台")),
            "玩法类型": _extract_multi_select_values(fields.get("玩法类型")),
            "核心玩法机制": _extract_multi_select_values(fields.get("核心玩法机制")),
            "关卡结构": _extract_text(fields.get("关卡结构")),
            "玩家引导方式": _extract_text(fields.get("玩家引导方式")),
            "推理系统设计": _extract_text(fields.get("推理系统设计")),
            "可复用游戏模板": _extract_multi_select_values(fields.get("可复用游戏模板")),
        },
        "元数据": {
            "录入状态": _extract_select_value(fields.get("录入状态")) or "待录入",
            "录入日期": _extract_date(fields.get("录入日期")) or datetime.now().strftime("%Y-%m-%d"),
            "最后更新": _extract_date(fields.get("最后更新")) or datetime.now().strftime("%Y-%m-%d"),
            "飞书记录ID": record_id,
            "版本": 1,
        },
    }


def get_file_path(case_data: Dict) -> str:
    """根据案件数据生成相对文件路径。"""
    source_type = case_data["基本信息"].get("来源类型", "未分类")
    region = case_data["基本信息"].get("地区", "未分类")
    name = _sanitize_filename(case_data["基本信息"].get("案件名称", "未命名"))
    return f"{source_type}/{region}/{name}.json"


def group_clues_by_case(clue_records: List[Dict]) -> Dict[str, List[Dict]]:
    """将线索记录按关联案件分组。"""
    grouped = {}
    for record in clue_records:
        fields = record.get("fields", {})
        linked_cases = fields.get("关联案件", [])
        if isinstance(linked_cases, list):
            for case_link in linked_cases:
                case_id = case_link if isinstance(case_link, str) else case_link.get("record_id", "")
                if case_id:
                    if case_id not in grouped:
                        grouped[case_id] = []
                    grouped[case_id].append(transform_clue_record(record))
    return grouped
