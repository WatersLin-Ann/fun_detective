import json

# 正确的选项值
VALID_TRICKS = ["密室", "不在场证明", "叙述性诡计", "身份诡计", "心理操控", "时刻表", "物理机关", "毒杀", "其他"]
VALID_MECHANISMS = ["封闭空间", "限时破案", "多视角叙事", "连环案件", "叙述者不可靠", "死亡信息", "其他"]
VALID_GAME_MECHANISMS = ["证据收集", "矛盾指证", "时间回溯", "多视角切换", "心理量表", "环境探查", "对话选择", "线索拼接", "其他"]
VALID_TEMPLATES = ["线索板", "推理拼图", "对话分支", "时间线重构", "嫌疑人档案", "法庭对决", "搜查推理", "其他"]

def fix_options(values, valid_options):
    """将不在选项中的值替换为'其他'"""
    if not values:
        return []
    fixed = []
    for v in values:
        if v in valid_options:
            fixed.append(v)
        else:
            # 尝试映射
            mapping = {
                "分支选择": "对话选择",
                "多结局": "其他",
                "快速反应事件(QTE)": "其他",
                "关系系统": "心理量表",
                "流程图回溯": "时间线重构",
                "时间线回溯": "时间回溯",
                "元叙事": "其他",
                "第四面墙打破": "其他",
                "躲藏与逃跑": "环境探查",
                "夜视摄像机": "其他",
                "资源管理（电池）": "其他",
                "文档收集": "线索拼接",
                "无法战斗": "其他",
                "社交推理": "其他",
                "身份隐藏": "其他",
                "任务系统": "其他",
                "讨论投票": "对话选择",
                "破坏系统": "其他",
                "传送门空间推理": "其他",
                "动量守恒": "其他",
                "凝胶系统": "其他",
                "合作解谜": "其他",
                "梦境解谜（时间限制）": "限时破案",
                "现实搜查": "搜查推理",
                "证据分析": "证据收集",
                "多分支剧情": "对话分支",
                "AI搭档系统": "其他",
            }
            if v in mapping:
                mapped = mapping[v]
                if mapped in valid_options and mapped not in fixed:
                    fixed.append(mapped)
            else:
                if "其他" not in fixed:
                    fixed.append("其他")
    return fixed if fixed else ["其他"]

# 读取之前生成的 JSON
with open('temp_batch_games2.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

converted = []
for case in data['create_records']:
    new_case = {}
    # 基本信息
    new_case['案件名称'] = case['案件名称']
    new_case['来源类型'] = case['来源类型']
    new_case['来源作品/事件'] = case['来源作品/事件']
    new_case['创作者'] = case['创作者']
    new_case['地区'] = case['地区']
    new_case['年代'] = case['年代']
    new_case['案件状态'] = ["虚构结局"] if "进行中" in case['案件状态'] else case['案件状态']
    new_case['一句话简介'] = case['一句话简介']
    new_case['参考链接'] = case['参考链接']
    # 故事视图
    new_case['故事摘要'] = case['故事摘要']
    new_case['完整故事'] = case['完整故事']
    new_case['人物关系'] = case['人物关系']
    new_case['角色档案'] = case['角色档案']
    new_case['关键时间线'] = case['关键时间线']
    new_case['结局/真相'] = case['结局/真相']
    # 设计视图
    new_case['核心诡计简述'] = case['核心诡计简述']
    new_case['诡计类型'] = fix_options(case['诡计类型'], VALID_TRICKS)
    new_case['可复用机制'] = fix_options(case['可复用机制'], VALID_MECHANISMS)
    new_case['信息差分析'] = case['信息差分析']
    new_case['红鲱鱼/误导'] = case['红鲱鱼/误导']
    new_case['难度-线索密度'] = case['难度-线索密度']
    new_case['难度-误导数量'] = case['难度-误导数量']
    new_case['难度-诡计隐蔽度'] = case['难度-诡计隐蔽度']
    # 游戏设计（展开）
    game_design = json.loads(case['游戏设计'])
    new_case['游戏平台'] = game_design['游戏平台']
    new_case['玩法类型'] = game_design['玩法类型']
    new_case['核心玩法机制'] = fix_options(game_design['核心玩法机制'], VALID_GAME_MECHANISMS)
    new_case['关卡结构'] = game_design['关卡结构']
    new_case['玩家引导方式'] = game_design['玩家引导方式']
    new_case['可复用游戏模板'] = fix_options(game_design['可复用游戏模板'], VALID_TEMPLATES)
    converted.append(new_case)

output = {"create_records": converted}
with open('temp_batch_games2_fixed2.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print('转换完成，共', len(converted), '个案例')
# 打印每个案例的关键字段用于验证
for c in converted:
    print(f"  {c['案件名称']}: 诡计={c['诡计类型']}, 机制={c['可复用机制']}, 玩法={c['核心玩法机制']}, 模板={c['可复用游戏模板']}")
