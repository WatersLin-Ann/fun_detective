#!/usr/bin/env python3
"""P1修复：合并欧美版数据到具体国家版，然后删除欧美版"""
import json, os, shutil

CASES_DIR = r'E:\Work\AIProjects\fun_detective\cases'

# 28组重复：(来源类型, 案件名称, 欧美路径, 具体国家路径)
duplicates = [
    ('推理小说', '人性记录', '推理小说/欧美/人性记录', '推理小说/英国/人性记录'),
    ('推理小说', '啤酒谋杀案', '推理小说/欧美/啤酒谋杀案', '推理小说/英国/啤酒谋杀案'),
    ('推理小说', '怪屋', '推理小说/欧美/怪屋', '推理小说/英国/怪屋'),
    ('推理小说', '悬崖山庄奇案', '推理小说/欧美/悬崖山庄奇案', '推理小说/英国/悬崖山庄奇案'),
    ('推理小说', '无尽长夜', '推理小说/欧美/无尽长夜', '推理小说/英国/无尽长夜'),
    ('推理小说', '谋杀启事', '推理小说/欧美/谋杀启事', '推理小说/英国/谋杀启事'),
    ('推理小说', '阳光下的罪恶', '推理小说/欧美/阳光下的罪恶', '推理小说/英国/阳光下的罪恶'),
    ('推理小说', '死亡约会', '推理小说/欧美/死亡约会', '推理小说/约旦/死亡约会'),
    ('推理小说', '漫长的告别', '推理小说/欧美/漫长的告别', '推理小说/美国/漫长的告别'),
    ('推理小说', '马耳他之鹰', '推理小说/欧美/马耳他之鹰', '推理小说/美国/马耳他之鹰'),
    ('影视', '冰血暴', '影视/欧美/冰血暴', '影视/美国/冰血暴'),
    ('影视', '小岛惊魂', '影视/欧美/小岛惊魂', '影视/美国/小岛惊魂'),
    ('影视', '搏击俱乐部', '影视/欧美/搏击俱乐部', '影视/美国/搏击俱乐部'),
    ('影视', '禁闭岛', '影视/欧美/禁闭岛', '影视/美国/禁闭岛'),
    ('影视', '穆赫兰道', '影视/欧美/穆赫兰道', '影视/美国/穆赫兰道'),
    ('影视', '第六感', '影视/欧美/第六感', '影视/美国/第六感'),
    ('影视', '老无所依', '影视/欧美/老无所依', '影视/美国/老无所依'),
    ('影视', '致命ID', '影视/欧美/致命ID', '影视/美国/致命ID'),
    ('影视', '致命魔术', '影视/欧美/致命魔术', '影视/美国/致命魔术'),
    ('影视', '记忆碎片', '影视/欧美/记忆碎片', '影视/美国/记忆碎片'),
    ('影视', '恐怖游轮', '影视/欧美/恐怖游轮', '影视/英国/恐怖游轮'),
    ('影视', '看不见的客人', '影视/欧美/看不见的客人', '影视/西班牙/看不见的客人'),
    ('真实案件', '林德伯格绑架案', '真实案件/欧美/林德伯格绑架案', '真实案件/美国/林德伯格绑架案'),
    ('真实案件', '莉齐·博登案', '真实案件/欧美/莉齐·博登案', '真实案件/美国/莉齐·博登案'),
    ('真实案件', '辛普森杀妻案', '真实案件/欧美/辛普森杀妻案', '真实案件/美国/辛普森杀妻案'),
    ('真实案件', '黑色大丽花案', '真实案件/欧美/黑色大丽花案', '真实案件/美国/黑色大丽花案'),
    ('游戏', '暴雨', '游戏/欧美/暴雨', '游戏/法国/暴雨'),
    ('游戏', '黑色洛城', '游戏/欧美/黑色洛城', '游戏/美国/黑色洛城'),
]

def merge_strings(a, b):
    """取更长的字符串"""
    if not a: return b
    if not b: return a
    return a if len(a) >= len(b) else b

def merge_arrays(a, b, key_func=None):
    """数组合并去重"""
    if not a: a = []
    if not b: b = []
    result = list(a)
    existing = set()
    if key_func:
        existing = set(key_func(x) for x in a)
    else:
        existing = set(json.dumps(x, ensure_ascii=False, sort_keys=True) for x in a)
    for item in b:
        k = key_func(item) if key_func else json.dumps(item, ensure_ascii=False, sort_keys=True)
        if k not in existing:
            result.append(item)
            existing.add(k)
    return result

def merge_case(eu_data, target_data):
    """将欧美版数据合并到目标版（取更完整的）"""
    # 基本信息
    eu_info = eu_data.get('基本信息', {})
    t_info = target_data.get('基本信息', {})
    
    # 参考链接合并
    t_info['参考链接'] = merge_arrays(
        t_info.get('参考链接'), eu_info.get('参考链接'),
        key_func=lambda x: x.get('URL', '')
    )
    # 推荐视频合并
    if '推荐视频' in eu_info or '推荐视频' in t_info:
        t_info['推荐视频'] = merge_arrays(
            t_info.get('推荐视频'), eu_info.get('推荐视频'),
            key_func=lambda x: x.get('URL', '')
        )
    # 关联作品合并
    if '关联作品' in eu_info or '关联作品' in t_info:
        t_info['关联作品'] = merge_arrays(
            t_info.get('关联作品'), eu_info.get('关联作品'),
            key_func=lambda x: x.get('作品名称', '') + x.get('站内Slug', '')
        )
    
    # 故事视图
    eu_story = eu_data.get('故事视图', {})
    t_story = target_data.get('故事视图', {})
    for field in ['故事摘要', '完整故事', '人物关系', '关键时间线', '结局/真相']:
        t_story[field] = merge_strings(t_story.get(field), eu_story.get(field))
    
    # 角色档案合并
    if '角色档案' in eu_story or '角色档案' in t_story:
        t_story['角色档案'] = merge_arrays(
            t_story.get('角色档案'), eu_story.get('角色档案'),
            key_func=lambda x: x.get('姓名', '')
        )
    
    target_data['基本信息'] = t_info
    target_data['故事视图'] = t_story
    return target_data

merged_count = 0
deleted_count = 0

for source_type, name, eu_rel, target_rel in duplicates:
    eu_path = os.path.join(CASES_DIR, eu_rel + '.json')
    target_path = os.path.join(CASES_DIR, target_rel + '.json')
    
    if not os.path.exists(eu_path):
        print(f'  跳过（欧美版不存在）: {eu_rel}')
        continue
    if not os.path.exists(target_path):
        print(f'  跳过（目标版不存在）: {target_rel}')
        continue
    
    with open(eu_path, 'r', encoding='utf-8') as f:
        eu_data = json.load(f)
    with open(target_path, 'r', encoding='utf-8') as f:
        target_data = json.load(f)
    
    # 合并
    merged = merge_case(eu_data, target_data)
    with open(target_path, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
        f.write('\n')
    merged_count += 1
    
    # 删除欧美版
    os.remove(eu_path)
    deleted_count += 1
    print(f'  合并并删除: {name} ({source_type})')

print(f'\n合并完成: {merged_count} 个')
print(f'删除欧美版: {deleted_count} 个')
