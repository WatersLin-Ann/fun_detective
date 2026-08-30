import json

try:
    with open('temp_batch2.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print('JSON 格式正确')
    print('共', len(data['create_records']), '个案例')
except json.JSONDecodeError as e:
    print('JSON 错误:', e)
    print('错误位置: 行', e.lineno, '列', e.colno)
    with open('temp_batch2.json', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    if e.lineno <= len(lines):
        print('错误行内容:', lines[e.lineno-1][:200])
