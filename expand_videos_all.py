import json
import os
import sys
from urllib.parse import quote

sys.stdout.reconfigure(encoding='utf-8')

base = r'E:\Work\AIProjects\fun_detective\cases'

def bilibili_search(keyword):
    return f'https://search.bilibili.com/all?keyword={quote(keyword)}'

def youtube_search(keyword):
    return f'https://www.youtube.com/results?search_query={quote(keyword)}'

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

def get_region(data):
    return data.get('基本信息', {}).get('地区', '')

# 根据来源类型确定搜索关键词和视频类型
def get_search_config(source_type, name):
    if source_type == '推理小说':
        return {
            'bilibili_keyword': f'{name} 解说',
            'video_type': '解说',
            'title': f'B站搜索 - 《{name}》作品解说',
            'desc': f'搜索《{name}》相关的作品解读、剧情分析和作者介绍视频'
        }
    elif source_type == '影视':
        return {
            'bilibili_keyword': f'{name} 解说',
            'video_type': '解说',
            'title': f'B站搜索 - 《{name}》电影解说',
            'desc': f'搜索《{name}》相关的剧情解说、深度分析和影评视频'
        }
    elif source_type == '真实案件':
        return {
            'bilibili_keyword': f'{name} 纪录片',
            'video_type': '纪录片',
            'title': f'B站搜索 - {name} 纪录片',
            'desc': f'搜索{name}相关的纪录片、案件分析和深度调查视频'
        }
    elif source_type == '游戏':
        return {
            'bilibili_keyword': f'{name} 实况',
            'video_type': '实况',
            'title': f'B站搜索 - 《{name}》游戏实况',
            'desc': f'搜索《{name}》相关的游戏实况、攻略流程和评测视频'
        }
    else:
        return {
            'bilibili_keyword': name,
            'video_type': '其他',
            'title': f'B站搜索 - {name}',
            'desc': f'搜索{name}相关视频'
        }

# 判断是否为欧美地区（需要额外加YouTube链接）
def is_western(region):
    western_keywords = ['美国', '英国', '欧美', '法国', '德国', '意大利', '西班牙', '加拿大', '澳大利亚', '北美']
    for kw in western_keywords:
        if kw in region:
            return True
    return False

# 主执行
total = 0
added = 0
already_had = 0
with_youtube = 0
results = []

for root, dirs, files in os.walk(base):
    for fname in files:
        if not fname.endswith('.json'):
            continue
        fpath = os.path.join(root, fname)
        rel = os.path.relpath(fpath, base)
        
        try:
            d = load_case(fpath)
        except:
            continue
        
        total += 1
        name = get_case_name(d)
        source_type = get_source_type(d)
        region = get_region(d)
        
        existing_videos = d.get('基本信息', {}).get('推荐视频')
        
        # 如果已有推荐视频，检查是否需要统一格式（替换非搜索链接）
        if existing_videos and len(existing_videos) > 0:
            # 检查是否所有链接都是搜索链接
            all_search = all(('search.bilibili.com' in v.get('URL', '') or 'youtube.com/results' in v.get('URL', '')) for v in existing_videos)
            if all_search:
                already_had += 1
                # 欧美案件如果没有YouTube链接，补充一条
                if is_western(region):
                    has_youtube = any('youtube.com/results' in v.get('URL', '') for v in existing_videos)
                    if not has_youtube:
                        config = get_search_config(source_type, name)
                        yt_video = {
                            '标题': f'YouTube搜索 - {name}',
                            'URL': youtube_search(name),
                            '来源': 'YouTube',
                            '视频类型': config['video_type'],
                            '简介': f'Search YouTube for videos related to {name}'
                        }
                        existing_videos.append(yt_video)
                        d['基本信息']['推荐视频'] = existing_videos
                        save_case(fpath, d)
                        with_youtube += 1
                        results.append(f'  [补充YouTube] {name} ({region})')
                continue
            else:
                # 有非搜索链接，替换为统一的搜索链接格式
                pass
        
        # 生成B站搜索链接
        config = get_search_config(source_type, name)
        videos = [{
            '标题': config['title'],
            'URL': bilibili_search(config['bilibili_keyword']),
            '来源': 'B站',
            '视频类型': config['video_type'],
            '简介': config['desc']
        }]
        
        # 欧美地区额外加YouTube搜索链接
        if is_western(region):
            yt_video = {
                '标题': f'YouTube搜索 - {name}',
                'URL': youtube_search(name),
                '来源': 'YouTube',
                '视频类型': config['video_type'],
                '简介': f'Search YouTube for videos related to {name}'
            }
            videos.append(yt_video)
            with_youtube += 1
        
        d['基本信息']['推荐视频'] = videos
        save_case(fpath, d)
        added += 1
        yt_note = ' + YouTube' if is_western(region) else ''
        results.append(f'  [{source_type}]{yt_note} {name} ({region}): {len(videos)}条')

print(f'=== 视频推荐批量扩展结果 ===')
print(f'总案件数: {total}')
print(f'新增视频推荐: {added} 个案件')
print(f'已有视频推荐(格式正确): {already_had} 个案件')
print(f'含YouTube链接: {with_youtube} 个案件')
print(f'\n=== 详细列表 ===')
for line in results:
    print(line)

# 保存结果
with open(r'E:\Work\AIProjects\fun_detective\video_expand_results.txt', 'w', encoding='utf-8') as f:
    f.write(f'总案件数: {total}\n')
    f.write(f'新增视频推荐: {added} 个案件\n')
    f.write(f'已有视频推荐(格式正确): {already_had} 个案件\n')
    f.write(f'含YouTube链接: {with_youtube} 个案件\n\n')
    f.write('=== 详细列表 ===\n')
    f.write('\n'.join(results))
