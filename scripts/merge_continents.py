import json, os
from collections import Counter

cases_dir = r'E:\Work\AIProjects\fun_detective\cases'

continent_map = {
    '亚洲': '欧亚大陆',
    '欧洲': '欧亚大陆',
    '北美': '北美',
    '北美洲': '北美',
    '大洋洲': '大洋洲',
    '南美': '其他',
    '南美洲': '其他',
    '非洲': '其他',
    '其他': '其他',
}

count = 0
for root, dirs, files in os.walk(cases_dir):
    for f in files:
        if not f.endswith('.json'):
            continue
        path = os.path.join(root, f)
        try:
            with open(path, 'r', encoding='utf-8') as fp:
                data = json.load(fp)
        except Exception as e:
            print(f'读取失败 {path}: {e}')
            continue

        basic = data.get('基本信息', {})
        old_continent = basic.get('大洲', '')
        if old_continent in continent_map:
            new_continent = continent_map[old_continent]
            basic['大洲'] = new_continent
            data['基本信息'] = basic
            with open(path, 'w', encoding='utf-8') as fp:
                json.dump(data, fp, ensure_ascii=False, indent=2)
            count += 1
            if old_continent != new_continent:
                print(f'{data.get("id", f)}: {old_continent} -> {new_continent}')

print(f'\n共修改 {count} 个案例')

# 统计
continents = Counter()
for root, dirs, files in os.walk(cases_dir):
    for f in files:
        if f.endswith('.json'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as fp:
                data = json.load(fp)
            c = data.get('基本信息', {}).get('大洲', '未知')
            continents[c] += 1

print('\n各大洲案例数:')
for c, n in continents.most_common():
    print(f'  {c}: {n}')
