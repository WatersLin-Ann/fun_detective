#!/usr/bin/env python3
"""P0修复：人物关系和关键时间线数组转字符串"""
import json, os

CASES_DIR = r'E:\Work\AIProjects\fun_detective\cases'
fixed_pr = 0
fixed_tl = 0
errors = []

for root, dirs, files in os.walk(CASES_DIR):
    for f in files:
        if not f.endswith('.json'):
            continue
        path = os.path.join(root, f)
        rel = os.path.relpath(path, CASES_DIR).replace('\\', '/')
        try:
            with open(path, 'r', encoding='utf-8') as fp:
                data = json.load(fp)
            
            story = data.get('故事视图', {})
            modified = False
            
            # 人物关系：数组转字符串
            pr = story.get('人物关系')
            if isinstance(pr, list):
                lines = []
                for item in pr:
                    if isinstance(item, dict):
                        name = item.get('姓名', '')
                        role = item.get('角色', '')
                        desc = item.get('简介', '')
                        if role:
                            lines.append(f'**{name}**（{role}）：{desc}')
                        else:
                            lines.append(f'**{name}**：{desc}')
                    elif isinstance(item, str):
                        lines.append(item)
                story['人物关系'] = '\n'.join(lines)
                modified = True
                fixed_pr += 1
            
            # 关键时间线：数组转字符串
            tl = story.get('关键时间线')
            if isinstance(tl, list):
                lines = []
                for item in tl:
                    if isinstance(item, dict):
                        time = item.get('时间', '')
                        event = item.get('事件', '')
                        lines.append(f'**{time}**：{event}')
                    elif isinstance(item, str):
                        lines.append(item)
                story['关键时间线'] = '\n'.join(lines)
                modified = True
                fixed_tl += 1
            
            if modified:
                data['故事视图'] = story
                with open(path, 'w', encoding='utf-8') as fp:
                    json.dump(data, fp, ensure_ascii=False, indent=2)
                    fp.write('\n')
                print(f'  修复: {rel}')
        except Exception as e:
            errors.append(f'{rel}: {e}')

print(f'\n人物关系修复: {fixed_pr} 个')
print(f'关键时间线修复: {fixed_tl} 个')
if errors:
    print(f'错误: {len(errors)} 个')
    for e in errors:
        print(f'  {e}')
