import json
import os
import sys
from urllib.parse import quote

sys.stdout.reconfigure(encoding='utf-8')

base = r'E:\Work\AIProjects\fun_detective\cases'

def bilibili_search(keyword):
    return f'https://search.bilibili.com/all?keyword={quote(keyword)}'

def load_case(fpath):
    with open(fpath, encoding='utf-8') as f:
        return json.load(f)

def save_case(fpath, data):
    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_case_name(data):
    return data.get('基本信息', {}).get('案件名称', '')

def get_source_type(data):
    return data.get('基本信息', {}).get('来源类型', '')

# 30个热门案件清单（按分类组织）
# 格式: (相对路径, 视频搜索关键词, 视频类型)
target_cases = [
    # 推理小说 - 经典作品（10个）
    (r'推理小说\欧美\东方快车谋杀案.json', '东方快车谋杀案 解说', '解说'),
    (r'推理小说\欧美\无人生还.json', '无人生还 解说', '解说'),
    (r'推理小说\欧美\罗杰疑案.json', '罗杰疑案 解说', '解说'),
    (r'推理小说\欧美\尼罗河上的惨案.json', '尼罗河上的惨案 解说', '解说'),
    (r'推理小说\日本\占星术杀人魔法.json', '占星术杀人魔法 解说', '解说'),
    (r'推理小说\日本\钟表馆事件.json', '钟表馆事件 解说', '解说'),
    (r'推理小说\日本\嫌疑人X的献身.json', '嫌疑人X的献身 解说', '解说'),
    (r'推理小说\日本\白夜行.json', '白夜行 解说', '解说'),
    (r'推理小说\日本\恶意.json', '恶意 东野圭吾 解说', '解说'),
    (r'推理小说\日本\ZOO.json', 'ZOO 乙一 解说', '解说'),
    # 影视 - 热门悬疑推理（10个）
    (r'影视\欧美\禁闭岛.json', '禁闭岛 解说', '解说'),
    (r'影视\欧美\致命ID.json', '致命ID 解说', '解说'),
    (r'影视\欧美\记忆碎片.json', '记忆碎片 解说', '解说'),
    (r'影视\欧美\穆赫兰道.json', '穆赫兰道 解说', '解说'),
    (r'影视\欧美\恐怖游轮.json', '恐怖游轮 解说', '解说'),
    (r'影视\欧美\搏击俱乐部.json', '搏击俱乐部 解说', '解说'),
    (r'影视\欧美\看不见的客人.json', '看不见的客人 解说', '解说'),
    (r'影视\欧美\致命魔术.json', '致命魔术 解说', '解说'),
    (r'影视\中国\唐人街探案.json', '唐人街探案 解说', '解说'),
    (r'影视\中国\误杀.json', '误杀 解说', '解说'),
    # 真实案件 - 知名案件（5个）
    (r'真实案件\欧美\黑色大丽花案.json', '黑色大丽花案 纪录片', '纪录片'),
    (r'真实案件\欧美\辛普森杀妻案.json', '辛普森杀妻案 纪录片', '纪录片'),
    (r'真实案件\欧美\肯尼迪遇刺案.json', '肯尼迪遇刺案 纪录片', '纪录片'),
    (r'真实案件\中国\朱令案.json', '朱令案 纪录片', '纪录片'),
    (r'真实案件\日本\宫崎勤事件.json', '宫崎勤事件 纪录片', '纪录片'),
    # 游戏 - 热门推理游戏（5个）
    (r'游戏\日本\命运石之门.json', '命运石之门 实况', '实况'),
    (r'游戏\日本\弹丸论破V3.json', '弹丸论破V3 实况', '实况'),
    (r'游戏\日本\极限脱出：9小时9个人9扇门.json', '极限脱出999 实况', '实况'),
    (r'游戏\欧美\奇异人生.json', '奇异人生 实况', '实况'),
    (r'游戏\欧美\黑色洛城.json', '黑色洛城 实况', '实况'),
]

results = []
skipped = []

for rel_path, keyword, video_type in target_cases:
    fpath = os.path.join(base, rel_path)
    if not os.path.exists(fpath):
        skipped.append(f'  [不存在] {rel_path}')
        continue
    
    d = load_case(fpath)
    name = get_case_name(d)
    source_type = get_source_type(d)
    
    # 如果已有推荐视频，跳过
    if d.get('基本信息', {}).get('推荐视频') and len(d['基本信息']['推荐视频']) > 0:
        skipped.append(f'  [已有视频] {name}')
        continue
    
    # 根据来源类型确定视频标题和简介
    if source_type == '推理小说':
        title = f'B站搜索 - 《{name}》作品解说'
        desc = f'搜索《{name}》相关的作品解读、剧情分析和作者介绍视频'
    elif source_type == '影视':
        title = f'B站搜索 - 《{name}》电影解说'
        desc = f'搜索《{name}》相关的剧情解说、深度分析和影评视频'
    elif source_type == '真实案件':
        title = f'B站搜索 - {name} 纪录片'
        desc = f'搜索{name}相关的纪录片、案件分析和深度调查视频'
    elif source_type == '游戏':
        title = f'B站搜索 - 《{name}》游戏实况'
        desc = f'搜索《{name}》相关的游戏实况、攻略流程和评测视频'
    else:
        title = f'B站搜索 - {name}'
        desc = f'搜索{name}相关视频'
    
    videos = [
        {
            '标题': title,
            'URL': bilibili_search(keyword),
            '来源': 'B站',
            '视频类型': video_type,
            '简介': desc
        }
    ]
    
    d['基本信息']['推荐视频'] = videos
    save_case(fpath, d)
    results.append(f'  [{source_type}] {name}: 添加 {len(videos)} 条视频推荐')

print('=== 视频推荐填充结果 ===')
for line in results:
    print(line)
print(f'\n成功填充: {len(results)} 个案件')
if skipped:
    print(f'\n跳过: {len(skipped)} 个案件')
    for line in skipped:
        print(line)

# 保存结果
with open(r'E:\Work\AIProjects\fun_detective\video_fix_results.txt', 'w', encoding='utf-8') as f:
    f.write(f'成功填充: {len(results)} 个案件\n')
    f.write(f'跳过: {len(skipped)} 个案件\n\n')
    f.write('=== 成功填充 ===\n')
    f.write('\n'.join(results))
    if skipped:
        f.write('\n\n=== 跳过 ===\n')
        f.write('\n'.join(skipped))
