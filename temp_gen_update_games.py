import json

# 5个游戏案例的 record_id 和更新字段
updates = [
    {
        "record_id": "recvtL4dbtwlpu",
        "fields": {
            "游戏平台": ["PC", "PlayStation", "Switch", "手机"],
            "玩法类型": ["文字冒险"]
        }
    },
    {
        "record_id": "recvtL4dbtvrY8",
        "fields": {
            "游戏平台": ["PC", "PlayStation", "Xbox", "Switch", "手机"],
            "玩法类型": ["文字冒险", "推理解谜"]
        }
    },
    {
        "record_id": "recvtL4dbtu24s",
        "fields": {
            "游戏平台": ["PC", "PlayStation", "Switch"],
            "玩法类型": ["文字冒险", "推理解谜"]
        }
    },
    {
        "record_id": "recvtL4dbtgkMD",
        "fields": {
            "游戏平台": ["PC", "PlayStation", "Switch", "手机"],
            "玩法类型": ["文字冒险", "推理解谜"]
        }
    },
    {
        "record_id": "recvtL4dbtNE6s",
        "fields": {
            "游戏平台": ["PC", "PlayStation", "Xbox", "Switch"],
            "玩法类型": ["开放世界推理", "推理解谜"]
        }
    }
]

output = {"records": updates}
with open('temp_update_games.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print('更新 JSON 已生成，共', len(updates), '个游戏案例')
