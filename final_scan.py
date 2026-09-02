import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

base = r'E:\Work\AIProjects\fun_detective\cases'

total = 0
with_ref = 0
with_video = 0
by_category = {}

for root, dirs, files in os.walk(base):
    for fname in files:
        if not fname.endswith('.json'):
            continue
        fpath = os.path.join(root, fname)
        rel = os.path.relpath(fpath, base)
        parts = rel.split(os.sep)
        category = parts[0] if len(parts) > 1 else 'root'
        
        try:
            with open(fpath, encoding='utf-8') as f:
                d = json.load(f)
        except:
            continue
        
        total += 1
        ref = d.get('基本信息', {}).get('参考链接')
        video = d.get('基本信息', {}).get('推荐视频')
        has_ref = bool(ref and len(ref) > 0)
        has_video = bool(video and len(video) > 0)
        
        if category not in by_category:
            by_category[category] = {'total': 0, 'with_ref': 0, 'with_video': 0}
        by_category[category]['total'] += 1
        
        if has_ref:
            with_ref += 1
            by_category[category]['with_ref'] += 1
        if has_video:
            with_video += 1
            by_category[category]['with_video'] += 1

lines = []
lines.append(f'Total cases: {total}')
lines.append(f'With reference links: {with_ref} ({with_ref*100//total}%)')
lines.append(f'Without reference links: {total - with_ref} ({(total-with_ref)*100//total}%)')
lines.append(f'With video recommendations: {with_video} ({with_video*100//total}%)')
lines.append('')
lines.append('=== By category ===')
for cat, stats in sorted(by_category.items()):
    ref_pct = stats['with_ref']*100//stats['total'] if stats['total'] else 0
    vid_pct = stats['with_video']*100//stats['total'] if stats['total'] else 0
    lines.append(f"{cat}: ref={stats['with_ref']}/{stats['total']} ({ref_pct}%), video={stats['with_video']}/{stats['total']} ({vid_pct}%)")

result = '\n'.join(lines)
print(result)

with open(r'E:\Work\AIProjects\fun_detective\final_scan_result.txt', 'w', encoding='utf-8') as f:
    f.write(result)
