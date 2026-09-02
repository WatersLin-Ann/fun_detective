import json
import os

base = r'E:\Work\AIProjects\fun_detective\cases'

total = 0
with_ref = 0
without_ref = 0
without_ref_list = []
by_category = {}

for root, dirs, files in os.walk(base):
    for fname in files:
        if not fname.endswith('.json'):
            continue
        fpath = os.path.join(root, fname)
        rel = os.path.relpath(fpath, base)
        # category is first directory
        parts = rel.split(os.sep)
        category = parts[0] if len(parts) > 1 else 'root'
        
        try:
            with open(fpath, encoding='utf-8') as f:
                d = json.load(f)
        except Exception as e:
            continue
        
        total += 1
        ref = d.get('基本信息', {}).get('参考链接')
        has_ref = bool(ref and len(ref) > 0)
        
        if category not in by_category:
            by_category[category] = {'total': 0, 'with_ref': 0}
        by_category[category]['total'] += 1
        
        if has_ref:
            with_ref += 1
            by_category[category]['with_ref'] += 1
        else:
            without_ref += 1
            without_ref_list.append(rel)

lines = []
lines.append(f'Total cases: {total}')
lines.append(f'With reference links: {with_ref} ({with_ref*100//total if total else 0}%)')
lines.append(f'Without reference links: {without_ref} ({without_ref*100//total if total else 0}%)')
lines.append('')
lines.append('=== By category ===')
for cat, stats in sorted(by_category.items()):
    pct = stats['with_ref']*100//stats['total'] if stats['total'] else 0
    lines.append(f"{cat}: {stats['with_ref']}/{stats['total']} ({pct}%)")
lines.append('')
lines.append('=== Cases WITHOUT reference links ===')
for item in sorted(without_ref_list):
    lines.append(item)

with open(r'E:\Work\AIProjects\fun_detective\scan_result.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print('Done. Total:', total, 'Without ref:', without_ref)
