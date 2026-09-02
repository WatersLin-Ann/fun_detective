import json
import os
import sys
from urllib.parse import quote

sys.stdout.reconfigure(encoding='utf-8')

base = r'E:\Work\AIProjects\fun_detective\cases'

def wiki_url(title, lang='zh'):
    """Generate Wikipedia URL. Spaces become underscores."""
    t = title.replace(' ', '_')
    return f'https://{lang}.wikipedia.org/wiki/{t}'

def douban_book_search(title):
    return f'https://search.douban.com/book/subject_search?search_text={quote(title)}'

def douban_movie_search(title):
    return f'https://search.douban.com/movie/subject_search?search_text={quote(title)}'

def imdb_search(title):
    return f'https://www.imdb.com/find?q={quote(title)}'

def steam_search(title):
    return f'https://store.steampowered.com/search/?term={quote(title)}'

def baidu_baike(title):
    return f'https://baike.baidu.com/item/{quote(title)}'

def load_case(fpath):
    with open(fpath, encoding='utf-8') as f:
        return json.load(f)

def save_case(fpath, data):
    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_case_name(data):
    return data.get('基本信息', {}).get('案件名称', '')

# ============================================================
# P0 批次1：推理小说类
# ============================================================
def fix_mystery_novels():
    results = []
    novel_dir = os.path.join(base, '推理小说')
    
    # 1. ZOO子案件：继承父案件ZOO.json的参考链接
    zoo_parent = os.path.join(novel_dir, '日本', 'ZOO.json')
    zoo_data = load_case(zoo_parent)
    zoo_refs = zoo_data.get('基本信息', {}).get('参考链接', [])
    
    zoo_subcases = [
        'ZOO-七个房间.json', 'ZOO-从前在太阳西沉的公园里.json',
        'ZOO-动物园.json', 'ZOO-向阳之诗.json',
        'ZOO-在即将坠落的飞机中.json', 'ZOO-寒冷森林中的小白屋.json',
        'ZOO-小饰与阳子.json', 'ZOO-把血液找出来.json',
        'ZOO-神的咒语.json', 'ZOO-衣橱.json', 'ZOO-远离的夫妇.json'
    ]
    
    for sub in zoo_subcases:
        fpath = os.path.join(novel_dir, '日本', sub)
        if os.path.exists(fpath):
            d = load_case(fpath)
            if not d.get('基本信息', {}).get('参考链接'):
                # 继承父案件链接，但标题加上子案件名
                sub_refs = []
                for ref in zoo_refs:
                    new_ref = dict(ref)
                    sub_refs.append(new_ref)
                d['基本信息']['参考链接'] = sub_refs
                save_case(fpath, d)
                results.append(f'  [ZOO子案件] {sub}: 继承父案件 {len(sub_refs)} 条链接')
    
    # 2. 日本推理小说其他缺失案件
    japan_missing = [
        '为了N.json', '八墓村.json', '库特莉亚芙卡的排序.json',
        '异邦骑士.json', '恶魔吹着笛子来.json', '愚者的片尾.json',
        '所罗门的伪证.json', '本阵杀人事件.json', '模仿犯.json',
        '火车.json', '点与线.json', '犬神家族.json', '砂之器.json',
        '镜中孤城.json', '零的焦点.json'
    ]
    
    for fname in japan_missing:
        fpath = os.path.join(novel_dir, '日本', fname)
        if not os.path.exists(fpath):
            continue
        d = load_case(fpath)
        if d.get('基本信息', {}).get('参考链接'):
            continue
        name = get_case_name(d)
        refs = [
            {'标题': f'维基百科 - {name}', 'URL': wiki_url(name), '类型': '维基百科'},
            {'标题': f'豆瓣读书 - 搜索《{name}》', 'URL': douban_book_search(name), '类型': '豆瓣'},
        ]
        d['基本信息']['参考链接'] = refs
        save_case(fpath, d)
        results.append(f'  [日本推理] {fname}: 补全 {len(refs)} 条链接')
    
    # 3. 欧美推理小说缺失案件
    europe_missing = [
        'ABC谋杀案.json', '人性记录.json', '啤酒谋杀案.json',
        '布朗神父探案集.json', '怪屋.json', '悬崖山庄奇案.json',
        '无尽长夜.json', '时间的女儿.json', '死亡约会.json',
        '法兰柴思事件.json', '漫长的告别.json', '特伦特最后一案.json',
        '瘦子.json', '破镜谋杀案.json', '红屋之谜.json',
        '藏书室女尸之谜.json', '谋杀启事.json', '长眠不醒.json',
        '阳光下的罪恶.json', '马耳他之鹰.json'
    ]
    
    for fname in europe_missing:
        fpath = os.path.join(novel_dir, '欧美', fname)
        if not os.path.exists(fpath):
            continue
        d = load_case(fpath)
        if d.get('基本信息', {}).get('参考链接'):
            continue
        name = get_case_name(d)
        refs = [
            {'标题': f'维基百科 - {name}', 'URL': wiki_url(name), '类型': '维基百科'},
            {'标题': f'豆瓣读书 - 搜索《{name}》', 'URL': douban_book_search(name), '类型': '豆瓣'},
        ]
        d['基本信息']['参考链接'] = refs
        save_case(fpath, d)
        results.append(f'  [欧美推理] {fname}: 补全 {len(refs)} 条链接')
    
    return results

