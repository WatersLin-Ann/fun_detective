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

extra_cases = [
    (r'推理小说\英国\东方快车谋杀案.json', '东方快车谋杀案 解说', '解说'),
    (r'推理小说\英国\无人生还.json', '无人生还 解说', '解说'),
    (r'推理小说\英国\罗杰疑案.json', '罗杰疑案 解说', '解说'),
    (r'推理小说\英国\尼罗河上的惨案.json', '尼罗河上的惨案 解说', '解说'),
]

for rel_path, keyword, video_type in extra_cases:
    fpath = os.path.join(base, rel_path)
    d = load_case(fpath)
    name = d.get('基本信息', {}).get('案件名称', '')
    
    if d.get('基本信息', {}).get('推荐视频'):
        print(f'  跳过(已有): {name}')
        continue
    
    videos = [{
        '标题': f'B站搜索 - 《{name}》作品解说',
        'URL': bilibili_search(keyword),
        '来源': 'B站',
        '视频类型': video_type,
        '简介': f'搜索《{name}》相关的作品解读、剧情分析和作者介绍视频'
    }]
    d['基本信息']['推荐视频'] = videos
    save_case(fpath, d)
    print(f'  补充: {name}')

print('Done. Extra 4 cases filled.')
