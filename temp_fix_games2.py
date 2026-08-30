import json

# 读取之前生成的 JSON，转换字段结构
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
    new_case['案件状态'] = case['案件状态']
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
    new_case['诡计类型'] = case['诡计类型']
    new_case['可复用机制'] = case['可复用机制']
    new_case['信息差分析'] = case['信息差分析']
    new_case['红鲱鱼/误导'] = case['红鲱鱼/误导']
    new_case['难度-线索密度'] = case['难度-线索密度']
    new_case['难度-误导数量'] = case['难度-误导数量']
    new_case['难度-诡计隐蔽度'] = case['难度-诡计隐蔽度']
    # 游戏设计（展开）
    game_design = json.loads(case['游戏设计'])
    new_case['游戏平台'] = game_design['游戏平台']
    new_case['玩法类型'] = game_design['玩法类型']
    new_case['核心玩法机制'] = game_design['核心玩法机制']
    new_case['关卡结构'] = game_design['关卡结构']
    new_case['玩家引导方式'] = game_design['玩家引导方式']
    new_case['可复用游戏模板'] = game_design['可复用游戏模板']
    converted.append(new_case)

output = {"create_records": converted}
with open('temp_batch_games2_fixed.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print('转换完成，共', len(converted), '个案例')