# ============================================================
# P0 批次2：真实案件类
# ============================================================
def fix_real_cases():
    results = []
    real_dir = os.path.join(base, '真实案件')
    
    china_missing = [
        '东北二王案.json', '呼兰大侠案.json', '张子强案.json',
        '朱令案.json', '白宝山案.json', '聂树斌案.json', '龙治民案.json'
    ]
    for fname in china_missing:
        fpath = os.path.join(real_dir, '中国', fname)
        if not os.path.exists(fpath):
            continue
        d = load_case(fpath)
        if d.get('基本信息', {}).get('参考链接'):
            continue
        name = get_case_name(d)
        refs = [
            {'标题': f'百度百科 - {name}', 'URL': baidu_baike(name), '类型': '百度百科'},
            {'标题': f'维基百科 - {name}', 'URL': wiki_url(name), '类型': '维基百科'},
        ]
        d['基本信息']['参考链接'] = refs
        save_case(fpath, d)
        results.append(f'  [中国真实] {fname}: 补全 {len(refs)} 条链接')
    
    japan_missing = [
        '宫崎勤事件.json', '帝银事件.json', '格力高·森永事件.json',
        '神户儿童连续杀害事件.json', '秋叶原杀人事件.json'
    ]
    for fname in japan_missing:
        fpath = os.path.join(real_dir, '日本', fname)
        if not os.path.exists(fpath):
            continue
        d = load_case(fpath)
        if d.get('基本信息', {}).get('参考链接'):
            continue
        name = get_case_name(d)
        refs = [
            {'标题': f'维基百科 - {name}', 'URL': wiki_url(name), '类型': '维基百科'},
            {'标题': f'百度百科 - {name}', 'URL': baidu_baike(name), '类型': '百度百科'},
        ]
        d['基本信息']['参考链接'] = refs
        save_case(fpath, d)
        results.append(f'  [日本真实] {fname}: 补全 {len(refs)} 条链接')
    
    europe_missing = [
        'BTK杀手案.json', '乔恩·贝内特·拉姆齐案.json', '山姆之子案.json',
        '杰弗里·达默案.json', '林德伯格绑架案.json', '理查德·拉米雷斯案.json',
        '约翰·韦恩·盖西案.json', '绿河杀手案.json', '肯尼迪遇刺案.json',
        '莉齐·博登案.json', '辛普森杀妻案.json', '阿曼达·诺克斯案.json',
        '黑色大丽花案.json'
    ]
    for fname in europe_missing:
        fpath = os.path.join(real_dir, '欧美', fname)
        if not os.path.exists(fpath):
            continue
        d = load_case(fpath)
        if d.get('基本信息', {}).get('参考链接'):
            continue
        name = get_case_name(d)
        refs = [
            {'标题': f'维基百科 - {name}', 'URL': wiki_url(name), '类型': '维基百科'},
            {'标题': f'百度百科 - {name}', 'URL': baidu_baike(name), '类型': '百度百科'},
        ]
        d['基本信息']['参考链接'] = refs
        save_case(fpath, d)
        results.append(f'  [欧美真实] {fname}: 补全 {len(refs)} 条链接')
    
    return results

# ============================================================
# P0 批次3：影视类
# ============================================================
def fix_movies():
    results = []
    movie_dir = os.path.join(base, '影视')
    
    china_missing = [
        '唐人街探案.json', '目击者之追凶.json', '血观音.json', '误杀.json'
    ]
    for fname in china_missing:
        fpath = os.path.join(movie_dir, '中国', fname)
        if not os.path.exists(fpath):
            continue
        d = load_case(fpath)
        if d.get('基本信息', {}).get('参考链接'):
            continue
        name = get_case_name(d)
        refs = [
            {'标题': f'维基百科 - {name}', 'URL': wiki_url(name), '类型': '维基百科'},
            {'标题': f'豆瓣电影 - 搜索《{name}》', 'URL': douban_movie_search(name), '类型': '豆瓣'},
        ]
        d['基本信息']['参考链接'] = refs
        save_case(fpath, d)
        results.append(f'  [中国影视] {fname}: 补全 {len(refs)} 条链接')
    
    japan_missing = [
        '怒.json', '愚行录.json', '白雪公主杀人事件.json', '祈祷落幕时.json'
    ]
    for fname in japan_missing:
        fpath = os.path.join(movie_dir, '日本', fname)
        if not os.path.exists(fpath):
            continue
        d = load_case(fpath)
        if d.get('基本信息', {}).get('参考链接'):
            continue
        name = get_case_name(d)
        refs = [
            {'标题': f'维基百科 - {name}', 'URL': wiki_url(name), '类型': '维基百科'},
            {'标题': f'豆瓣电影 - 搜索《{name}》', 'URL': douban_movie_search(name), '类型': '豆瓣'},
        ]
        d['基本信息']['参考链接'] = refs
        save_case(fpath, d)
        results.append(f'  [日本影视] {fname}: 补全 {len(refs)} 条链接')
    
    europe_missing = [
        '冰血暴.json', '小岛惊魂.json', '恐怖游轮.json', '搏击俱乐部.json',
        '看不见的客人.json', '禁闭岛.json', '穆赫兰道.json', '第六感.json',
        '老无所依.json', '致命ID.json', '致命魔术.json', '记忆碎片.json'
    ]
    for fname in europe_missing:
        fpath = os.path.join(movie_dir, '欧美', fname)
        if not os.path.exists(fpath):
            continue
        d = load_case(fpath)
        if d.get('基本信息', {}).get('参考链接'):
            continue
        name = get_case_name(d)
        refs = [
            {'标题': f'维基百科 - {name}', 'URL': wiki_url(name), '类型': '维基百科'},
            {'标题': f'豆瓣电影 - 搜索《{name}》', 'URL': douban_movie_search(name), '类型': '豆瓣'},
            {'标题': f'IMDb - 搜索 {name}', 'URL': imdb_search(name), '类型': 'IMDb'},
        ]
        d['基本信息']['参考链接'] = refs
        save_case(fpath, d)
        results.append(f'  [欧美影视] {fname}: 补全 {len(refs)} 条链接')
    
    return results

