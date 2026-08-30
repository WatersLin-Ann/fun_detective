import json, os

targets = ['逆转裁判1-2：逆转姐妹', '逆转裁判3', '弹丸论破', '极限脱出', '人狼村之谜', '极乐迪斯科']
for root, dirs, files in os.walk('cases/游戏'):
    for f in files:
        if f.endswith('.json'):
            name = f.replace('.json', '')
            if name in targets:
                with open(os.path.join(root, f), 'r', encoding='utf-8') as fp:
                    data = json.load(fp)
                gd = data.get('游戏设计', {})
                print(f'=== {name} ===')
                print(f'  游戏平台: {gd.get("游戏平台", "缺失")}')
                print(f'  玩法类型: {gd.get("玩法类型", "缺失")}')
                print(f'  核心玩法机制: {gd.get("核心玩法机制", "缺失")}')
                gs = gd.get("关卡结构", "")
                print(f'  关卡结构: {gs[:60] if gs else "缺失"}...')
                pg = gd.get("玩家引导方式", "")
                print(f'  玩家引导方式: {pg[:60] if pg else "缺失"}...')
                print(f'  可复用游戏模板: {gd.get("可复用游戏模板", "缺失")}')
                print()