# ============================================================
# P0 批次4：游戏类
# ============================================================
def fix_games():
    results = []
    game_dir = os.path.join(base, '游戏')
    
    japan_missing = [
        '428：被封锁的涩谷.json', '428：被封锁的涩谷（续）.json',
        '命运石之门.json', '大逆转裁判.json',
        '弹丸论破2：再见绝望学园.json', '弹丸论破V3.json',
        '恐怖惊魂夜.json', '极限脱出2：善人死亡.json',
        '极限脱出：9小时9个人9扇门.json', '逆转检事.json',
        '逆转裁判2：再见，逆转.json'
    ]
    for fname in japan_missing:
        fpath = os.path.join(game_dir, '日本', fname)
        if not os.path.exists(fpath):
            continue
        d = load_case(fpath)
        if d.get('基本信息', {}).get('参考链接'):
            continue
        name = get_case_name(d)
        refs = [
            {'标题': f'维基百科 - {name}', 'URL': wiki_url(name), '类型': '维基百科'},
            {'标题': f'Steam - 搜索 {name}', 'URL': steam_search(name), '类型': 'Steam'},
        ]
        d['基本信息']['参考链接'] = refs
        save_case(fpath, d)
        results.append(f'  [日本游戏] {fname}: 补全 {len(refs)} 条链接')
    
    europe_missing = [
        '万众狂欢.json', '与狼同行.json', '伊森卡特的消失.json',
        '塔科马.json', '奇异人生.json', '暴雨.json',
        '福尔摩斯：罪与罚.json', '行尸走肉（第一季）.json', '黑色洛城.json'
    ]
    for fname in europe_missing:
        fpath = os.path.join(game_dir, '欧美', fname)
        if not os.path.exists(fpath):
            continue
        d = load_case(fpath)
        if d.get('基本信息', {}).get('参考链接'):
            continue
        name = get_case_name(d)
        refs = [
            {'标题': f'维基百科 - {name}', 'URL': wiki_url(name), '类型': '维基百科'},
            {'标题': f'Steam - 搜索 {name}', 'URL': steam_search(name), '类型': 'Steam'},
        ]
        d['基本信息']['参考链接'] = refs
        save_case(fpath, d)
        results.append(f'  [欧美游戏] {fname}: 补全 {len(refs)} 条链接')
    
    return results

# ============================================================
# 主执行
# ============================================================
if __name__ == '__main__':
    all_results = []
    
    print('=== P0 批次1：推理小说类 ===')
    r1 = fix_mystery_novels()
    all_results.extend(r1)
    for line in r1:
        print(line)
    print(f'  小计: {len(r1)} 个案件\n')
    
    print('=== P0 批次2：真实案件类 ===')
    r2 = fix_real_cases()
    all_results.extend(r2)
    for line in r2:
        print(line)
    print(f'  小计: {len(r2)} 个案件\n')
    
    print('=== P0 批次3：影视类 ===')
    r3 = fix_movies()
    all_results.extend(r3)
    for line in r3:
        print(line)
    print(f'  小计: {len(r3)} 个案件\n')
    
    print('=== P0 批次4：游戏类 ===')
    r4 = fix_games()
    all_results.extend(r4)
    for line in r4:
        print(line)
    print(f'  小计: {len(r4)} 个案件\n')
    
    print(f'=== 总计补全: {len(all_results)} 个案件 ===')
    
    # 保存结果到文件
    with open(r'E:\Work\AIProjects\fun_detective\ref_fix_results.txt', 'w', encoding='utf-8') as f:
        f.write(f'总计补全: {len(all_results)} 个案件\n\n')
        f.write('\n'.join(all_results))
